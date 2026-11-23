import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CvPreviewSkeleton } from './CvPreviewSkeleton';

describe('CvPreviewSkeleton', () => {
  it('tells screen readers that the preview is loading', () => {
    renderWithProviders(<CvPreviewSkeleton />);

    expect(screen.getByLabelText('Loading CV preview')).toHaveAttribute('aria-busy', 'true');
  });

  it('has no headings or buttons while loading', () => {
    renderWithProviders(<CvPreviewSkeleton />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
