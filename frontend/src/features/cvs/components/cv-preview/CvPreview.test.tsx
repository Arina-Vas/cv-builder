import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CvPreview } from './CvPreview';

// TODO(B7): the preview reads the fixture until the cvPreview query exists. Then add the CvDetails-style
// cases with MockLink: skeleton while loading, NOT_FOUND → notFound(), FORBIDDEN message without Export,
// load error with Retry that refetches.
describe('CvPreview', () => {
  it('shows the CV document', () => {
    renderWithProviders(<CvPreview cvId="cv-1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Eleanor Whitmore' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Professional skills' })).toBeInTheDocument();
  });

  it('shows Export PDF in the header, disabled until PDF export is available', () => {
    renderWithProviders(<CvPreview cvId="cv-1" />);

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled();
  });
});
