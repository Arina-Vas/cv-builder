import { Proficiency } from '@/common/graphql/enums';
import { Locale } from '@/common/graphql/locale.enum';
import type { CvPreview } from '@/cvs/cv-preview/models/cv-preview.model';
import {
  calendarDate,
  cvPreviewFixture,
  cvProjectFixture,
  projectFixture,
  skillCategoryFixture,
  skillFixture,
  userFixture,
  userLanguageFixture,
} from '../cv-pdf.fixtures';
import { renderCvPdfHtml, splitResponsibilities } from './cv-pdf.template';

/** The document without <head>: styles and fonts would match any text search */
const renderBody = (data: CvPreview, locale: Locale = Locale.en): string => {
  const html = renderCvPdfHtml(data, locale);
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
      const html = renderCvPdfHtml(cvPreviewFixture(), Locale.en);

      expect(html.startsWith('<!doctype html>')).toBe(true);
      expect(html).toContain('<meta charset="utf-8" />');
      expect(html).toContain("font-family: 'Roboto'");
      expect(html).toContain('src: url(data:font/woff2;base64,');
      expect(html).toContain('.document {');
    });

    it('allows only inline styles and data: fonts, so the page loads nothing and runs no scripts', () => {
      const html = renderCvPdfHtml(cvPreviewFixture(), Locale.en);
      const head = html.slice(0, html.indexOf('</head>'));
      const policy = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(head)?.[1];

      expect(policy?.split(/;\s*/)).toEqual([
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        'font-src data:',
      ]);
      // the policy must come before the styles and fonts it allows
      expect(head.indexOf('Content-Security-Policy')).toBeLessThan(head.indexOf('<style>'));
    });

    it('sets the page language to the locale', () => {
      expect(renderCvPdfHtml(cvPreviewFixture(), Locale.en)).toContain('<html lang="en">');
      expect(renderCvPdfHtml(cvPreviewFixture(), Locale.ru)).toContain('<html lang="ru">');
    });

    it('shows the owner name and position in the header', () => {
      const body = renderBody(cvPreviewFixture());

      expect(body).toContain('<h1 class="document__title">Anna Smith</h1>');
      expect(body).toContain('<p class="document__sub-title">Software Engineer</p>');
    });

    it('falls back to the email without a name and hides a missing position', () => {
      const body = renderBody(
        cvPreviewFixture({
          user: userFixture({ firstName: null, lastName: null, position: null }),
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
        cvPreviewFixture({
          name: xss,
          education: xss,
          description: xss,
          domains: [xss],
          user: userFixture({ firstName: xss, lastName: null, position: { id: 'p', name: xss } }),
          languages: [userLanguageFixture(xss, Proficiency.B1)],
          skillGroups: [
            {
              category: skillCategoryFixture(xss),
              skills: [{ skill: skillFixture(xss), experienceYears: 1, lastUsedYear: 2026 }],
            },
          ],
          projects: [
            cvProjectFixture({
              responsibilities: xss,
              roles: [{ id: 'r', name: xss }],
              project: projectFixture({
                name: xss,
                domain: xss,
                description: xss,
                technologies: [skillFixture(xss)],
              }),
            }),
          ],
        }),
      );

      expect(body).not.toContain('<script>');
      expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('locale', () => {
    it('renders the labels of the requested locale', () => {
      const text = textOf(
        renderBody(
          cvPreviewFixture({ projects: [cvProjectFixture({ endDate: null })] }),
          Locale.ru,
        ),
      );

      expect(text).toContain('Образование BSUIR, Software Engineering');
      expect(text).toContain('Владение языками Russian — Родной, English — B2');
      expect(text).toContain('Роли в проекте Frontend Developer, Team Lead');
      expect(text).toContain('Период 03.2022 – по настоящее время');
      expect(text).toContain('Профессиональные навыки');
      expect(text).toContain('Последнее использование');
      expect(text).not.toContain('Education');
    });

    it('escapes an apostrophe in a translation', () => {
      const body = renderBody(
        cvPreviewFixture({ projects: [cvProjectFixture({ endDate: null })] }),
        Locale.fr,
      );

      expect(body).toContain('03.2022 – aujourd&#39;hui');
    });
  });

  describe('summary', () => {
    it('lists education, languages with levels, domains and skills by category', () => {
      const text = textOf(renderBody(cvPreviewFixture()));

      expect(text).toContain('Education BSUIR, Software Engineering');
      expect(text).toContain('Language proficiency Russian — Native, English — B2');
      expect(text).toContain('Domains E-commerce, Healthcare');
      expect(text).toContain('Frontend Developer CV Five years of web development');
      expect(text).toContain('Frontend React, Next.js.');
    });

    it('hides empty education, languages, domains, description and skill categories', () => {
      const body = renderBody(
        cvPreviewFixture({
          education: '  ',
          description: '',
          languages: [],
          domains: [],
          skillGroups: [{ category: skillCategoryFixture('Empty category'), skills: [] }],
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
      const text = textOf(renderBody(cvPreviewFixture()));

      expect(text).toContain('Projects ShopWave Online marketplace');
      expect(text).toContain('Project roles Frontend Developer, Team Lead');
      expect(text).toContain('Period 03.2022 – 12.2024');
      expect(text).toContain('Environment TypeScript, React.');
    });

    it('shows Present for a project without an end date', () => {
      const text = textOf(
        renderBody(cvPreviewFixture({ projects: [cvProjectFixture({ endDate: null })] })),
      );

      expect(text).toContain('Period 03.2022 – Present');
    });

    it('formats the period in UTC, so the server time zone does not shift the month', () => {
      const text = textOf(
        renderBody(
          cvPreviewFixture({
            projects: [
              cvProjectFixture({
                startDate: calendarDate('2023-01-01'),
                endDate: calendarDate('2023-12-31'),
              }),
            ],
          }),
        ),
      );

      expect(text).toContain('Period 01.2023 – 12.2023');
    });

    it('ends responsibilities with ";" and the last one with "." in place of their own punctuation', () => {
      const body = renderBody(
        cvPreviewFixture({
          projects: [
            cvProjectFixture({ responsibilities: 'Built the catalog.\nReviewed code;, Tests' }),
          ],
        }),
      );

      expect(body).toContain('<li>Built the catalog;</li><li>Reviewed code;</li><li>Tests.</li>');
    });

    it('hides empty roles, responsibilities, environment and description', () => {
      const body = renderBody(
        cvPreviewFixture({
          projects: [
            cvProjectFixture({
              roles: [],
              responsibilities: null,
              project: projectFixture({ description: ' ', technologies: [] }),
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
      expect(renderBody(cvPreviewFixture({ projects: [] }))).not.toContain('Projects');
    });
  });

  describe('professional skills', () => {
    it('renders one table body per category with the category cell spanning its skills', () => {
      const body = renderBody(cvPreviewFixture());

      expect(textOf(body)).toContain('Professional skills');
      expect(body.match(/<tbody>/g)).toHaveLength(1);
      expect(body).toContain('rowspan="2" class="skills__category">Frontend</th>');
      expect(body).toContain('<td class="skills__skill">React</td>');
      expect(body).toContain('<td class="skills__value">4</td>');
      expect(body).toContain('<td class="skills__value">2026</td>');
    });

    it('leaves experience and last used empty for a skill without projects', () => {
      const body = renderBody(cvPreviewFixture());
      const nextRow = body.slice(body.indexOf('Next.js'));

      expect(nextRow).toMatch(
        /Next\.js<\/td>\s*<td class="skills__value"><\/td>\s*<td class="skills__value"><\/td>/,
      );
    });

    it('hides the section when no category has skills', () => {
      const body = renderBody(
        cvPreviewFixture({ skillGroups: [{ category: skillCategoryFixture(), skills: [] }] }),
      );

      expect(body).not.toContain('Professional skills');
      expect(body).not.toContain('<table');
    });
  });
});
