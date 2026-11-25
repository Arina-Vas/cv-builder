import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cvPreviewEdgeCasesFixture,
  cvPreviewFixture,
} from '@/features/cvs/lib/preview/cv-preview.fixtures';
import { ProfessionalSkills } from './ProfessionalSkills';

/** Cell texts of the row whose skill cell is `skill` */
const rowOf = (skill: string) =>
  within(screen.getByRole('cell', { name: skill }).closest('tr') as HTMLElement)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

describe('ProfessionalSkills', () => {
  it('shows the section heading and a column header for each column', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewFixture.skillGroups} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Professional skills' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      // Figma shows one "Skills" over category and skill; each column keeps its own hidden name
      'SkillsSkill category',
      'Skill',
      'Experience in years',
      'Last used',
    ]);
  });

  it('names the category column for screen readers, not the visible "Skills"', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewFixture.skillGroups} />);

    expect(screen.getByRole('columnheader', { name: 'Skill category' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Skill' })).toBeInTheDocument();
  });

  it('groups skills by category, the category cell spanning its rows', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewFixture.skillGroups} />);

    const frontend = screen.getByText('Frontend').closest('th');
    expect(frontend).toHaveAttribute('scope', 'rowgroup');
    expect(frontend).toHaveAttribute('rowspan', '3');
    // one tbody per category
    expect(screen.getAllByRole('rowgroup')).toHaveLength(1 + cvPreviewFixture.skillGroups.length);
  });

  it('shows the experience in years and the last used year of a skill', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewFixture.skillGroups} />);

    expect(rowOf('Next.js')).toEqual(['Next.js', '4', '2024']);
  });

  it('leaves experience and last used empty for a skill used in no CV project', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewFixture.skillGroups} />);

    expect(rowOf('Git')).toEqual(['Git', '', '']);
  });

  it('shows zero years of experience', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewEdgeCasesFixture.skillGroups} />);

    expect(rowOf('TypeScript')).toEqual(['TypeScript', '0', '2026']);
  });

  it('hides a category without skills', () => {
    renderWithProviders(<ProfessionalSkills skillGroups={cvPreviewEdgeCasesFixture.skillGroups} />);

    expect(screen.queryByText('DevOps')).not.toBeInTheDocument();
  });

  it('renders nothing when the CV has no skills', () => {
    renderWithProviders(
      <ProfessionalSkills skillGroups={[{ category: { id: 'c', name: 'Empty' }, skills: [] }]} />,
    );

    expect(screen.queryByRole('heading', { name: 'Professional skills' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
