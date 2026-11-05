// Breadcrumbs are built from the URL only: /<section>/<id>/<tab>.
// SECTION_LABEL_KEYS: first URL segment → i18n key of the section name.
// DETAIL_TABS: sections with detail pages → their tab segments (= keys in `<section>.tabs`).
export const SECTION_LABEL_KEYS = {
  users: 'nav.employees',
  cvs: 'nav.cvs',
  skills: 'nav.skills',
  languages: 'nav.languages',
  departments: 'nav.departments',
  positions: 'nav.positions',
  projects: 'nav.projects',
  settings: 'layout.settings',
} as const;

export const DETAIL_TABS = {
  users: ['profile', 'skills', 'languages', 'cvs'],
  cvs: ['details', 'skills', 'projects', 'preview'],
} as const;


export type Section = keyof typeof SECTION_LABEL_KEYS;
export type DetailSection = keyof typeof DETAIL_TABS;
