import { FormModal } from '@/shared/components/form';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import { useMutation } from '@apollo/client/react';
import { cvSchema, type CvFormValues } from '@/features/cvs/lib/cv.schema';
import {
  CREATE_CV,
  CV_MUTATION_OPTIONS,
  CVS,
  UPDATE_CV,
  USER_CVS,
} from '@/features/cvs/api/cvs.operations';
import type { CvFieldsFragment } from '@/gql/graphql';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { CvFields } from '@/features/cvs/components/CvFields';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv?: CvFieldsFragment;
  userId: string;
};

export const CvFormModal = ({ open, onOpenChange, cv, userId }: Props) => {
  const t = useTranslations('cvs');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => cvSchema(tValidation), [tValidation]);
  const form = useAppForm({
    schema,
    defaultValues: {
      name: '',
      education: '',
      description: '',
    },
  });
  const withRefetch = useRefetchOnError([CVS, USER_CVS], ['NOT_FOUND']);

  const [createCv] = useMutation(CREATE_CV, CV_MUTATION_OPTIONS);
  const [updateCv] = useMutation(UPDATE_CV, CV_MUTATION_OPTIONS);

  const handleSubmit = (values: CvFormValues) => {
    return cv
      ? withRefetch(() =>
          updateCv({ variables: { input: { ...values, id: cv.id, userId: cv.user.id } } }),
        )
      : createCv({ variables: { input: { ...values, userId } } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={cv ? t('update.title') : t('create.title')}
      form={form}
      mode={cv ? 'update' : 'create'}
      values={{
        name: cv?.name ?? '',
        description: cv?.description ?? '',
        education: cv?.education ?? '',
      }}
      requireDirty={!!cv}
      size="sm"
    >
      <CvFields form={form} />
    </FormModal>
  );
};
