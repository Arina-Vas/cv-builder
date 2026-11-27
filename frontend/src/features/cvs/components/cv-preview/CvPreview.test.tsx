import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { GENERATE_CV_PDF } from '@/features/cv-pdf/api/cv-pdf.operations';
import { CV_PREVIEW } from '@/features/cvs/api/cvs.operations';
import { cvPreviewFixture } from '@/features/cvs/lib/preview/cv-preview.fixtures';
import type { CvPreviewFieldsFragment } from '@/gql/graphql';
import { downloadBase64File } from '@/shared/lib/download/downloadBase64File';
import { CatchErrors } from '@/test/catch-errors';
import { renderWithProviders } from '@/test/render';
import en from '../../../../../messages/en.json';
import { CvPreview } from './CvPreview';

vi.mock('@/shared/lib/download/downloadBase64File', () => ({ downloadBase64File: vi.fn() }));

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

const PDF = { __typename: 'CvPdf', fileName: 'software-engineer.pdf', content: 'JVBERg==' };
const pdfRequest = { query: GENERATE_CV_PDF, variables: { input: { locale: 'en', cvId: CV_ID } } };

const pdfMock = (extra: Partial<MockLink.MockedResponse> = {}): MockLink.MockedResponse => ({
  request: pdfRequest,
  result: { data: { generateCvPdf: PDF } },
  ...extra,
});

const pdfErrorMock: MockLink.MockedResponse = {
  request: pdfRequest,
  result: { errors: [new GraphQLError('raw backend text', { extensions: { code: 'FORBIDDEN' } })] },
};

const renderPreview = (mocks: MockLink.MockedResponse[]) =>
  renderWithProviders(
    <CatchErrors>
      <CvPreview cvId={CV_ID} />
    </CatchErrors>,
    { mocks },
  );

const exportButton = () => screen.getByRole('button', { name: 'Export PDF' });
const queryExportButton = () => screen.queryByRole('button', { name: 'Export PDF' });
const documentHeading = () => screen.getByRole('heading', { level: 1, name: 'Eleanor Whitmore' });
const findDocument = () => screen.findByRole('heading', { level: 1, name: 'Eleanor Whitmore' });

describe('CvPreview', () => {
  describe('states', () => {
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

    it('shows CV not found without Export when the CV does not exist', async () => {
      renderPreview([previewErrorMock('NOT_FOUND')]);

      expect(await screen.findByRole('heading', { name: 'CV not found' })).toBeInTheDocument();
      expect(screen.getByText('The CV does not exist or has been deleted')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Export PDF' })).not.toBeInTheDocument();
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
      expect(exportButton()).toBeEnabled();
    });
  });

  describe('Export PDF', () => {
    it('is shown in the header and enabled once the preview has loaded', async () => {
      renderPreview([previewMock()]);

      await findDocument();
      expect(exportButton()).toBeEnabled();
    });

    it('downloads the PDF of this CV in the UI locale', async () => {
      const { user } = renderPreview([previewMock(), pdfMock()]);

      await findDocument();
      await user.click(exportButton());

      await waitFor(() =>
        expect(downloadBase64File).toHaveBeenCalledExactlyOnceWith(
          PDF.content,
          PDF.fileName,
          'application/pdf',
        ),
      );
    });

    // AC-27: loading state; the Preview content remains available during generation
    it('shows a busy button and keeps the preview while the PDF is generated', async () => {
      const { user } = renderPreview([previewMock(), pdfMock({ delay: 50 })]);

      await findDocument();
      await user.click(exportButton());

      await waitFor(() => expect(exportButton()).toHaveAttribute('aria-busy', 'true'));
      expect(documentHeading()).toBeInTheDocument();

      await waitFor(() => expect(exportButton()).not.toHaveAttribute('aria-busy', 'true'));
      expect(downloadBase64File).toHaveBeenCalledOnce();
    });

    // AC-47: an error toast, the page stays and the export can be retried
    it('shows an error toast, keeps the preview and enables the button again on failure', async () => {
      const { user } = renderPreview([previewMock(), pdfErrorMock]);

      await findDocument();
      await user.click(exportButton());

      expect(await screen.findByText(en.errors.FORBIDDEN)).toBeInTheDocument();
      expect(screen.queryByText('raw backend text')).toBeNull();
      expect(documentHeading()).toBeInTheDocument();
      expect(exportButton()).toBeEnabled();
      expect(downloadBase64File).not.toHaveBeenCalled();
    });
  });
});
