import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import type { CvProjectFieldsFragment, ProjectFieldsFragment } from '@/gql/graphql';
import {
  AVAILABLE_CV_PROJECTS,
  CREATE_CV_PROJECT,
  CV_PROJECT_MUTATION_OPTIONS,
  CV_PROJECT_REFETCH_ERROR_CODES,
  CV_PROJECT_REFETCH_QUERIES,
  PROJECT_ROLES,
  UPDATE_CV_PROJECT,
} from '@/features/cv-projects/api/cvProjects.operations';
import {
  type CvProjectFormValues,
  cvProjectSchema,
  type ProjectPeriod,
} from '@/features/cv-projects/lib/cvProject.schema';
import { DatePicker } from '@/shared/components/date-picker/DatePicker';
import { FormModal } from '@/shared/components/form';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Input, Textarea } from '@/shared/components/inputs';
import { MultiSelect } from '@/shared/components/select/multi-select/MultiSelect';
import { Select } from '@/shared/components/select/Select';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { useAppForm } from '@/shared/lib/form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId: string;
  cvProject?: CvProjectFieldsFragment;
};

const toPeriod = (project: ProjectFieldsFragment): ProjectPeriod => ({
  startDate: parseISO(project.startDate),
  endDate: parseISO(project.endDate),
});

const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const CvProjectFormModal = ({ open, onOpenChange, cvId, cvProject }: Props) => {
  const t = useTranslations('cvProjects.form');
  const tValidation = useTranslations('validation');
  const tActions = useTranslations('common.actions');
  const errorMessage = useErrorMessage();
  const withRefetch = useRefetchOnError(CV_PROJECT_REFETCH_QUERIES, CV_PROJECT_REFETCH_ERROR_CODES);

  const {
    data: availableData,
    loading: availableLoading,
    error: availableError,
  } = useQuery(
    AVAILABLE_CV_PROJECTS,
    open && !cvProject ? { variables: { cvId }, fetchPolicy: 'network-only' } : skipToken,
  );

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(PROJECT_ROLES, {
    skip: !open,
  });

  // Update can't change the project: the only option is the one already in the CV
  const projects = useMemo(
    () => (cvProject ? [cvProject.project] : (availableData?.availableCvProjects ?? [])),
    [cvProject, availableData],
  );

  // rebuilt when the projects arrive: useForm takes the new resolver on the next render
  const schema = useMemo(() => {
    const periods = new Map(projects.map((project) => [project.id, toPeriod(project)]));
    return cvProjectSchema(tValidation, (projectId) => periods.get(projectId));
  }, [tValidation, projects]);

  const values = {
    projectId: cvProject?.project.id ?? '',
    startDate: cvProject ? parseISO(cvProject.startDate) : null,
    endDate: cvProject?.endDate ? parseISO(cvProject.endDate) : null,
    roleIds: cvProject?.roles.map((role) => role.id) ?? [],
    responsibilities: cvProject?.responsibilities ?? '',
  };

  const form = useAppForm({ schema, defaultValues: values });

  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const selected = projects.find((project) => project.id === projectId);
  const period = selected && toPeriod(selected);

  const projectOptions = projects.map((project) => ({ value: project.id, label: project.name }));
  const roleOptions =
    rolesData?.projectRoles.map((role) => ({ value: role.id, label: role.name })) ?? [];
  const environmentOptions =
    selected?.technologies.map((technology) => ({
      value: technology.id,
      label: technology.name,
    })) ?? [];

  const [createCvProject] = useMutation(CREATE_CV_PROJECT, CV_PROJECT_MUTATION_OPTIONS);
  const [updateCvProject] = useMutation(UPDATE_CV_PROJECT, CV_PROJECT_MUTATION_OPTIONS);

  const handleSubmit = (formValues: CvProjectFormValues) => {
    const input = {
      cvId,
      startDate: toApiDate(formValues.startDate),
      endDate: formValues.endDate ? toApiDate(formValues.endDate) : null,
      roleIds: formValues.roleIds,
      responsibilities: formValues.responsibilities,
    };

    return withRefetch(() =>
      cvProject
        ? updateCvProject({ variables: { input: { ...input, id: cvProject.id } } })
        : createCvProject({ variables: { input: { ...input, projectId: formValues.projectId } } }),
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={cvProject ? t('updateTitle') : t('addTitle')}
      form={form}
      mode={cvProject ? 'update' : 'create'}
      values={values}
      requireDirty={!!cvProject}
      submitLabel={cvProject ? undefined : tActions('add')}
      errorMessages={{ CONFLICT: t('errors.alreadyAdded') }}
      size="md"
      className={layout.grid}
    >
      <Controller
        control={form.control}
        name="projectId"
        // a new project brings new limits for the dates already picked
        rules={{ deps: ['startDate', 'endDate'] }}
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.project')}
            options={projectOptions}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={availableLoading || !!cvProject}
            error={
              fieldState.error?.message ??
              (availableError && errorMessage(parseError(availableError)))
            }
          />
        )}
      />
      <Input label={t('fields.domain')} value={selected?.domain ?? ''} readOnly disabled />

      <Controller
        control={form.control}
        name="startDate"
        rules={{ deps: ['endDate'] }}
        render={({ field, fieldState }) => (
          <DatePicker
            ref={field.ref}
            label={t('fields.startDate')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            minDate={period?.startDate}
            maxDate={period?.endDate}
            disabled={!selected}
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
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            minDate={startDate ?? period?.startDate}
            maxDate={period?.endDate}
            disabled={!selected}
            error={fieldState.error?.message}
            clearable
          />
        )}
      />

      <Textarea
        label={t('fields.description')}
        value={selected?.description ?? ''}
        readOnly
        disabled
        className={layout.full}
      />
      <MultiSelect
        label={t('fields.environment')}
        options={environmentOptions}
        value={environmentOptions.map((option) => option.value)}
        disabled
        className={layout.full}
      />

      <Controller
        control={form.control}
        name="roleIds"
        render={({ field, fieldState }) => (
          <MultiSelect
            ref={field.ref}
            name={field.name}
            label={t('fields.roles')}
            options={roleOptions}
            value={field.value}
            onValueChange={(ids) => {
              field.onChange(ids);
              field.onBlur();
            }}
            onBlur={field.onBlur}
            disabled={rolesLoading}
            error={
              fieldState.error?.message ?? (rolesError && errorMessage(parseError(rolesError)))
            }
            className={layout.full}
          />
        )}
      />
      <Textarea
        label={t('fields.responsibilities')}
        placeholder={t('responsibilitiesHint')}
        {...form.register('responsibilities')}
        error={form.formState.errors.responsibilities?.message}
        className={layout.full}
      />
    </FormModal>
  );
};
