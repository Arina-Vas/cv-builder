import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { CV_PREVIEW } from '@/features/cvs/api/cvs.operations';
import { cvPreviewFixture } from '@/features/cvs/lib/preview/cv-preview.fixtures';
import type { CvPreviewFieldsFragment } from '@/gql/graphql';
import { CatchErrors } from '@/test/catch-errors';
import { renderWithProviders } from '@/test/render';
import en from '../../../../../messages/en.json';
import { CvPreview } from './CvPreview';

const CV_ID = 'cv-1';

const previewRequest = { query: CV_PREVIEW, variables: { id: CV_ID } };

// The fixture has no __typename (the generated types omit it), but the cache needs it to read the result
const withTypenames = ({
  user,
  languages,
  skillGroups,
  projects,
  ...cv
}: CvPreviewFieldsFragment) => ({
  __typename: 'CvPreview',
  ...cv,
  id: CV_ID,
  user: {
    __typename: 'User',
    ...user,
    position: user.position && { __typename: 'Position', ...user.position },
  },
  languages: languages.map((item) => ({
    __typename: 'UserLanguage',
    ...item,
    language: { __typename: 'Language', ...item.language },
  })),
  skillGroups: skillGroups.map((group) => ({
    __typename: 'CvPreviewSkillGroup',
    category: { __typename: 'SkillCategory', ...group.category },
    skills: group.skills.map((item) => ({
      __typename: 'CvPreviewSkill',
      ...item,
      skill: { __typename: 'Skill', ...item.skill },
    })),
  })),
  projects: projects.map((cvProject) => ({
    __typename: 'CvProject',
    ...cvProject,
    roles: cvProject.roles.map((role) => ({ __typename: 'ProjectRole', ...role })),
    project: {
      __typename: 'Project',
      ...cvProject.project,
      technologies: cvProject.project.technologies.map((skill) => ({
        __typename: 'Skill',
        ...skill,
      })),
    },
  })),
});

const previewMock = (): MockLink.MockedResponse => ({
  request: previewRequest,
  result: { data: { cvPreview: withTypenames(cvPreviewFixture) } },
});

const previewErrorMock = (code: string): MockLink.MockedResponse => ({
  request: previewRequest,
  result: { errors: [new GraphQLError('raw backend text', { extensions: { code } })] },
});

const renderPreview = (mocks: MockLink.MockedResponse[]) =>
  renderWithProviders(
    <CatchErrors>
      <CvPreview cvId={CV_ID} />
    </CatchErrors>,
    { mocks },
  );

const queryExportButton = () => screen.queryByRole('button', { name: 'Export PDF' });
const findDocument = () => screen.findByRole('heading', { level: 1, name: 'Eleanor Whitmore' });

describe('CvPreview', () => {
  // AC-25, AC-26: Export is not available until the preview data has loaded
  it('shows a skeleton without Export PDF while the preview loads', () => {
    renderPreview([previewMock()]);

    expect(screen.getByLabelText(en.cvs.preview.loading)).toHaveAttribute('aria-busy', 'true');
    expect(queryExportButton()).not.toBeInTheDocument();
  });

  it('shows the CV document from cvPreview', async () => {
    renderPreview([previewMock()]);

    expect(await findDocument()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Professional skills' })).toBeInTheDocument();
  });

  it('shows Export PDF in the header, disabled until PDF export is available', async () => {
    renderPreview([previewMock()]);

    await findDocument();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled();
  });

  it('opens the 404 page when the CV does not exist', async () => {
    // React logs the error caught by the boundary; keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPreview([previewErrorMock('NOT_FOUND')]);

    await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
  });

  // AC-23: Unauthorized state, no CV data and no Export
  it("shows Access denied without CV data or Export for another user's CV", async () => {
    renderPreview([previewErrorMock('FORBIDDEN')]);

    expect(await screen.findByText(en.cvs.preview.forbidden.title)).toBeInTheDocument();
    expect(screen.getByText(en.cvs.preview.forbidden.message)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Eleanor Whitmore' })).not.toBeInTheDocument();
    expect(queryExportButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: en.cvs.preview.retry })).not.toBeInTheDocument();
  });

  // AC-46: load error with Retry; Export is unavailable until the preview loads
  it('shows the load error with Retry that repeats the request', async () => {
    const { user } = renderPreview([
      { request: previewRequest, error: new Error('Network down') },
      previewMock(),
    ]);

    expect(await screen.findByText(en.cvs.preview.loadError)).toBeInTheDocument();
    expect(queryExportButton()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: en.cvs.preview.retry }));

    expect(await findDocument()).toBeInTheDocument();
  });
});
