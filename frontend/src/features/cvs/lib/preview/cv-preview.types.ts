import type { Proficiency } from '@/gql/graphql';

/**
 * TEMPORARY: local shape of the `cvPreview(id)` query result until the B7 contract lands in
 * `backend/schema.gql`. Mirrors the contract proposed to B7; once codegen produces `CvPreviewQuery`,
 * replace these with `CvPreviewQuery['cvPreview']` and delete this file.
 */

/** Calendar day from a `Date` scalar: `YYYY-MM-DD` */
type DateString = string;

export type CvPreviewSkill = {
  skill: { id: string; name: string };
  /** Full years since the earliest CV project with this skill in Environment; null without projects */
  experienceYears: number | null;
  /** End year of the latest such project (an active one counts as the current year); null without projects */
  lastUsedYear: number | null;
};

export type CvPreviewSkillGroup = {
  category: { id: string; name: string };
  skills: CvPreviewSkill[];
};

export type CvPreviewProject = {
  id: string;
  startDate: DateString;
  /** null means "Till now" */
  endDate: DateString | null;
  /** Free text, one responsibility per line */
  responsibilities: string | null;
  roles: { id: string; name: string }[];
  project: {
    id: string;
    name: string;
    domain: string;
    description: string;
    /** "Environment" in the UI */
    technologies: { id: string; name: string }[];
  };
};

export type CvPreviewData = {
  id: string;
  name: string;
  education: string;
  description: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    position: { id: string; name: string } | null;
  };
  languages: {
    id: string;
    proficiency: Proficiency;
    language: { id: string; name: string };
  }[];
  /** Distinct domains of the CV projects */
  domains: string[];
  skillGroups: CvPreviewSkillGroup[];
  projects: CvPreviewProject[];
};
