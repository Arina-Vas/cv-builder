import { Dialog } from '@/shared/components/dialog';
import { type ReactNode, useLayoutEffect, useState, useId } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
  type Path,
  FormProvider,
} from 'react-hook-form';
import { Button } from '@/shared/components/buttons';
import { parseError, type ErrorCode, type ErrorReason } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useTranslations } from 'next-intl';
import layout from './FormLayout.module.css';

// A string for the whole code, or a text per field (CONFLICT on `name` and on `iso` differ)
type ErrorMessages<TInput extends FieldValues> = Partial<
  Record<ErrorCode, string | Partial<Record<Path<TInput>, string>>>
>;

type Props<TInput extends FieldValues, TOutput extends FieldValues> = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TOutput) => Promise<unknown>;
  title: string;
  form: UseFormReturn<TInput, unknown, TOutput>;
  values: DefaultValues<TInput>;
  mode?: 'create' | 'update';
  requireDirty?: boolean;
  submitLabel?: string;
  size?: 'sm' | 'md';
  // layout of the fields, set on <form>: FormLayout.module.css `grid` (+ `full` on a field) or own
  className?: string;
  errorMessages?: ErrorMessages<TInput>;
  // A text per extensions.reason; wins over errorMessages (OPERATION_NOT_ALLOWED: SELF vs LAST_ADMIN)
  reasonMessages?: Partial<Record<ErrorReason, string>>;
};

export const FormModal = <TInput extends FieldValues, TOutput extends FieldValues>({
  values,
  requireDirty = false,
  mode = 'create',
  children,
  onOpenChange,
  open,
  onSubmit,
  title,
  form,
  submitLabel,
  size = 'sm',
  className,
  errorMessages,
  reasonMessages,
}: Props<TInput, TOutput>) => {
  const [submitError, setSubmitError] = useState<string>();
  const { isValid, isDirty, isSubmitting } = form.formState;

  const t = useTranslations('common.actions');
  const formId = useId();
  const errorMessage = useErrorMessage();

  useLayoutEffect(() => {
    if (open) {
      form.reset(values);
    }
    // only on opening: values is a new object on every render and would wipe the input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSubmitError(undefined);
    onOpenChange(next);
  };

  const handleSubmit = form.handleSubmit(async (submitted) => {
    setSubmitError(undefined);
    try {
      await onSubmit(submitted);
      handleOpenChange(false);
    } catch (error) {
      const appError = parseError(error);
      const field = Object.keys(appError.fieldErrors).find(
        (name): name is Path<TInput> => name in form.getValues(),
      );

      const byReason = appError.reason && reasonMessages?.[appError.reason];
      const custom = appError.code && errorMessages?.[appError.code];
      const byCode = typeof custom === 'string' ? custom : field && custom?.[field];
      const message = byReason ?? byCode ?? errorMessage(appError);

      if (field) {
        form.setError(field, { type: 'server', message }, { shouldFocus: true });
      } else {
        setSubmitError(message);
      }
    }
  });

  const footer = (
    <>
      <Button variant={'secondary'} disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
        {t('cancel')}
      </Button>
      <Button
        variant={'primary'}
        type={'submit'}
        form={formId}
        loading={isSubmitting}
        // wiki: CREATE / ADD disabled until the form is valid; with requireDirty also until something changes
        disabled={!isValid || (requireDirty && !isDirty)}
      >
        {submitLabel ?? (mode === 'update' ? t('update') : t('create'))}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      size={size}
      footer={footer}
      error={submitError}
      preventClose={isSubmitting}
    >
      <FormProvider {...form}>
        <form id={formId} noValidate onSubmit={handleSubmit} className={className ?? layout.stack}>
          {children}
        </form>
      </FormProvider>
    </Dialog>
  );
};
