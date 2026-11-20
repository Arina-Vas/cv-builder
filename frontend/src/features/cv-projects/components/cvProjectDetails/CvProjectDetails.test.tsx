import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CvProjectFieldsFragment } from '@/gql/graphql';
import { renderWithProviders } from '@/test/render';
import { CvProjectDetails } from './CvProjectDetails';

const cvProject = (responsibilities: string | null): CvProjectFieldsFragment => ({
  id: 'cp1',
  startDate: '2024-03-01',
  endDate: null,
  responsibilities,
  roles: [],
  project: {
    id: 'p1',
    name: 'Blog',
    domain: 'Blogging',
    description: 'A blogging website',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    technologies: [],
  },
});

describe('CvProjectDetails', () => {
  it('shows the project description', () => {
    renderWithProviders(<CvProjectDetails cvProject={cvProject(null)} />);

    expect(screen.getByText('A blogging website')).toBeInTheDocument();
  });

  it('shows each responsibility as its own chip, in order', () => {
    renderWithProviders(
      <CvProjectDetails cvProject={cvProject('Code review, Mentoring\nTesting')} />,
    );

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Code review',
      'Mentoring',
      'Testing',
    ]);
  });

  it.each([null, '', ' , \n'])('shows no list when the responsibilities are %j', (text) => {
    renderWithProviders(<CvProjectDetails cvProject={cvProject(text)} />);

    // not queryByRole('list'): the toast viewport from the providers is an empty <ol>
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
