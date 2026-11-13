import { FormModal } from '@/shared/components/form';
import { Input, Textarea } from '@/shared/components/inputs';
import type { ProjectFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import { useMutation, useQuery } from '@apollo/client/react';
import { type ProjectFormValues, projectSchema } from '@/features/projects/lib/project.schema';
import {
  CREATE_PROJECT,
  PROJECT_MUTATION_OPTIONS,
  TECHNOLOGIES,
  UPDATE_PROJECT,
} from '@/features/projects/api/projects.operations';
import { Controller } from 'react-hook-form';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { DatePicker } from '@/shared/components/date-picker/DatePicker';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { MultiSelect } from '@/shared/components/select/multi-select/MultiSelect';
import { format, parseISO } from 'date-fns';
import layout from '@/shared/components/form/FormLayout.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectFieldsFragment;
};
export const ProjectFormModal = ({ open, onOpenChange, project }: Props) => {
  const t = useTranslations('projects');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => projectSchema(tValidation), [tValidation]);
  const form = useAppForm({
    schema,
    defaultValues: {
      name: '',
      domain: '',
      endDate: null,
      startDate: null,
      technologyIds: [],
      description: '',
    },
  });
  const errorMessage = useErrorMessage();

  const { data, error, loading } = useQuery(TECHNOLOGIES, { skip: !open });

  const technologiesOptions = data?.technologies.map((technology) => ({
    value: technology.id,
    label: technology.name,
  }));

  const [createProject] = useMutation(CREATE_PROJECT, PROJECT_MUTATION_OPTIONS);
  const [updateProject] = useMutation(UPDATE_PROJECT, PROJECT_MUTATION_OPTIONS);

  const handleSubmit = (values: ProjectFormValues) => {
    const input = {
      ...values,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
      endDate: format(values.endDate, 'yyyy-MM-dd'),
    };

    return project
      ? updateProject({ variables: { input: { ...input, id: project.id } } })
      : createProject({ variables: { input } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={project ? t('edit.title') : t('create.title')}
      form={form}
      mode={project ? 'update' : 'create'}
      values={{
        name: project?.name ?? '',
        description: project?.description ?? '',
        startDate: project ? parseISO(project.startDate) : null,
        endDate: project ? parseISO(project.endDate) : null,
        domain: project?.domain ?? '',
        technologyIds: project?.technologies.map((t) => t.id) ?? [],
      }}
      requireDirty={!!project}
      size="md"
      className={layout.grid}
    >
      <Input
        label={t('fields.name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Input
        label={t('fields.domain')}
        {...form.register('domain')}
        error={form.formState.errors.domain?.message}
      />
      <Controller
        control={form.control}
        name="startDate"
        rules={{ deps: ['endDate'] }}
        render={({ field, fieldState }) => (
          <DatePicker
            ref={field.ref}
            label={t('fields.startDate')}
            onChange={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="endDate"
        render={({ field, fieldState }) => (
          <DatePicker
            ref={field.ref}
            label={t('fields.endDate')}
            onChange={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Textarea
        label={t('fields.description')}
        {...form.register('description')}
        error={form.formState.errors.description?.message}
        className={layout.full}
      />
      <Controller
        control={form.control}
        name="technologyIds"
        render={({ field, fieldState }) => (
          <MultiSelect
            className={layout.full}
            ref={field.ref}
            name={field.name}
            label={t('fields.environment')}
            options={technologiesOptions ?? []}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={loading}
            error={fieldState.error?.message ?? (error && errorMessage(parseError(error)))}
          />
        )}
      />
    </FormModal>
  );
};
