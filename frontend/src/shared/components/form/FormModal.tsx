import { Dialog } from '@/shared/components/dialog';
import { type ReactNode, useLayoutEffect, useState, useId } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
  FormProvider,
} from 'react-hook-form';
import { Button } from '@/shared/components/buttons';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useTranslations } from 'next-intl';
import layout from './FormLayout.module.css';

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
      setSubmitError(errorMessage(parseError(error)));
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
        disabled={!isValid || (requireDirty && !isDirty)}
      >
        {submitLabel ?? (mode === 'update' ? t('save') : t('create'))}
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
