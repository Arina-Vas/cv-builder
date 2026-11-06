import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { ConfirmDialog } from '@/shared/components/dialog';
import type { DepartmentFieldsFragment } from '@/gql/graphql';
import {
  DELETE_DEPARTMENT,
  DEPARTMENT_MUTATION_OPTIONS,
} from '@/features/departments/api/departments.operations';
import { useMutation } from '@apollo/client/react';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useTranslations } from 'next-intl';

type Props = {
  onClose: () => void;
  onDeleted: () => void;
  department: DepartmentFieldsFragment | null;
};
export const DeleteDepartmentDialog = ({ onClose, department, onDeleted }: Props) => {
  const t = useTranslations('departments');
  const errorMessage = useErrorMessage();

  const [deleteDepartment, { loading: deleting, error: deleteError, reset: resetDelete }] =
    useMutation(DELETE_DEPARTMENT, DEPARTMENT_MUTATION_OPTIONS);

  const handleClose = () => {
    resetDelete();
    onClose();
  };

  const handleDelete = async () => {
    if (!department) return;
    try {
      await deleteDepartment({ variables: { id: department.id } });
    } catch (error) {
      if (parseError(error).code !== 'ENTITY_IN_USE') console.error(error);
      return;
    }

    onDeleted();
    handleClose();
  };

  return (
    <ConfirmDialog
      title={t('delete.title')}
      open={!!department}
      onOpenChange={(open) => !open && handleClose()}
      message={t.rich('delete.message', {
        name: department?.name ?? '',
        b: (chunks) => <strong>{chunks}</strong>,
      })}
      onConfirm={handleDelete}
      error={deleteError && errorMessage(parseError(deleteError))}
      loading={deleting}
    />
  );
};
