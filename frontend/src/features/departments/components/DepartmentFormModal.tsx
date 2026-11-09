import { FormModal } from '@/shared/components/form';
import { Input } from '@/shared/components/inputs';
import type { DepartmentFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  type DepartmentFormValues,
  departmentSchema,
} from '@/features/departments/lib/department.schema';
import { useAppForm } from '@/shared/lib/form';
import { useMutation } from '@apollo/client/react';
import {
  CREATE_DEPARTMENT,
  DEPARTMENT_MUTATION_OPTIONS,
  UPDATE_DEPARTMENT,
} from '@/features/departments/api/departments.operations';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentFieldsFragment;
};
export const DepartmentFormModal = ({ open, onOpenChange, department }: Props) => {
  const t = useTranslations('departments');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => departmentSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: { name: '' } });

  const [createDepartment] = useMutation(CREATE_DEPARTMENT, DEPARTMENT_MUTATION_OPTIONS);
  const [updateDepartment] = useMutation(UPDATE_DEPARTMENT, DEPARTMENT_MUTATION_OPTIONS);

  const handleSubmit = (values: DepartmentFormValues) => {
    return department
      ? updateDepartment({ variables: { input: { ...values, id: department.id } } })
      : createDepartment({ variables: { input: values } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={department ? t('edit.title') : t('create.title')}
      form={form}
      mode={department ? 'update' : 'create'}
      values={{ name: department?.name ?? '' }}
      requireDirty={!!department}
    >
      <Input
        label={t('fields.name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
    </FormModal>
  );
};
