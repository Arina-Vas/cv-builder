import type { UseFormReturn } from 'react-hook-form';
import { Input, Textarea } from '@/shared/components/inputs';
import { useTranslations } from 'next-intl';
import type { CvFormValues } from '@/features/cvs/lib/cv.schema';

type Props = {
  form: UseFormReturn<CvFormValues>;
};
export const CvFields = ({ form }: Props) => {
  const t = useTranslations('cvs.fields');
  return (
    <>
      <Input
        label={t('name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Input
        label={t('education')}
        {...form.register('education')}
        error={form.formState.errors.education?.message}
      />
      <Textarea
        label={t('description')}
        {...form.register('description')}
        error={form.formState.errors.description?.message}
      />
    </>
  );
};
