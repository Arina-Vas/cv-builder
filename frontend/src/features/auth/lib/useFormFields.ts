import { useRef, useState, type ChangeEvent } from 'react';

import { hasErrors, type FieldErrors, type ValidationT } from './validation';
import { useTranslations } from 'next-intl';

export function useFormFields<TField extends string>(
  initialValues: Record<TField, string>,
  validate: (values: Record<TField, string>, t: ValidationT) => FieldErrors<TField>,
) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<TField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors<TField>>({});
  const elements = useRef<Partial<Record<TField, HTMLInputElement | null>>>({});

  const t = useTranslations('validation');

  const errors = validate(values, t);
  const fields = Object.keys(initialValues) as TField[];

  const getError = (field: TField) =>
    serverErrors[field] ?? (touched[field] ? errors[field] : undefined);

  // On submit: shows the errors of every field, focuses the first invalid one; true when the form can be sent
  const validateAll = () => {
    setTouched(Object.fromEntries(fields.map((field) => [field, true])) as Record<TField, boolean>);
    const firstInvalid = fields.find((field) => errors[field]);
    if (firstInvalid) elements.current[firstInvalid]?.focus();
    return !firstInvalid;
  };

  const register = (field: TField) => ({
    name: field,
    value: values[field],
    error: getError(field),
    ref: (element: HTMLInputElement | null) => {
      elements.current[field] = element;
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
  });

  return {
    values,
    isValid: !hasErrors(errors),
    validateAll,
    register,
    setServerErrors,
  };
}
