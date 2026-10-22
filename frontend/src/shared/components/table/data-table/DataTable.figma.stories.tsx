import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Avatar } from '@/shared/components/avatar/Avatar';
import { Chip } from '@/shared/components/chip/Chip';

import { cvProjects, type CvProjectRow } from '../__fixtures__/cvProjects';
import { cvs, type CvRow } from '../__fixtures__/cvs';
import { departments, type DepartmentRow } from '../__fixtures__/departments';
import { languages, type LanguageRow } from '../__fixtures__/languages';
import { positions, type PositionRow } from '../__fixtures__/positions';
import { projects, type ProjectRow } from '../__fixtures__/projects';
import { skills, type SkillRow } from '../__fixtures__/skills';
import { users, type UserRow } from '../__fixtures__/users';
import type { Column, DataTableProps, RowAction, SortState } from '../types';
import { DataTable } from './DataTable';

// One story per Figma frame (page "1440px Desktop") that uses a table
const FIGMA_FILE = 'https://www.figma.com/design/m3zxmLv79A6MsHCuAIQAoo/CV-Builder';
const figma = (frame: string, nodeId?: string) => ({
  docs: {
    description: {
      story: `Figma frame **${frame}**: ${nodeId ? `${FIGMA_FILE}?node-id=${nodeId}` : FIGMA_FILE}`,
    },
  },
});

const meta = {
  title: 'Shared/DataTable/Figma',
  // Full-width table as on the app pages
  parameters: { layout: 'padded', controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const actions =
  <T,>(...labels: string[]) =>
  (): RowAction<T>[] =>
    labels.map((label) => ({ label, onSelect: fn() }));

// 2025-12-31 → 12/31/2025, as in Figma
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
};

interface FigmaTableProps<T> extends Omit<DataTableProps<T>, 'sort' | 'onSortChange'> {
  initialSort?: SortState;
  getSortValue?: (row: T, field: string) => string;
}

// Stands in for backend sorting: sorts the fixture by the clicked column
function FigmaTable<T>({
  rows,
  initialSort,
  getSortValue = (row, field) => String((row as Record<string, unknown>)[field] ?? ''),
  ...rest
}: FigmaTableProps<T>) {
  const [sort, setSort] = useState(initialSort);

  const sortedRows = sort
    ? [...rows].sort(
        (a, b) =>
          getSortValue(a, sort.field).localeCompare(getSortValue(b, sort.field)) *
          (sort.order === 'ASC' ? 1 : -1),
      )
    : rows;

  return (
    <DataTable
      {...rest}
      rows={sortedRows}
      sort={sort}
      onSortChange={initialSort ? setSort : undefined}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const userColumns: Column<UserRow>[] = [
  // 40px avatar + 16px cell padding on both sides
  {
    key: 'avatar',
    header: '',
    width: '72px',
    render: (user) => <Avatar fallback={user.firstName} src={user.avatarUrl} size="md" />,
  },
  { key: 'firstName', header: 'First Name', sortable: true, render: (user) => user.firstName },
  { key: 'lastName', header: 'Last Name', sortable: true, render: (user) => user.lastName },
  { key: 'email', header: 'Email', render: (user) => user.email },
  { key: 'department', header: 'Department', sortable: true, render: (user) => user.department },
  { key: 'position', header: 'Position', sortable: true, render: (user) => user.position },
];

export const Users: Story = {
  name: 'USERS',
  parameters: figma('USERS', '21482-1632'),
  render: () => (
    <FigmaTable<UserRow>
      columns={userColumns}
      rows={users}
      getRowId={(user) => user.id}
      caption="Employees"
      emptyMessage="No users found"
      initialSort={{ field: 'department', order: 'ASC' }}
      onRowClick={fn()}
      getRowLabel={(user) => `${user.firstName} ${user.lastName}`}
    />
  ),
};

export const UsersAdmin: Story = {
  name: 'USERS (admin)',
  parameters: figma('USERS (admin)', '21482-6755'),
  render: () => (
    <FigmaTable<UserRow>
      columns={userColumns}
      rows={users}
      getRowId={(user) => user.id}
      caption="Employees"
      emptyMessage="No users found"
      initialSort={{ field: 'department', order: 'ASC' }}
      rowActions={actions('View', 'Update', 'Delete')}
      getRowLabel={(user) => `${user.firstName} ${user.lastName}`}
    />
  ),
};

/* ------------------------------------------------------------------ */
/* CVs                                                                 */
/* ------------------------------------------------------------------ */

const cvColumns: Column<CvRow>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (cv) => cv.name },
  { key: 'education', header: 'Education', render: (cv) => cv.education },
  { key: 'employeeEmail', header: 'Employee', render: (cv) => cv.employeeEmail },
];

const cvTableProps = {
  columns: cvColumns,
  rows: cvs,
  getRowId: (cv: CvRow) => cv.id,
  caption: 'CVs',
  emptyMessage: 'No CVs found',
  initialSort: { field: 'name', order: 'ASC' } satisfies SortState,
  rowActions: actions<CvRow>('View', 'Edit', 'Delete'),
  getRowLabel: (cv: CvRow) => cv.name,
  renderRowDetails: (cv: CvRow) => cv.description,
};

export const UserCvsAdmin: Story = {
  name: 'USER CVS (admin)',
  parameters: figma('USER CVS (admin)', '21482-30549'),
  render: () => <FigmaTable<CvRow> {...cvTableProps} />,
};

export const Cvs: Story = {
  name: 'CVS',
  parameters: figma('CVS', '21482-32412'),
  render: () => <FigmaTable<CvRow> {...cvTableProps} />,
};

/* ------------------------------------------------------------------ */
/* Catalogs (admin)                                                    */
/* ------------------------------------------------------------------ */

export const SkillsAdmin: Story = {
  name: 'SKILLS (admin)',
  parameters: figma('SKILLS (admin)', '21482-11676'),
  render: () => (
    <FigmaTable<SkillRow>
      columns={[
        { key: 'name', header: 'Name', sortable: true, render: (skill) => skill.name },
        { key: 'type', header: 'Type', render: (skill) => skill.type },
        { key: 'category', header: 'Category', render: (skill) => skill.category },
      ]}
      rows={skills}
      getRowId={(skill) => skill.id}
      caption="Skills"
      emptyMessage="No skills found"
      initialSort={{ field: 'name', order: 'ASC' }}
      rowActions={actions('Edit', 'Delete')}
      getRowLabel={(skill) => skill.name}
    />
  ),
};

export const LanguagesAdmin: Story = {
  name: 'LANGUAGES (admin)',
  parameters: figma('LANGUAGES (admin)', '21482-12074'),
  render: () => (
    <FigmaTable<LanguageRow>
      columns={[
        { key: 'name', header: 'Name', sortable: true, render: (language) => language.name },
        { key: 'iso', header: 'ISO', sortable: true, render: (language) => language.iso },
        { key: 'nativeName', header: 'Native name', render: (language) => language.nativeName },
      ]}
      rows={languages}
      getRowId={(language) => language.id}
      caption="Languages"
      emptyMessage="No languages found"
      initialSort={{ field: 'name', order: 'ASC' }}
      rowActions={actions('Edit', 'Delete')}
      getRowLabel={(language) => language.name}
    />
  ),
};

export const DepartmentsAdmin: Story = {
  name: 'DEPARTMENTS (admin)',
  parameters: figma('DEPARTMENTS (admin)', '21482-34947'),
  render: () => (
    <FigmaTable<DepartmentRow>
      columns={[{ key: 'name', header: 'Name', sortable: true, render: (row) => row.name }]}
      rows={departments}
      getRowId={(row) => row.id}
      caption="Departments"
      emptyMessage="No departments found"
      initialSort={{ field: 'name', order: 'ASC' }}
      rowActions={actions('Edit', 'Delete')}
      getRowLabel={(row) => row.name}
    />
  ),
};

export const PositionsAdmin: Story = {
  name: 'POSITIONS (admin)',
  parameters: figma('POSITIONS (admin)', '21482-36171'),
  render: () => (
    <FigmaTable<PositionRow>
      columns={[{ key: 'name', header: 'Name', sortable: true, render: (row) => row.name }]}
      rows={positions}
      getRowId={(row) => row.id}
      caption="Positions"
      emptyMessage="No positions found"
      initialSort={{ field: 'name', order: 'ASC' }}
      rowActions={actions('Edit', 'Delete')}
      getRowLabel={(row) => row.name}
    />
  ),
};

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const chipListStyle = { display: 'flex', flexWrap: 'wrap', gap: 'var(--chip-gap)' } as const;

export const ProjectsAdmin: Story = {
  name: 'PROJECTS (admin)',
  parameters: figma('PROJECTS (admin)'),
  render: () => (
    <FigmaTable<ProjectRow>
      columns={[
        { key: 'name', header: 'Name', sortable: true, render: (project) => project.name },
        { key: 'domain', header: 'Domain', render: (project) => project.domain },
        {
          key: 'startDate',
          header: 'Start Date',
          sortable: true,
          render: (project) => formatDate(project.startDate),
        },
        {
          key: 'endDate',
          header: 'End Date',
          sortable: true,
          render: (project) => formatDate(project.endDate),
        },
      ]}
      rows={projects}
      getRowId={(project) => project.id}
      caption="Projects"
      emptyMessage="No projects found"
      initialSort={{ field: 'name', order: 'ASC' }}
      rowActions={actions('Update', 'Delete')}
      getRowLabel={(project) => project.name}
      // TODO: description ↔ chips spacing not measured in Figma yet
      renderRowDetails={(project) => (
        <>
          <p style={{ margin: 0 }}>{project.description}</p>
          <div style={{ ...chipListStyle, marginTop: 'var(--space-2)' }}>
            {project.environment.map((technology) => (
              <Chip key={technology} label={technology} />
            ))}
          </div>
        </>
      )}
    />
  ),
};

// TODO: Figma uses grey filled chips for responsibilities; the shared Chip is outlined only
const FilledChipPlaceholder = ({ label }: { label: string }) => (
  <span
    style={{
      padding: '0 var(--space-2)',
      borderRadius: 'var(--radius-chip)',
      background: 'var(--chip-bg)',
      color: 'var(--chip-text)',
      fontSize: 'var(--type-body2-size)',
    }}
  >
    {label}
  </span>
);

export const CvProjects: Story = {
  name: 'CV PROJECTS',
  parameters: figma('CV PROJECTS', '21482-33925'),
  render: () => (
    <FigmaTable<CvProjectRow>
      columns={[
        { key: 'name', header: 'Name', sortable: true, render: (project) => project.name },
        { key: 'domain', header: 'Domain', render: (project) => project.domain },
        {
          key: 'startDate',
          header: 'Start Date',
          sortable: true,
          render: (project) => formatDate(project.startDate),
        },
        {
          key: 'endDate',
          header: 'End Date',
          sortable: true,
          render: (project) => (project.endDate ? formatDate(project.endDate) : 'Till now'),
        },
      ]}
      rows={cvProjects}
      getRowId={(project) => project.id}
      caption="CV projects"
      emptyMessage="No projects added yet"
      initialSort={{ field: 'name', order: 'DESC' }}
      getSortValue={(project, field) =>
        field === 'endDate'
          ? (project.endDate ?? '9999-12-31')
          : String(project[field as keyof CvProjectRow])
      }
      rowActions={actions('Update', 'Delete')}
      getRowLabel={(project) => project.name}
      renderRowDetails={(project) => (
        <>
          <p style={{ margin: 0 }}>{project.description}</p>
          <div style={{ ...chipListStyle, marginTop: 'var(--space-2)' }}>
            {project.responsibilities.map((responsibility) => (
              <FilledChipPlaceholder key={responsibility} label={responsibility} />
            ))}
          </div>
        </>
      )}
    />
  ),
};
