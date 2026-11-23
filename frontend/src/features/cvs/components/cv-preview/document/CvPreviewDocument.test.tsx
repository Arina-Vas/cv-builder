import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cvPreviewFixture,
  cvPreviewSparseFixture,
} from '@/features/cvs/lib/preview/cv-preview.fixtures';
import { CvPreviewDocument } from './CvPreviewDocument';

describe('CvPreviewDocument', () => {
  it('shows the owner name and position in the header', () => {
    renderWithProviders(<CvPreviewDocument data={cvPreviewFixture} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Eleanor Whitmore' })).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('has a heading outline without skipped levels', () => {
    renderWithProviders(<CvPreviewDocument data={cvPreviewFixture} />);

    const outline = screen
      .getAllByRole('heading')
      .map((heading) => `${heading.tagName} ${heading.textContent}`);

    expect(outline).toEqual([
      'H1 Eleanor Whitmore',
      'H2 Senior Frontend Developer CV',
      'H2 Projects',
      'H3 FinSight',
      'H3 MediTrack',
      'H3 ShopWave',
      'H2 Professional skills',
    ]);
  });

  it('labels the summary, projects and skills sections by their headings', () => {
    renderWithProviders(<CvPreviewDocument data={cvPreviewFixture} />);

    expect(
      screen.getByRole('region', { name: 'Senior Frontend Developer CV' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Professional skills' })).toBeInTheDocument();
  });

  it('renders the page actions next to the name', () => {
    renderWithProviders(
      <CvPreviewDocument data={cvPreviewFixture} actions={<button type="button">Export</button>} />,
    );

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('shows the email as the name and hides empty sections when the CV has no data', () => {
    renderWithProviders(<CvPreviewDocument data={cvPreviewSparseFixture} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'new.employee@example.com' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Draft CV' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Professional skills' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
