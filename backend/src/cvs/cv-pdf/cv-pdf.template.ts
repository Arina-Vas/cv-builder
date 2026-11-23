import { Proficiency } from '@/common/graphql/enums';
import { escapeHtml } from '@/common/html/escape-html';
import { getCvPdfFontFaces } from '@/cvs/cv-pdf/cv-pdf.fonts';
import { CV_PDF_STYLES } from '@/cvs/cv-pdf/cv-pdf.styles';
import type { CvPdfData, CvPdfProject, CvPdfSkillGroup } from '@/cvs/cv-pdf/cv-preview.types';

/**
 * HTML of the CV PDF. A port of the CV Preview components
 * (`frontend/src/features/cvs/components/cv-preview/document/**`): the same sections, the same rules
 * for hiding empty values and the same punctuation. Keep both in sync.
 *
 * Every value from the data goes through `escapeHtml`; labels are constants.
 */

/** English texts of `cvs.preview.document` and `userLanguage.proficiencyLevel` in `frontend/messages/en.json` */
const LABELS = {
  sections: {
    education: 'Education',
    languages: 'Language proficiency',
    domains: 'Domains',
    projects: 'Projects',
    professionalSkills: 'Professional skills',
  },
  project: {
    roles: 'Project roles',
    period: 'Period',
    responsibilities: 'Responsibilities',
    environment: 'Environment',
  },
  present: 'Present',
  skillsTable: {
    skills: 'Skills',
    category: 'Skill category',
    skill: 'Skill',
    experience: 'Experience in years',
    lastUsed: 'Last used',
  },
} as const;

const PROFICIENCY_LABELS: Record<Proficiency, string> = {
  [Proficiency.A1]: 'A1',
  [Proficiency.A2]: 'A2',
  [Proficiency.B1]: 'B1',
  [Proficiency.B2]: 'B2',
  [Proficiency.C1]: 'C1',
  [Proficiency.C2]: 'C2',
  [Proficiency.NATIVE]: 'Native',
};

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

/** "First Last", or the email when the user has no name yet (as `getFullName` on the frontend) */
const getFullName = (user: CvPdfData['user']): string =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

/** Renders the block only when the condition holds, like `{cond && …}` in JSX */
const when = (condition: unknown, render: () => string): string => (condition ? render() : '');

const joinNames = (items: { name: string }[]): string =>
  escapeHtml(items.map((item) => item.name).join(', '));

// CvSummary
const renderSummary = (data: CvPdfData): string => {
  const education = data.education.trim();
  const description = data.description.trim();
  const groups = data.skillGroups.filter((group) => group.skills.length > 0);
  const languages = data.languages
    .map((item) => `${item.language.name} — ${PROFICIENCY_LABELS[item.proficiency]}`)
    .join(', ');

  return `
<section class="summary">
  <dl class="summary__details">
    ${when(
      education,
      () => `
    <dt class="summary__title">${LABELS.sections.education}</dt>
    <dd class="summary__value">${escapeHtml(education)}</dd>`,
    )}
    ${when(
      data.languages.length > 0,
      () => `
    <dt class="summary__title">${LABELS.sections.languages}</dt>
    <dd class="summary__value">${escapeHtml(languages)}</dd>`,
    )}
    ${when(
      data.domains.length > 0,
      () => `
    <dt class="summary__title">${LABELS.sections.domains}</dt>
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

const renderProject = (entry: CvPdfProject): string => {
  const responsibilities = splitResponsibilities(entry.responsibilities);
  const description = entry.project.description.trim();
  const { technologies } = entry.project;
  const end = entry.endDate ? formatMonth(entry.endDate) : LABELS.present;

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
    <dt class="project__label">${LABELS.project.roles}</dt>
    <dd class="project__value">${joinNames(entry.roles)}</dd>`,
    )}
    <dt class="project__label">${LABELS.project.period}</dt>
    <dd class="project__value">${formatMonth(entry.startDate)} – ${end}</dd>
    ${when(
      responsibilities.length > 0,
      () => `
    <dt class="project__label">${LABELS.project.responsibilities}</dt>
    <dd class="project__value">
      <ul class="project__list">${renderResponsibilities(responsibilities)}</ul>
    </dd>`,
    )}
    ${when(
      technologies.length > 0,
      () => `
    <dt class="project__label">${LABELS.project.environment}</dt>
    <dd class="project__value">${joinNames(technologies)}.</dd>`,
    )}
  </dl>
</article>`;
};

// ProfessionalSkills
const renderSkillGroup = (group: CvPdfSkillGroup): string => `
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

const renderSkills = (skillGroups: CvPdfSkillGroup[]): string => {
  const groups = skillGroups.filter((group) => group.skills.length > 0);
  if (groups.length === 0) return '';

  return `
<section>
  <h2 class="document__section-title">${LABELS.sections.professionalSkills}</h2>
  <table class="skills">
    <thead>
      <tr>
        <th scope="col" class="skills__head-cell">
          <span aria-hidden="true">${LABELS.skillsTable.skills}</span>
          <span class="visually-hidden">${LABELS.skillsTable.category}</span>
        </th>
        <th scope="col" class="skills__head-cell">
          <span class="visually-hidden">${LABELS.skillsTable.skill}</span>
        </th>
        <th scope="col" class="skills__value">${LABELS.skillsTable.experience}</th>
        <th scope="col" class="skills__value">${LABELS.skillsTable.lastUsed}</th>
      </tr>
    </thead>
    ${groups.map(renderSkillGroup).join('')}
  </table>
</section>`;
};

// CvPreviewDocument
export const renderCvPdfHtml = (data: CvPdfData): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
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
      ${renderSummary(data)}
      ${when(
        data.projects.length > 0,
        () => `
      <section>
        <h2 class="document__section-title">${LABELS.sections.projects}</h2>
        <div class="document__projects">${data.projects.map(renderProject).join('')}</div>
      </section>`,
      )}
      ${renderSkills(data.skillGroups)}
    </div>
  </article>
</body>
</html>`;
