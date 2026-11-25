import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cvPreviewEdgeCasesFixture,
  cvPreviewFixture,
  cvPreviewSparseFixture,
} from '@/features/cvs/lib/preview/cv-preview.fixtures';
import type { CvPreviewFieldsFragment } from '@/gql/graphql';
import { CvSummary } from './CvSummary';

const renderSummary = (
  data: CvPreviewFieldsFragment,
  overrides: Partial<CvPreviewFieldsFragment> = {},
) => {
  const cv = { ...data, ...overrides };
  return renderWithProviders(
    <CvSummary
      name={cv.name}
      education={cv.education}
      description={cv.description}
      languages={cv.languages}
      domains={cv.domains}
      skillGroups={cv.skillGroups}
    />,
  );
};

// A `term` (dt) has no accessible name in jsdom, so terms are matched by their text
const queryTerm = (text: string) =>
  screen.queryAllByRole('term').find((term) => term.textContent === text) ?? null;

/** dt → its dd, as a screen reader pairs them */
const valueOf = (text: string) => {
  const term = queryTerm(text);
  if (!term) throw new Error(`No term "${text}"`);
  return term.nextElementSibling;
};

describe('CvSummary', () => {
  it('shows education, languages with levels and domains', () => {
    renderSummary(cvPreviewFixture);

    expect(valueOf('Education')).toHaveTextContent(
      'Belarusian State University of Informatics and Radioelectronics, 2019',
    );
    expect(valueOf('Language proficiency')).toHaveTextContent(
      'English — C1, Polish — B2, Russian — Native',
    );
    expect(valueOf('Domains')).toHaveTextContent('E-commerce, Healthcare, Finance');
  });

  it('shows the CV name as a heading and its description', () => {
    renderSummary(cvPreviewFixture);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Senior Frontend Developer CV' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Frontend developer with 4\+ years/)).toBeInTheDocument();
  });

  it('lists skills by category, comma-separated and ending with a dot', () => {
    renderSummary(cvPreviewFixture);

    expect(valueOf('Programming Languages')?.textContent).toBe('TypeScript, JavaScript.');
    expect(valueOf('Backend')?.textContent).toBe('Node.js, NestJS, GraphQL, Express.');
  });

  it('hides empty education, languages, domains, description and skills', () => {
    renderSummary(cvPreviewSparseFixture);

    expect(screen.queryByRole('term')).not.toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Draft CV' })).toBeInTheDocument();
  });

  it('treats education and description made of spaces as empty', () => {
    renderSummary(cvPreviewSparseFixture, { education: '   ', description: ' \n ' });

    expect(queryTerm('Education')).toBeNull();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('hides a category without skills', () => {
    renderSummary(cvPreviewEdgeCasesFixture);

    expect(queryTerm('DevOps')).toBeNull();
    expect(queryTerm('Frontend')).not.toBeNull();
  });
});
