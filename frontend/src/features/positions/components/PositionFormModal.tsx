import { FormModal } from '@/shared/components/form';
import { Input } from '@/shared/components/inputs';
import type { PositionFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import { useMutation } from '@apollo/client/react';
import {
  CREATE_POSITION,
  POSITION_MUTATION_OPTIONS,
  UPDATE_POSITION,
} from '@/features/positions/api/positions.operations';
import { type PositionFormValues, positionSchema } from '@/features/positions/lib/position.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: PositionFieldsFragment;
};
export const PositionFormModal = ({ open, onOpenChange, position }: Props) => {
  const t = useTranslations('positions');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => positionSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: { name: '' } });

  const [createPosition] = useMutation(CREATE_POSITION, POSITION_MUTATION_OPTIONS);
  const [updatePosition] = useMutation(UPDATE_POSITION, POSITION_MUTATION_OPTIONS);

  const handleSubmit = (values: PositionFormValues) => {
    return position
      ? updatePosition({ variables: { input: { ...values, id: position.id } } })
      : createPosition({ variables: { input: values } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={position ? t('edit.title') : t('create.title')}
      form={form}
      mode={position ? 'update' : 'create'}
      values={{ name: position?.name ?? '' }}
      requireDirty={!!position}
    >
      <Input
        label={t('fields.name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
    </FormModal>
  );
};
