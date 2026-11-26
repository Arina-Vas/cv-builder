import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cvPreviewEdgeCasesFixture,
  cvPreviewFixture,
} from '@/features/cvs/lib/preview/cv-preview.fixtures';
import type { CvProjectFieldsFragment } from '@/gql/graphql';
import { CvProjectEntry } from './CvProjectEntry';

const [finSight, , shopWave] = cvPreviewFixture.projects as [
  CvProjectFieldsFragment,
  CvProjectFieldsFragment,
  CvProjectFieldsFragment,
];
const [noRolesProject, messyProject, blankResponsibilitiesProject] =
  cvPreviewEdgeCasesFixture.projects as [
    CvProjectFieldsFragment,
    CvProjectFieldsFragment,
    CvProjectFieldsFragment,
  ];

// A `term` (dt) has no accessible name in jsdom, so terms are matched by their text
const queryTerm = (text: string) =>
  screen.queryAllByRole('term').find((term) => term.textContent === text) ?? null;

/** dt → its dd, as a screen reader pairs them */
const valueOf = (text: string) => {
  const term = queryTerm(text);
  if (!term) throw new Error(`No term "${text}"`);
  return term.nextElementSibling;
};

const responsibilityItems = () =>
  within(valueOf('Responsibilities') as HTMLElement)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

describe('CvProjectEntry', () => {
  it('shows the project name as a heading and its description', () => {
    renderWithProviders(<CvProjectEntry project={shopWave} />);

    expect(screen.getByRole('heading', { level: 3, name: 'ShopWave' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Online marketplace with product catalog, cart, checkout and an admin panel for sellers.',
      ),
    ).toBeInTheDocument();
  });

  it.each(['', '  \n '])('hides an empty project description (%j)', (description) => {
    renderWithProviders(
      <CvProjectEntry project={{ ...shopWave, project: { ...shopWave.project, description } }} />,
    );

    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('shows roles and the environment comma-separated, the environment ending with a dot', () => {
    renderWithProviders(<CvProjectEntry project={shopWave} />);

    expect(valueOf('Project roles')?.textContent).toBe('Frontend Developer, Full Stack Developer');
    expect(valueOf('Environment')?.textContent).toBe(
      'TypeScript, React, Next.js, Node.js, PostgreSQL.',
    );
  });

  it('shows the CV project period as MM.yyyy', () => {
    renderWithProviders(<CvProjectEntry project={shopWave} />);

    expect(valueOf('Period')).toHaveTextContent('03.2022 – 12.2024');
  });

  it('shows an active project as running to the present', () => {
    // the fixture project ends 2027-12-31: pushed further so the test doesn't expire
    renderWithProviders(
      <CvProjectEntry
        project={{ ...finSight, project: { ...finSight.project, endDate: '2099-12-31' } }}
      />,
    );

    expect(valueOf('Period')).toHaveTextContent('01.2024 – Present');
  });

  it('ends a finished project without a CV end date at the project end', () => {
    // ShopWave ended 2025-06-30
    renderWithProviders(<CvProjectEntry project={{ ...shopWave, endDate: null }} />);

    expect(valueOf('Period')).toHaveTextContent('03.2022 – 06.2025');
  });

  it('lists responsibilities with a semicolon after each item and a dot after the last', () => {
    renderWithProviders(<CvProjectEntry project={shopWave} />);

    expect(responsibilityItems()).toEqual([
      'Built the product catalog and checkout flow with server-side rendering;',
      'Implemented the seller admin panel for orders and inventory reports;',
      'Set up component library and visual regression tests.',
    ]);
  });

  it('splits responsibilities by lines and commas and replaces their own trailing punctuation', () => {
    renderWithProviders(
      <CvProjectEntry
        project={{ ...messyProject, responsibilities: 'Wrote tests.\nFixed bugs;, Reviewed code.' }}
      />,
    );

    expect(responsibilityItems()).toEqual(['Wrote tests;', 'Fixed bugs;', 'Reviewed code.']);
  });

  it('skips blank lines and spaces in responsibilities', () => {
    renderWithProviders(<CvProjectEntry project={messyProject} />);

    expect(responsibilityItems()).toHaveLength(4);
    expect(responsibilityItems()[0]).toBe('Migrated legacy reports;');
  });

  it('hides roles and responsibilities when the project has none', () => {
    renderWithProviders(<CvProjectEntry project={noRolesProject} />);

    expect(queryTerm('Project roles')).toBeNull();
    expect(queryTerm('Responsibilities')).toBeNull();
    expect(queryTerm('Period')).not.toBeNull();
  });

  it('hides responsibilities made only of spaces and separators', () => {
    renderWithProviders(<CvProjectEntry project={blankResponsibilitiesProject} />);

    expect(queryTerm('Responsibilities')).toBeNull();
  });

  it('hides the environment when the project has no technologies', () => {
    renderWithProviders(<CvProjectEntry project={messyProject} />);

    expect(queryTerm('Environment')).toBeNull();
  });
});
