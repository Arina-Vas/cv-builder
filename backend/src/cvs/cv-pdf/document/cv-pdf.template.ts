import { Locale } from '@/common/graphql/locale.enum';
import { escapeHtml } from '@/common/html/escape-html';
import { getCvPdfFontFaces } from '@/cvs/cv-pdf/document/cv-pdf.fonts';
import { CV_PDF_LABELS, type CvPdfLabels } from '@/cvs/cv-pdf/document/cv-pdf.labels';
import { CV_PDF_STYLES } from '@/cvs/cv-pdf/document/cv-pdf.styles';
import type { CvPreview } from '@/cvs/cv-preview/models/cv-preview.model';
import type { CvProject } from '@/cvs/cv-projects/models/cv-project.model';
import type { CvPreviewSkillGroup } from '@/cvs/cv-preview/models/cv-preview-skill-group.model';

/**
 * HTML of the CV PDF. A port of the CV Preview components
 * (`frontend/src/features/cvs/components/cv-preview/document/**`): the same sections, the same rules
 * for hiding empty values and the same punctuation. Keep both in sync.
 *
 * Labels are the CV Preview texts of the requested locale (`CV_PDF_LABELS`). Every value from the data
 * and every label goes through `escapeHtml`.
 */

/** Mirrors `frontend/src/features/cv-projects/lib/split-responsibilities.ts` */
const RESPONSIBILITY_SEPARATOR = /[,\n]/;

export const splitResponsibilities = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(RESPONSIBILITY_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);

/** The item's own ".", ";" or "," at the end, replaced by the list punctuation */
const TRAILING_PUNCTUATION = /[.;,]+$/;

/** `MM.yyyy` in UTC: calendar dates come from Prisma as UTC midnight */
const formatMonth = (date: Date): string =>
  `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${date.getUTCFullYear()}`;

/** Replaces `{key}` placeholders, like the ICU arguments of next-intl (`languageLevel`, `period`) */
const format = (template: string, values: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** "First Last", or the email when the user has no name yet (as `getFullName` on the frontend) */
const getFullName = (user: CvPreview['user']): string =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

/** Renders the block only when the condition holds, like `{cond && …}` in JSX */
const when = (condition: unknown, render: () => string): string => (condition ? render() : '');

const joinNames = (items: { name: string }[]): string =>
  escapeHtml(items.map((item) => item.name).join(', '));

// CvSummary
const renderSummary = (data: CvPreview, labels: CvPdfLabels): string => {
  const education = data.education.trim();
  const description = data.description.trim();
  const groups = data.skillGroups.filter((group) => group.skills.length > 0);
  const languages = data.languages
    .map((item) =>
      format(labels.languageLevel, {
        language: item.language.name,
        level: labels.proficiency[item.proficiency],
      }),
    )
    .join(', ');

  return `
<section class="summary">
  <dl class="summary__details">
    ${when(
      education,
      () => `
    <dt class="summary__title">${escapeHtml(labels.sections.education)}</dt>
    <dd class="summary__value">${escapeHtml(education)}</dd>`,
    )}
    ${when(
      data.languages.length > 0,
      () => `
    <dt class="summary__title">${escapeHtml(labels.sections.languages)}</dt>
    <dd class="summary__value">${escapeHtml(languages)}</dd>`,
    )}
    ${when(
      data.domains.length > 0,
      () => `
    <dt class="summary__title">${escapeHtml(labels.sections.domains)}</dt>
    <dd class="summary__value">${escapeHtml(data.domains.join(', '))}</dd>`,
    )}
  </dl>
  <div class="summary__description">
    <h2 class="summary__title">${escapeHtml(data.name)}</h2>
    ${when(description, () => `<p class="summary__text">${escapeHtml(description)}</p>`)}
    ${when(
      groups.length > 0,
      () => `
    <dl class="summary__categories">
      ${groups
        .map(
          (group) => `
      <div class="summary__group">
        <dt class="summary__title">${escapeHtml(group.category.name)}</dt>
        <dd class="summary__value">${escapeHtml(group.skills.map((item) => item.skill.name).join(', '))}.</dd>
      </div>`,
        )
        .join('')}
    </dl>`,
    )}
  </div>
</section>`;
};

// CvProjectEntry
const renderResponsibilities = (items: string[]): string =>
  items
    .map(
      (item, index) =>
        `<li>${escapeHtml(item.replace(TRAILING_PUNCTUATION, ''))}${
          index === items.length - 1 ? '.' : ';'
        }</li>`,
    )
    .join('');

const renderProject = (entry: CvProject, labels: CvPdfLabels): string => {
  const responsibilities = splitResponsibilities(entry.responsibilities);
  const description = entry.project.description.trim();
  const { technologies } = entry.project;
  const end = entry.endDate ? formatMonth(entry.endDate) : labels.present;
  const period = format(labels.period, { start: formatMonth(entry.startDate), end });

  return `
<article class="project">
  <div class="project__aside">
    <h3 class="project__name">${escapeHtml(entry.project.name)}</h3>
    ${when(description, () => `<p class="project__description">${escapeHtml(description)}</p>`)}
  </div>
  <dl class="project__details">
    ${when(
      entry.roles.length > 0,
      () => `
    <dt class="project__label">${escapeHtml(labels.project.roles)}</dt>
    <dd class="project__value">${joinNames(entry.roles)}</dd>`,
    )}
    <dt class="project__label">${escapeHtml(labels.project.period)}</dt>
    <dd class="project__value">${escapeHtml(period)}</dd>
    ${when(
      responsibilities.length > 0,
      () => `
    <dt class="project__label">${escapeHtml(labels.project.responsibilities)}</dt>
    <dd class="project__value">
      <ul class="project__list">${renderResponsibilities(responsibilities)}</ul>
    </dd>`,
    )}
    ${when(
      technologies.length > 0,
      () => `
    <dt class="project__label">${escapeHtml(labels.project.environment)}</dt>
    <dd class="project__value">${joinNames(technologies)}.</dd>`,
    )}
  </dl>
</article>`;
};

// ProfessionalSkills
const renderSkillGroup = (group: CvPreviewSkillGroup): string => `
    <tbody>
      ${group.skills
        .map(
          (item, index) => `
      <tr>
        ${when(
          index === 0,
          () =>
            `<th scope="rowgroup" rowspan="${group.skills.length}" class="skills__category">${escapeHtml(group.category.name)}</th>`,
        )}
        <td class="skills__skill">${escapeHtml(item.skill.name)}</td>
        <td class="skills__value">${item.experienceYears ?? ''}</td>
        <td class="skills__value">${item.lastUsedYear ?? ''}</td>
      </tr>`,
        )
        .join('')}
    </tbody>`;

const renderSkills = (skillGroups: CvPreviewSkillGroup[], labels: CvPdfLabels): string => {
  const groups = skillGroups.filter((group) => group.skills.length > 0);
  if (groups.length === 0) return '';

  return `
<section>
  <h2 class="document__section-title">${escapeHtml(labels.sections.professionalSkills)}</h2>
  <table class="skills">
    <thead>
      <tr>
        <th scope="col" class="skills__head-cell">
          <span aria-hidden="true">${escapeHtml(labels.skillsTable.skills)}</span>
          <span class="visually-hidden">${escapeHtml(labels.skillsTable.category)}</span>
        </th>
        <th scope="col" class="skills__head-cell">
          <span class="visually-hidden">${escapeHtml(labels.skillsTable.skill)}</span>
        </th>
        <th scope="col" class="skills__value">${escapeHtml(labels.skillsTable.experience)}</th>
        <th scope="col" class="skills__value">${escapeHtml(labels.skillsTable.lastUsed)}</th>
      </tr>
    </thead>
    ${groups.map(renderSkillGroup).join('')}
  </table>
</section>`;
};

// CvPreviewDocument
export const renderCvPdfHtml = (data: CvPreview, locale: Locale = Locale.en): string => {
  const labels = CV_PDF_LABELS[locale];

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; font-src data:">
  <title>${escapeHtml(data.name)}</title>
  <style>${getCvPdfFontFaces()}${CV_PDF_STYLES}</style>
</head>
<body>
  <article class="document">
    <header class="document__header">
      <h1 class="document__title">${escapeHtml(getFullName(data.user))}</h1>
      ${when(
        data.user.position,
        () => `<p class="document__sub-title">${escapeHtml(data.user.position?.name ?? '')}</p>`,
      )}
    </header>
    <div class="document__body">
      ${renderSummary(data, labels)}
      ${when(
        data.projects.length > 0,
        () => `
      <section>
        <h2 class="document__section-title">${escapeHtml(labels.sections.projects)}</h2>
        <div class="document__projects">${data.projects
          .map((project) => renderProject(project, labels))
          .join('')}</div>
      </section>`,
      )}
      ${renderSkills(data.skillGroups, labels)}
    </div>
  </article>
</body>
</html>`;
};
