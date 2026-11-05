import type { BreadcrumbItem } from '@/shared/components/breadcrumbs';
import { ProfileIcon } from '@/shared/components/icons/ProfileIcon';
import {
  DETAIL_TABS,
  SECTION_LABEL_KEYS,
  type DetailSection,
  type Section,
} from './breadcrumbs.constants';

export type BreadcrumbRoute =
  | { kind: 'section'; section: Section }
  | { kind: 'detail'; section: DetailSection; id: string; tab: string };

type SectionLabelKey = (typeof SECTION_LABEL_KEYS)[Section];
type TabLabelKey = {
  [S in DetailSection]: `${S}.tabs.${(typeof DETAIL_TABS)[S][number]}`;
}[DetailSection];
export type BreadcrumbLabelKey = SectionLabelKey | TabLabelKey;

export interface UserOrCvName {
  name?: string;
  loading: boolean;
}

const isSection = (value: string): value is Section => Object.hasOwn(SECTION_LABEL_KEYS, value);

const isDetailSection = (value: Section): value is DetailSection =>
  Object.hasOwn(DETAIL_TABS, value);

const isTabOf = (section: DetailSection, tab: string) =>
  (DETAIL_TABS[section] as readonly string[]).includes(tab);

export function parseBreadcrumbRoute(pathname: string): BreadcrumbRoute | null {
  const [section, id, tab] = pathname.split('/').filter(Boolean);

  if (!section || !isSection(section)) return null;
  if (!id || !isDetailSection(section)) return { kind: 'section', section };
  if (!tab || !isTabOf(section, tab)) return null;

  return { kind: 'detail', section, id, tab };
}

export function buildBreadcrumbs(
  route: BreadcrumbRoute | null,
  translate: (key: BreadcrumbLabelKey) => string,
  userOrCvName: UserOrCvName,
): BreadcrumbItem[] {
  if (!route) return [];

  const sectionLabel = translate(SECTION_LABEL_KEYS[route.section]);

  if (route.kind === 'section') return [{ label: sectionLabel }];

  const { section, id, tab } = route;

  return [
    { label: sectionLabel, href: `/${section}` },
    {
      label: userOrCvName.name ?? '',
      href: `/${section}/${id}/${DETAIL_TABS[section][0]}`,
      icon: section === 'users' ? ProfileIcon : undefined,
      variant: 'entity',
      loading: userOrCvName.loading,
    },
    { label: translate(`${section}.tabs.${tab}` as TabLabelKey) },
  ];
}
