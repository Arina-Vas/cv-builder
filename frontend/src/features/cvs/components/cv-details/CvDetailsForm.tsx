import { CvFields } from '@/features/cvs/components/CvFields';
import { Button } from '@/shared/components/buttons';
import type { CvFormValues } from '@/features/cvs/lib/cv.schema';
import { cvSchema } from '@/features/cvs/lib/cv.schema';
import { useTranslations } from 'next-intl';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CV, CV_MUTATION_OPTIONS, UPDATE_CV } from '@/features/cvs/api/cvs.operations';
import { useAppForm } from '@/shared/lib/form';
import { type CvFieldsFragment } from '@/gql/graphql';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import type { Path } from 'react-hook-form';
import layout from '@/shared/components/form/FormLayout.module.css';
import s from './CvDetails.module.css';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';

type Props = {
  cv: CvFieldsFragment;
};

const toFormValues = (cv: CvFieldsFragment): CvFormValues => ({
  name: cv.name,
  education: cv.education,
  description: cv.description,
});

export const CvDetailsForm = ({ cv }: Props) => {
  const t = useTranslations('cvs');
  const tActions = useTranslations('common.actions');
  const tValidation = useTranslations('validation');

  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string>();

  const withRefetch = useRefetchOnError([CV], ['NOT_FOUND']);
  const [updateCv] = useMutation(UPDATE_CV, CV_MUTATION_OPTIONS);

  const schema = useMemo(() => cvSchema(tValidation), [tValidation]);

  const form = useAppForm({ schema, defaultValues: toFormValues(cv) });

  const { isDirty, isValid, isSubmitting } = form.formState;

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      const { data } = await withRefetch(() =>
        updateCv({ variables: { input: { ...values, id: cv.id, userId: cv.user.id } } }),
      );
      form.reset(data ? toFormValues(data.updateCv) : values);
      toast.success(t('details.updated'));
    } catch (error) {
      const appError = parseError(error);
      const message = errorMessage(appError);
      const field = Object.keys(appError.fieldErrors).find(
        (name): name is Path<CvFormValues> => name in form.getValues(),
      );

      if (field) {
        form.setError(field, { type: 'server', message }, { shouldFocus: true });
      } else {
        setSubmitError(message);
      }
    }
  });

  return (
    <form className={`${layout.stack} ${s.form}`} noValidate onSubmit={handleSubmit}>
      <CvFields form={form} />
      <div className={s.actions}>
        {submitError && (
          <p className={s.submitError} role="alert">
            {submitError}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          gated
          loading={isSubmitting}
          disabled={!isDirty || !isValid}
        >
          {tActions('update')}
        </Button>
      </div>
    </form>
  );
};
