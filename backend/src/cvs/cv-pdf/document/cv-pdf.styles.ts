/**
 * Styles of the CV PDF. A port of the CV Preview CSS modules
 * (`frontend/src/features/cvs/components/cv-preview/document/**`): keep both in sync.
 *
 * - CSS module classes become global ones with a block prefix (`summary__title`, `project__name`, …),
 *   because the modules reuse names such as `.title` and `.value` with different rules.
 * - Design tokens are replaced with their values from `frontend/src/shared/theme/tokens.css`;
 *   colors are the print palette from the `@media print` block of `CvPreviewDocument.module.css`.
 * - The Roboto `@font-face` rules are added by the template, this file only names the family.
 */
export const CV_PDF_STYLES = `
@page {
  size: A4;
  margin: 16mm 14mm;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #fff;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

/* CvPreviewDocument */
.document {
  --cv-text: #2e2e2e;
  --cv-muted: #626262;
  --cv-accent: #c63031;
  --cv-divider: #aeaeae;
  /* Two-column blocks (summary, projects): aside | red line | main */
  --cv-aside-width: 260px;
  --cv-column-gap: 24px;
  /* The red line starts this far above the first line of text */
  --cv-column-offset: 16px;

  color: var(--cv-text);
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.15px;
}

:where(.document) :where(h1, h2, h3, p, ul, dl, dd) {
  margin: 0;
}

.document__header {
  margin-bottom: 32px;
}

.document__title {
  font-size: 34px;
  font-weight: 400;
  line-height: 41.99px;
  letter-spacing: 0.25px;
}

.document__sub-title {
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.15px;
  text-transform: uppercase;
}

.document__body {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.document__section-title {
  margin-bottom: 32px;
  font-size: 34px;
  font-weight: 400;
  line-height: 41.99px;
  letter-spacing: 0.25px;
  break-after: avoid;
}

.document__projects {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* CvSummary: aside | red line | main, the same split as a project entry */
.summary {
  display: flex;
}

.summary__details,
.summary__description {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.summary__details {
  flex: 0 0 var(--cv-aside-width);
  padding-top: var(--cv-column-offset);
  padding-right: var(--cv-column-gap);
}

.summary__description {
  flex: 1;
  padding-top: var(--cv-column-offset);
  padding-left: var(--cv-column-gap);
  border-left: 1px solid var(--cv-accent);
}

/* Label → value 8px, value → next label 16px */
.summary__title {
  color: var(--cv-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.summary__value {
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.summary__value + .summary__title,
.summary__value + .summary__group,
.summary__group + .summary__group {
  margin-top: 16px;
}

.summary__text {
  margin-top: 8px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.summary__categories {
  margin-top: 16px;
}

/* ProfessionalSkills: dark uppercase head over a red line, red categories, grey line after each */
.skills {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 21px;
  letter-spacing: 0.15px;
}

.skills th,
.skills td {
  padding: 10px 16px 6px;
  text-align: start;
  vertical-align: top;
}

/* Repeats the head on every page */
.skills thead {
  display: table-header-group;
}

.skills thead th {
  border-bottom: 1px solid var(--cv-accent);
  font-weight: 500;
  text-transform: uppercase;
}

/* Keeps the visually hidden column names inside the cell */
.skills__head-cell {
  position: relative;
}

.skills tbody {
  border-bottom: 1px solid var(--cv-divider);
  break-inside: avoid;
}

/* Room below the last row of every category (the category cell spans all rows) */
.skills tbody tr:last-child > *,
.skills tbody .skills__category {
  padding-bottom: 22px;
}

.skills__category {
  width: 28%;
  color: var(--cv-accent);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.skills__skill {
  font-weight: 500;
  overflow-wrap: anywhere;
}

.skills .skills__value {
  text-align: center;
}

.skills thead th:nth-child(3) {
  width: 13.5%;
}

.skills thead th:nth-child(4) {
  width: 16.5%;
}

/* CvProjectEntry: aside | red line | details, the same split as the CV summary */
.project {
  display: flex;
}

.project__name,
.project__label {
  break-after: avoid;
}

.project__description {
  orphans: 4;
  widows: 4;
}

.project__list > li {
  break-inside: avoid;
}

.project__aside,
.project__details {
  min-width: 0;
}

.project__aside {
  flex: 0 0 var(--cv-aside-width);
  padding-top: var(--cv-column-offset);
  padding-right: var(--cv-column-gap);
}

.project__details {
  flex: 1;
  padding-top: var(--cv-column-offset);
  padding-left: var(--cv-column-gap);
  border-left: 1px solid var(--cv-accent);
}

.project__name {
  color: var(--cv-accent);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.project__description {
  margin-top: 8px;
  overflow-wrap: anywhere;
}

/* Label → value 8px, value → next label 16px, as in the CV summary */
.project__label {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.project__value {
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.project__value + .project__label {
  margin-top: 16px;
}

.project__list {
  padding-left: 20px;
  list-style: disc;
}
`;
