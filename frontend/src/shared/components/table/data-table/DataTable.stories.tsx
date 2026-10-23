import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useRef, useState } from 'react';
import { fn } from 'storybook/test';

import { Avatar } from '@/shared/components/avatar/Avatar';
import { Chip } from '@/shared/components/chip/Chip';
import { Pagination } from '@/shared/components/pagination';

import { cvs, type CvRow } from '../__fixtures__/cvs';
import { positions, type PositionRow } from '../__fixtures__/positions';
import { projects, type ProjectRow } from '../__fixtures__/projects';
import { users, type UserRow } from '../__fixtures__/users';
import type { Column } from '../types';
import { DataTable } from './DataTable';

const meta = {
  title: 'Shared/DataTable',
  component: DataTable<PositionRow>,
  args: {
    columns: [{ key: 'name', header: 'Name', render: (row) => row.name }],
    rows: positions,
    getRowId: (row) => row.id,
    caption: 'Positions',
    emptyMessage: 'No positions found',
  },
} satisfies Meta<typeof DataTable<PositionRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Loading: Story = {
  args: { isLoading: true },
};

export const Empty: Story = {
  args: { rows: [] },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    error: 'Failed to load positions',
    onRetry: fn(),
  },
};

/* ------------------------------------------------------------------ */
/* Row details: edge cases and themes (Figma screens: Shared/DataTable/Figma) */
/* ------------------------------------------------------------------ */

const cvColumns: Column<CvRow>[] = [
  { key: 'name', header: 'Name', render: (cv) => cv.name },
  { key: 'education', header: 'Education', render: (cv) => cv.education },
  { key: 'employee', header: 'Employee', render: (cv) => cv.employeeEmail },
];

const projectColumns: Column<ProjectRow>[] = [
  { key: 'name', header: 'Name', render: (project) => project.name },
  { key: 'domain', header: 'Domain', render: (project) => project.domain },
  { key: 'startDate', header: 'Start Date', render: (project) => project.startDate },
  { key: 'endDate', header: 'End Date', render: (project) => project.endDate },
];

// TODO: description ↔ chips spacing not measured in Figma yet
const renderProjectDetails = (project: ProjectRow) => (
  <>
    <p style={{ margin: 0 }}>{project.description}</p>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--chip-gap)',
        marginTop: 'var(--space-2)',
      }}
    >
      {project.environment.map((technology) => (
        <Chip key={technology} label={technology} />
      ))}
    </div>
  </>
);

// Edge cases: a row without details gets no details row and keeps its own bottom line;
// a project without environment shows only the description; long text wraps
// Fixtures have 3 rows; the tuple type satisfies noUncheckedIndexedAccess
const [firstCv, secondCv] = cvs as [CvRow, CvRow];
const [firstProject, secondProject] = projects as [ProjectRow, ProjectRow];

const mixedCvs: CvRow[] = [
  firstCv,
  { ...secondCv, description: '' },
  { ...firstCv, id: 'long', description: firstCv.description.repeat(4) },
];

const mixedProjects: ProjectRow[] = [
  firstProject,
  { ...secondProject, environment: [] },
  {
    ...firstProject,
    id: 'many',
    environment: [
      ...firstProject.environment,
      ...secondProject.environment,
      'Node.js',
      'GraphQL',
      'PostgreSQL',
    ],
  },
];

const renderMixedProjectDetails = (project: ProjectRow) =>
  project.environment.length > 0 ? renderProjectDetails(project) : project.description;

export const RowDetailsEdgeCases: Story = {
  name: 'Row details: edge cases',
  render: () => (
    <div style={{ display: 'grid', gap: 48 }}>
      <DataTable<CvRow>
        columns={cvColumns}
        rows={mixedCvs}
        getRowId={(cv) => cv.id}
        caption="CVs with and without description"
        emptyMessage="No CVs found"
        rowActions={() => [{ label: 'View', onSelect: fn() }]}
        getRowLabel={(cv) => cv.name}
        renderRowDetails={(cv) => cv.description}
      />
      <DataTable<ProjectRow>
        columns={projectColumns}
        rows={mixedProjects}
        getRowId={(project) => project.id}
        caption="Projects with and without environment"
        emptyMessage="No projects found"
        rowActions={() => [{ label: 'Update', onSelect: fn() }]}
        getRowLabel={(project) => project.name}
        renderRowDetails={renderMixedProjectDetails}
      />
    </div>
  ),
};

export const RowDetailsLightAndDark: Story = {
  name: 'Row details: Light and Dark',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {(['light', 'dark'] as const).map((theme) => (
        <div key={theme} data-theme={theme} style={{ padding: 24, background: 'var(--bg)' }}>
          <DataTable<ProjectRow>
            columns={projectColumns}
            rows={projects}
            getRowId={(project) => project.id}
            caption={`Projects (${theme})`}
            emptyMessage="No projects found"
            rowActions={() => [{ label: 'Update', onSelect: fn() }]}
            getRowLabel={(project) => project.name}
            renderRowDetails={renderProjectDetails}
          />
        </div>
      ))}
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Scroll: 50 rows                                                     */
/* ------------------------------------------------------------------ */

// 50 rows built from the 3 fixture users
const manyUsers: UserRow[] = Array.from({ length: 50 }, (_, index) => {
  const base = users[index % users.length] as UserRow;
  return { ...base, id: String(index + 1), firstName: `${base.firstName} ${index + 1}` };
});

const manyCvs: CvRow[] = Array.from({ length: 50 }, (_, index) => {
  const base = cvs[index % cvs.length] as CvRow;
  // Every 3rd CV has no description, every 5th a long one: rows of different height
  const description =
    index % 3 === 2 ? '' : index % 5 === 0 ? base.description.repeat(3) : base.description;
  return { ...base, id: String(index + 1), name: `${base.name} #${index + 1}`, description };
});

const scrollUserColumns: Column<UserRow>[] = [
  {
    key: 'avatar',
    header: '',
    width: '72px',
    render: (user) => <Avatar fallback={user.firstName} src={user.avatarUrl} size="md" />,
  },
  { key: 'firstName', header: 'First Name', render: (user) => user.firstName },
  { key: 'lastName', header: 'Last Name', render: (user) => user.lastName },
  { key: 'email', header: 'Email', render: (user) => user.email },
  { key: 'department', header: 'Department', render: (user) => user.department },
  { key: 'position', header: 'Position', render: (user) => user.position },
];

const usersTable = (
  <DataTable<UserRow>
    columns={scrollUserColumns}
    rows={manyUsers}
    getRowId={(user) => user.id}
    caption="Employees"
    emptyMessage="No users found"
    rowActions={() => [
      { label: 'View', onSelect: fn() },
      { label: 'Update', onSelect: fn() },
      { label: 'Delete', onSelect: fn() },
    ]}
    getRowLabel={(user) => `${user.firstName} ${user.lastName}`}
  />
);

// The whole page scrolls (iframe = browser window)
export const ScrollPage: Story = {
  name: 'Scroll: 50 rows, page scroll',
  parameters: { layout: 'padded' },
  render: () => usersTable,
};

// As in the app: header and search stay, only the content area under them scrolls
export const ScrollContainer: Story = {
  name: 'Scroll: 50 rows, content area scroll',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--table-border)' }}>
        Page header and search (stays in place)
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px' }}>
        {usersTable}
      </div>
    </div>
  ),
};

// Rows of different height: with, without and with a long description
export const ScrollWithDetails: Story = {
  name: 'Scroll: 50 rows with details',
  parameters: { layout: 'padded' },
  render: () => (
    <DataTable<CvRow>
      columns={cvColumns}
      rows={manyCvs}
      getRowId={(cv) => cv.id}
      caption="CVs"
      emptyMessage="No CVs found"
      rowActions={() => [
        { label: 'View', onSelect: fn() },
        { label: 'Edit', onSelect: fn() },
        { label: 'Delete', onSelect: fn() },
      ]}
      getRowLabel={(cv) => cv.name}
      renderRowDetails={(cv) => cv.description}
    />
  ),
};

// Minimum supported width (< 768px is the Device Error page): long emails may overflow
export const ScrollTablet: Story = {
  name: 'Scroll: 50 rows, tablet 768px',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div
      style={{
        width: 768,
        height: '100vh',
        overflow: 'auto',
        padding: '0 16px',
        outline: '1px dashed var(--table-border)',
      }}
    >
      {usersTable}
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Pagination: 195 users, every request takes 1.5s                     */
/* ------------------------------------------------------------------ */

const LOAD_DELAY_MS = 1500;

// 195 rows → 20 pages of 10, the last one has 5
const allUsers: UserRow[] = Array.from({ length: 195 }, (_, index) => {
  const base = users[index % users.length] as UserRow;
  return { ...base, id: String(index + 1), firstName: `${base.firstName} ${index + 1}` };
});

interface UsersPage {
  items: UserRow[];
  total: number;
}

// Fake backend with the same states as Apollo: the first load shows the skeleton,
// later requests keep the old rows dimmed until the new page comes.
// failOnPage: the first request for that page fails, RETRY repeats it
function PaginatedUsersTable({ failOnPage }: { failOnPage?: number }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [result, setResult] = useState<UsersPage>();
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const failedRef = useRef(false);

  useEffect(() => {
    setIsFetching(true);
    setError(undefined);

    // Cleanup cancels the previous request: after fast clicks only the last page arrives
    const timer = setTimeout(() => {
      setIsFetching(false);

      if (page === failOnPage && !failedRef.current) {
        failedRef.current = true;
        setError('Failed to load users');
        return;
      }

      const start = (page - 1) * pageSize;
      setResult({ items: allUsers.slice(start, start + pageSize), total: allUsers.length });
    }, LOAD_DELAY_MS);

    return () => clearTimeout(timer);
  }, [page, pageSize, attempt, failOnPage]);

  const isFirstLoad = result === undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--table-border)' }}>
        Page {page}, {pageSize} per page{isFetching && ' — loading…'}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px' }}>
        <DataTable<UserRow>
          columns={scrollUserColumns}
          rows={result?.items ?? []}
          getRowId={(user) => user.id}
          caption="Employees"
          emptyMessage="No users found"
          rowActions={() => [
            { label: 'View', onSelect: fn() },
            { label: 'Update', onSelect: fn() },
            { label: 'Delete', onSelect: fn() },
          ]}
          getRowLabel={(user) => `${user.firstName} ${user.lastName}`}
          isLoading={isFirstLoad && isFetching}
          isRefreshing={!isFirstLoad && isFetching}
          error={error}
          onRetry={() => setAttempt((count) => count + 1)}
          scrollResetKey={page}
        />
        {result && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={result.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export const WithPagination: Story = {
  name: 'Pagination: 195 users, 1.5s',
  parameters: { layout: 'fullscreen' },
  render: () => <PaginatedUsersTable />,
};

export const WithPaginationError: Story = {
  name: 'Pagination: page 3 fails, RETRY',
  parameters: { layout: 'fullscreen' },
  render: () => <PaginatedUsersTable failOnPage={3} />,
};

export const Refreshing: Story = {
  name: 'Refreshing (next page loading)',
  args: { isRefreshing: true, rowActions: () => [{ label: 'Update', onSelect: fn() }] },
};
