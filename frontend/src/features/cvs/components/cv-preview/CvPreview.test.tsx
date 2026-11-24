import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { GENERATE_CV_PDF } from '@/features/cv-pdf/api/cv-pdf.operations';
import { downloadBase64File } from '@/shared/lib/download/downloadBase64File';
import { renderWithProviders } from '@/test/render';
import en from '../../../../../messages/en.json';
import { CvPreview } from './CvPreview';

vi.mock('@/shared/lib/download/downloadBase64File', () => ({ downloadBase64File: vi.fn() }));

const CV_ID = 'cv-1';
const PDF = { __typename: 'CvPdf', fileName: 'software-engineer.pdf', content: 'JVBERg==' };
const request = { query: GENERATE_CV_PDF, variables: { input: { locale: 'en', cvId: CV_ID } } };

const successMock = (extra: Partial<MockLink.MockedResponse> = {}): MockLink.MockedResponse => ({
  request,
  result: { data: { generateCvPdf: PDF } },
  ...extra,
});

const errorMock: MockLink.MockedResponse = {
  request,
  result: { errors: [new GraphQLError('raw backend text', { extensions: { code: 'FORBIDDEN' } })] },
};

const exportButton = () => screen.getByRole('button', { name: 'Export PDF' });
const documentHeading = () => screen.getByRole('heading', { level: 1, name: 'Eleanor Whitmore' });

// TODO(B7): the preview reads the fixture until the cvPreview query exists. Then add the CvDetails-style
// cases with MockLink: skeleton while loading, NOT_FOUND → notFound(), FORBIDDEN message without Export,
// load error with Retry that refetches, Empty state and disabled Export when cvPreview.missingFields is
// not empty (AC-26, AC-48).
describe('CvPreview', () => {
  it('shows the CV document', () => {
    renderWithProviders(<CvPreview cvId={CV_ID} />);

    expect(documentHeading()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Professional skills' })).toBeInTheDocument();
  });

  describe('Export PDF', () => {
    it('is shown in the header and enabled', () => {
      renderWithProviders(<CvPreview cvId={CV_ID} />);

      expect(exportButton()).toBeEnabled();
    });

    it('downloads the PDF of this CV in the UI locale', async () => {
      const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [successMock()] });

      await user.click(exportButton());

      await waitFor(() =>
        expect(downloadBase64File).toHaveBeenCalledExactlyOnceWith(PDF.content, PDF.fileName),
      );
    });

    // AC-27: loading state; the Preview content remains available during generation
    it('shows a busy button and keeps the preview while the PDF is generated', async () => {
      const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, {
        mocks: [successMock({ delay: 50 })],
      });

      await user.click(exportButton());

      await waitFor(() => expect(exportButton()).toHaveAttribute('aria-busy', 'true'));
      expect(documentHeading()).toBeInTheDocument();

      await waitFor(() => expect(exportButton()).not.toHaveAttribute('aria-busy', 'true'));
      expect(downloadBase64File).toHaveBeenCalledOnce();
    });

    // AC-47: an error toast, the page stays and the export can be retried
    it('shows an error toast, keeps the preview and enables the button again on failure', async () => {
      const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [errorMock] });

      await user.click(exportButton());

      expect(await screen.findByText(en.errors.FORBIDDEN)).toBeInTheDocument();
      expect(screen.queryByText('raw backend text')).toBeNull();
      expect(documentHeading()).toBeInTheDocument();
      expect(exportButton()).toBeEnabled();
      expect(downloadBase64File).not.toHaveBeenCalled();
    });
  });
});
