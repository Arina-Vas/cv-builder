import { useMemo } from 'react';
import { Controller, type DefaultValues } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import type { UserListFieldsFragment } from '@/gql/graphql';
import {
  CREATE_USER,
  UPDATE_USER,
  USER_FORM_OPTIONS,
  USER_MUTATION_OPTIONS,
} from '@/features/users/api/users.operations';
import {
  USER_ROLES,
  type UserFormInput,
  type UserFormValues,
  userSchema,
} from '@/features/users/lib/user.schema';
import { FormModal } from '@/shared/components/form';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Input } from '@/shared/components/inputs';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { useAppForm } from '@/shared/lib/form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserListFieldsFragment;
  isSelf?: boolean;
};

const EMPTY: DefaultValues<UserFormInput> = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  departmentId: '',
  positionId: '',
};

const PASSWORD_PLACEHOLDER = '********';

const toOptions = (items: { id: string; name: string }[] = []): SelectOption[] =>
  items.map((item) => ({ value: item.id, label: item.name }));

export const UserFormModal = ({ open, onOpenChange, user, isSelf = false }: Props) => {
  const t = useTranslations('users');
  const tValidation = useTranslations('validation');
  const mode = user ? 'update' : 'create';
  const isUpdate = mode === 'update';

  const schema = useMemo(() => userSchema(tValidation, mode), [tValidation, mode]);
  const form = useAppForm({ schema, defaultValues: EMPTY });

  const { data: optionsData, loading: optionsLoading } = useQuery(USER_FORM_OPTIONS, {
    skip: !open,
  });
  const departments = useMemo(() => toOptions(optionsData?.departments.items), [optionsData]);
  const positions = useMemo(() => toOptions(optionsData?.positions.items), [optionsData]);
  const roles: SelectOption[] = USER_ROLES.map((role) => ({
    value: role,
    label: t(`roles.${role}`),
  }));

  const [createUser] = useMutation(CREATE_USER, USER_MUTATION_OPTIONS);
  const [updateUser] = useMutation(UPDATE_USER, USER_MUTATION_OPTIONS);

  const handleSubmit = ({ email, password, ...editable }: UserFormValues) =>
    user
      ? updateUser({ variables: { input: { id: user.id, ...editable } } })
      : createUser({ variables: { input: { email, password, ...editable } } });

  const values: DefaultValues<UserFormInput> = user
    ? {
        email: user.email,
        password: PASSWORD_PLACEHOLDER,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        departmentId: user.department?.id ?? '',
        positionId: user.position?.id ?? '',
        role: user.role,
      }
    : EMPTY;

  const { errors } = form.formState;

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={isUpdate ? t('update.title') : t('create.title')}
      form={form}
      mode={mode}
      values={values}
      requireDirty={isUpdate}
      size="md"
      className={layout.grid}
    >
      <Input
        label={t('fields.email')}
        type="email"
        autoComplete="off"
        disabled={isUpdate}
        {...form.register('email')}
        error={errors.email?.message}
      />
      <Input
        label={t('fields.password')}
        type="password"
        autoComplete="new-password"
        disabled={isUpdate}
        {...form.register('password')}
        error={errors.password?.message}
      />
      <Input
        label={t('fields.firstName')}
        {...form.register('firstName')}
        error={errors.firstName?.message}
      />
      <Input
        label={t('fields.lastName')}
        {...form.register('lastName')}
        error={errors.lastName?.message}
      />
      <Controller
        control={form.control}
        name="departmentId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.department')}
            options={departments}
            disabled={optionsLoading}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="positionId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.position')}
            options={positions}
            disabled={optionsLoading}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="role"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.role')}
            options={roles}
            disabled={isSelf}
            value={field.value ?? ''}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    </FormModal>
  );
};
