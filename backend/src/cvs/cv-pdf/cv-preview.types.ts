import type { Proficiency } from '@/common/graphql/enums';

/**
 * TEMPORARY: shape of the CV preview until B7 adds CvPreviewService.
 * Mirrors `cv-preview.types.ts` on the frontend; replace with the B7 model and delete this file.
 */
export type CvPdfSkill = {
  skill: { id: string; name: string };
  experienceYears: number | null;
  lastUsedYear: number | null;
};

export type CvPdfSkillGroup = {
  category: { id: string; name: string };
  skills: CvPdfSkill[];
};

export type CvPdfProject = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  responsibilities: string | null;
  roles: { id: string; name: string }[];
  project: {
    id: string;
    name: string;
    domain: string;
    description: string;
    technologies: { id: string; name: string }[];
  };
};

export type CvPdfData = {
  id: string;
  name: string;
  education: string;
  description: string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    position: { id: string; name: string } | null;
  };
  languages: { id: string; proficiency: Proficiency; language: { id: string; name: string } }[];
  domains: string[];
  skillGroups: CvPdfSkillGroup[];
  projects: CvPdfProject[];
};
