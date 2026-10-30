import { useState, type ChangeEvent } from 'react';

import { hasErrors, type FieldErrors, type ValidationT } from './validation';
import { useTranslations } from 'next-intl';

export function useFormFields<TField extends string>(
  initialValues: Record<TField, string>,
  validate: (values: Record<TField, string>, t: ValidationT) => FieldErrors<TField>,
) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<TField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors<TField>>({});

  const t = useTranslations('validation');

  const errors = validate(values, t);

  const getError = (field: TField) =>
    serverErrors[field] ?? (touched[field] ? errors[field] : undefined);

  const register = (field: TField) => ({
    name: field,
    value: values[field],
    error: getError(field),
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
    register,
    setServerErrors,
  };
}
