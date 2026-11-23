import { Proficiency } from '@/common/graphql/enums';
import { renderCvPdfHtml, splitResponsibilities } from './cv-pdf.template';
import type { CvPdfData, CvPdfProject } from './cv-preview.types';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const project = (overrides: Partial<CvPdfProject> = {}): CvPdfProject => ({
  id: 'cv-project-1',
  startDate: date('2022-03-01'),
  endDate: date('2024-12-31'),
  responsibilities: 'Built the catalog\nReviewed code',
  roles: [
    { id: 'role-1', name: 'Frontend Developer' },
    { id: 'role-2', name: 'Team Lead' },
  ],
  project: {
    id: 'project-1',
    name: 'ShopWave',
    domain: 'E-commerce',
    description: 'Online marketplace',
    technologies: [
      { id: 'skill-1', name: 'TypeScript' },
      { id: 'skill-2', name: 'React' },
    ],
  },
  ...overrides,
});

const cv = (overrides: Partial<CvPdfData> = {}): CvPdfData => ({
  id: 'cv-1',
  name: 'Frontend Developer CV',
  education: 'BSUIR, Software Engineering',
  description: 'Five years of web development',
  user: {
    email: 'employee@cv-builder.local',
    firstName: 'Anna',
    lastName: 'Smith',
    position: { id: 'position-1', name: 'Software Engineer' },
  },
  languages: [
    { id: 'ul-1', proficiency: Proficiency.NATIVE, language: { id: 'l-1', name: 'Russian' } },
    { id: 'ul-2', proficiency: Proficiency.B2, language: { id: 'l-2', name: 'English' } },
  ],
  domains: ['E-commerce', 'Healthcare'],
  skillGroups: [
    {
      category: { id: 'category-1', name: 'Frontend' },
      skills: [
        { skill: { id: 'skill-2', name: 'React' }, experienceYears: 4, lastUsedYear: 2026 },
        { skill: { id: 'skill-3', name: 'Next.js' }, experienceYears: null, lastUsedYear: null },
      ],
    },
  ],
  projects: [project()],
  ...overrides,
});

/** The document without <head>: styles and fonts would match any text search */
const renderBody = (data: CvPdfData): string => {
  const html = renderCvPdfHtml(data);
  return html.slice(html.indexOf('<body>'));
};

/** Text content with tags and extra spaces removed, to check what the reader sees */
const textOf = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

describe('splitResponsibilities', () => {
  it('splits by new line and by comma', () => {
    expect(splitResponsibilities('Code review\nMentoring, Testing')).toEqual([
      'Code review',
      'Mentoring',
      'Testing',
    ]);
  });

  it('handles Windows line endings', () => {
    expect(splitResponsibilities('Code review\r\nMentoring')).toEqual(['Code review', 'Mentoring']);
  });

  it('trims every item and drops the empty ones', () => {
    expect(splitResponsibilities('  Code review ,\n\n , Mentoring  ,')).toEqual([
      'Code review',
      'Mentoring',
    ]);
  });

  it.each([null, undefined, '', '   ', ',\n,'])('gives no items for %j', (text) => {
    expect(splitResponsibilities(text)).toEqual([]);
  });
});

describe('renderCvPdfHtml', () => {
  describe('document', () => {
    it('is a full UTF-8 HTML page with the styles and Roboto embedded', () => {
      const html = renderCvPdfHtml(cv());

      expect(html.startsWith('<!doctype html>')).toBe(true);
      expect(html).toContain('<meta charset="utf-8" />');
      expect(html).toContain("font-family: 'Roboto'");
      expect(html).toContain('src: url(data:font/woff2;base64,');
      expect(html).toContain('.document {');
    });

    it('shows the owner name and position in the header', () => {
      const body = renderBody(cv());

      expect(body).toContain('<h1 class="document__title">Anna Smith</h1>');
      expect(body).toContain('<p class="document__sub-title">Software Engineer</p>');
    });

    it('falls back to the email without a name and hides a missing position', () => {
      const body = renderBody(
        cv({
          user: {
            email: 'employee@cv-builder.local',
            firstName: null,
            lastName: null,
            position: null,
          },
        }),
      );

      expect(body).toContain('<h1 class="document__title">employee@cv-builder.local</h1>');
      expect(body).not.toContain('document__sub-title');
    });
  });

  describe('escaping', () => {
    it('escapes markup in every value taken from the data', () => {
      const xss = '<script>alert(1)</script>';
      const body = renderBody(
        cv({
          name: xss,
          education: xss,
          description: xss,
          domains: [xss],
          user: {
            email: 'e@x.io',
            firstName: xss,
            lastName: null,
            position: { id: 'p', name: xss },
          },
          languages: [{ id: 'ul', proficiency: Proficiency.B1, language: { id: 'l', name: xss } }],
          skillGroups: [
            {
              category: { id: 'c', name: xss },
              skills: [{ skill: { id: 's', name: xss }, experienceYears: 1, lastUsedYear: 2026 }],
            },
          ],
          projects: [
            project({
              responsibilities: xss,
              roles: [{ id: 'r', name: xss }],
              project: {
                id: 'p',
                name: xss,
                domain: xss,
                description: xss,
                technologies: [{ id: 't', name: xss }],
              },
            }),
          ],
        }),
      );

      expect(body).not.toContain('<script>');
      expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('summary', () => {
    it('lists education, languages with levels, domains and skills by category', () => {
      const text = textOf(renderBody(cv()));

      expect(text).toContain('Education BSUIR, Software Engineering');
      expect(text).toContain('Language proficiency Russian — Native, English — B2');
      expect(text).toContain('Domains E-commerce, Healthcare');
      expect(text).toContain('Frontend Developer CV Five years of web development');
      expect(text).toContain('Frontend React, Next.js.');
    });

    it('hides empty education, languages, domains, description and skill categories', () => {
      const body = renderBody(
        cv({
          education: '  ',
          description: '',
          languages: [],
          domains: [],
          skillGroups: [{ category: { id: 'c', name: 'Empty category' }, skills: [] }],
        }),
      );

      expect(body).not.toContain('Education');
      expect(body).not.toContain('Language proficiency');
      expect(body).not.toContain('Domains');
      expect(body).not.toContain('summary__text');
      expect(body).not.toContain('Empty category');
    });
  });

  describe('projects', () => {
    it('shows roles, the period as MM.yyyy and the environment', () => {
      const text = textOf(renderBody(cv()));

      expect(text).toContain('Projects ShopWave Online marketplace');
      expect(text).toContain('Project roles Frontend Developer, Team Lead');
      expect(text).toContain('Period 03.2022 – 12.2024');
      expect(text).toContain('Environment TypeScript, React.');
    });

    it('shows Present for a project without an end date', () => {
      const text = textOf(renderBody(cv({ projects: [project({ endDate: null })] })));

      expect(text).toContain('Period 03.2022 – Present');
    });

    it('formats the period in UTC, so the server time zone does not shift the month', () => {
      const text = textOf(
        renderBody(
          cv({
            projects: [project({ startDate: date('2023-01-01'), endDate: date('2023-12-31') })],
          }),
        ),
      );

      expect(text).toContain('Period 01.2023 – 12.2023');
    });

    it('ends responsibilities with ";" and the last one with "." in place of their own punctuation', () => {
      const body = renderBody(
        cv({
          projects: [project({ responsibilities: 'Built the catalog.\nReviewed code;, Tests' })],
        }),
      );

      expect(body).toContain('<li>Built the catalog;</li><li>Reviewed code;</li><li>Tests.</li>');
    });

    it('hides empty roles, responsibilities, environment and description', () => {
      const body = renderBody(
        cv({
          projects: [
            project({
              roles: [],
              responsibilities: null,
              project: { ...project().project, description: ' ', technologies: [] },
            }),
          ],
        }),
      );

      expect(body).not.toContain('Project roles');
      expect(body).not.toContain('Responsibilities');
      expect(body).not.toContain('Environment');
      expect(body).not.toContain('project__description');
      expect(body).toContain('Period');
    });

    it('hides the section without projects', () => {
      expect(renderBody(cv({ projects: [] }))).not.toContain('Projects');
    });
  });

  describe('professional skills', () => {
    it('renders one table body per category with the category cell spanning its skills', () => {
      const body = renderBody(cv());

      expect(textOf(body)).toContain('Professional skills');
      expect(body.match(/<tbody>/g)).toHaveLength(1);
      expect(body).toContain('rowspan="2" class="skills__category">Frontend</th>');
      expect(body).toContain('<td class="skills__skill">React</td>');
      expect(body).toContain('<td class="skills__value">4</td>');
      expect(body).toContain('<td class="skills__value">2026</td>');
    });

    it('leaves experience and last used empty for a skill without projects', () => {
      const body = renderBody(cv());
      const nextRow = body.slice(body.indexOf('Next.js'));

      expect(nextRow).toMatch(
        /Next\.js<\/td>\s*<td class="skills__value"><\/td>\s*<td class="skills__value"><\/td>/,
      );
    });

    it('hides the section when no category has skills', () => {
      const body = renderBody(
        cv({ skillGroups: [{ category: { id: 'c', name: 'Frontend' }, skills: [] }] }),
      );

      expect(body).not.toContain('Professional skills');
      expect(body).not.toContain('<table');
    });
  });
});
