import type {
  CvPreviewFieldsFragment,
  CvPreviewSkillGroupFieldsFragment,
  CvProjectFieldsFragment,
} from '@/gql/graphql';

type CvPreviewSkill = CvPreviewSkillGroupFieldsFragment['skills'][number];

/**
 * Test data for the CV Preview document, shaped as the `cvPreview` query returns it.
 * Catalog names (skills, categories, projects, roles, languages) match `backend/prisma/seed.ts`.
 * Derived values (experienceYears, lastUsedYear, domains) are precomputed as the backend would
 * return them on 2026-11-20 — the frontend only renders them, it never recalculates.
 *
 * Fixtures:
 * - `cvPreviewFixture` — typical full CV, close to the Figma frame.
 * - `cvPreviewSparseFixture` — every optional part empty: name falls back to email, no position,
 *   no languages/domains/skills/projects (checks that empty sections are hidden).
 * - `cvPreviewEdgeCasesFixture` — long unbroken text, project without roles/responsibilities,
 *   messy responsibilities, skills without experience, an empty category, duplicate-free domains.
 */

// --- catalog -----------------------------------------------------------------------------------

const category = (id: string, name: string) => ({ id: `category-${id}`, name });

const CATEGORIES = {
  languages: category('languages', 'Programming Languages'),
  frontend: category('frontend', 'Frontend'),
  backend: category('backend', 'Backend'),
  databases: category('databases', 'Databases'),
  devops: category('devops', 'DevOps'),
  sourceControl: category('source-control', 'Source Control Systems'),
};

const skill = (name: string) => ({
  id: `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
});

const SKILLS = {
  javascript: skill('JavaScript'),
  typescript: skill('TypeScript'),
  python: skill('Python'),
  react: skill('React'),
  nextjs: skill('Next.js'),
  angular: skill('Angular'),
  html: skill('HTML5'),
  css: skill('CSS3'),
  nodejs: skill('Node.js'),
  nestjs: skill('NestJS'),
  express: skill('Express'),
  graphql: skill('GraphQL'),
  postgresql: skill('PostgreSQL'),
  mongodb: skill('MongoDB'),
  redis: skill('Redis'),
  docker: skill('Docker'),
  aws: skill('AWS'),
  git: skill('Git'),
  github: skill('GitHub'),
};

const role = (name: string) => ({
  id: `role-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
});

const ROLES = {
  frontend: role('Frontend Developer'),
  backend: role('Backend Developer'),
  fullStack: role('Full Stack Developer'),
  teamLead: role('Team Lead'),
};

const withExperience = (
  s: CvPreviewSkill['skill'],
  experienceYears: number | null,
  lastUsedYear: number | null,
): CvPreviewSkill => ({ skill: s, experienceYears, lastUsedYear });

// --- projects ----------------------------------------------------------------------------------

const shopWave: CvProjectFieldsFragment = {
  id: 'cv-project-shopwave',
  startDate: '2022-03-01',
  endDate: '2024-12-31',
  responsibilities: [
    'Built the product catalog and checkout flow with server-side rendering',
    'Implemented the seller admin panel for orders and inventory reports',
    'Set up component library and visual regression tests',
  ].join('\n'),
  roles: [ROLES.frontend, ROLES.fullStack],
  project: {
    id: 'project-shopwave',
    startDate: '2021-01-01',
    endDate: '2025-06-30',
    name: 'ShopWave',
    domain: 'E-commerce',
    description:
      'Online marketplace with product catalog, cart, checkout and an admin panel for sellers.',
    technologies: [
      SKILLS.typescript,
      SKILLS.react,
      SKILLS.nextjs,
      SKILLS.nodejs,
      SKILLS.postgresql,
    ],
  },
};

const mediTrack: CvProjectFieldsFragment = {
  id: 'cv-project-meditrack',
  startDate: '2023-06-01',
  endDate: '2026-06-30',
  responsibilities: [
    'Led a team of four developers',
    'Planned sprints and reviewed code',
    'Designed the GraphQL API for appointments and medical records',
    'Containerized services and prepared the staging environment',
  ].join('\n'),
  roles: [ROLES.fullStack, ROLES.teamLead],
  project: {
    id: 'project-meditrack',
    startDate: '2023-01-01',
    endDate: '2026-12-31',
    name: 'MediTrack',
    domain: 'Healthcare',
    description: 'Patient appointment and medical records system for a network of private clinics.',
    technologies: [
      SKILLS.typescript,
      SKILLS.angular,
      SKILLS.nestjs,
      SKILLS.graphql,
      SKILLS.postgresql,
      SKILLS.docker,
    ],
  },
};

/** Active project: endDate null → "Till now" */
const finSight: CvProjectFieldsFragment = {
  id: 'cv-project-finsight',
  startDate: '2024-01-15',
  endDate: null,
  responsibilities: [
    'Developing spending analytics dashboards and charts',
    'Integrating bank account synchronization',
  ].join('\n'),
  roles: [ROLES.frontend],
  project: {
    id: 'project-finsight',
    startDate: '2023-10-01',
    endDate: '2027-12-31',
    name: 'FinSight',
    domain: 'Finance',
    description: 'Dashboard for personal budgeting with bank account sync and spending analytics.',
    technologies: [SKILLS.javascript, SKILLS.react, SKILLS.express, SKILLS.mongodb, SKILLS.aws],
  },
};

// --- skill groups (what the backend derives from the projects above) -------------------------

const fullSkillGroups: CvPreviewSkillGroupFieldsFragment[] = [
  {
    category: CATEGORIES.languages,
    skills: [
      withExperience(SKILLS.typescript, 4, 2026),
      withExperience(SKILLS.javascript, 2, 2026),
    ],
  },
  {
    category: CATEGORIES.frontend,
    skills: [
      withExperience(SKILLS.react, 4, 2026),
      withExperience(SKILLS.nextjs, 4, 2024),
      withExperience(SKILLS.angular, 3, 2026),
    ],
  },
  {
    category: CATEGORIES.backend,
    skills: [
      withExperience(SKILLS.nodejs, 4, 2024),
      withExperience(SKILLS.nestjs, 3, 2026),
      withExperience(SKILLS.graphql, 3, 2026),
      withExperience(SKILLS.express, 2, 2026),
    ],
  },
  {
    category: CATEGORIES.databases,
    skills: [withExperience(SKILLS.postgresql, 4, 2026), withExperience(SKILLS.mongodb, 2, 2026)],
  },
  {
    category: CATEGORIES.devops,
    skills: [withExperience(SKILLS.docker, 3, 2026), withExperience(SKILLS.aws, 2, 2026)],
  },
  {
    // In the CV skills but in no CV project → no experience values
    category: CATEGORIES.sourceControl,
    skills: [withExperience(SKILLS.git, null, null), withExperience(SKILLS.github, null, null)],
  },
];

// --- fixtures ----------------------------------------------------------------------------------

export const cvPreviewFixture: CvPreviewFieldsFragment = {
  id: 'cv-1',
  name: 'Senior Frontend Developer CV',
  education: 'Belarusian State University of Informatics and Radioelectronics, 2019',
  description:
    'Frontend developer with 4+ years of commercial experience building web applications with ' +
    'React, Angular and TypeScript. Comfortable across the stack with Node.js and GraphQL, ' +
    'experienced in leading small teams and setting up frontend architecture.',
  user: {
    id: 'user-1',
    email: 'eleanor.whitmore@example.com',
    firstName: 'Eleanor',
    lastName: 'Whitmore',
    position: { id: 'position-senior-software-engineer', name: 'Senior Software Engineer' },
  },
  languages: [
    { id: 'user-language-en', proficiency: 'C1', language: { id: 'language-en', name: 'English' } },
    { id: 'user-language-pl', proficiency: 'B2', language: { id: 'language-pl', name: 'Polish' } },
    {
      id: 'user-language-ru',
      proficiency: 'NATIVE',
      language: { id: 'language-ru', name: 'Russian' },
    },
  ],
  domains: ['E-commerce', 'Healthcare', 'Finance'],
  skillGroups: fullSkillGroups,
  projects: [finSight, mediTrack, shopWave],
};

export const cvPreviewSparseFixture: CvPreviewFieldsFragment = {
  id: 'cv-sparse',
  name: 'Draft CV',
  education: '',
  description: '',
  user: {
    id: 'user-sparse',
    email: 'new.employee@example.com',
    firstName: null,
    lastName: null,
    position: null,
  },
  languages: [],
  domains: [],
  skillGroups: [],
  projects: [],
};

const longWord = 'Supercalifragilisticexpialidocious'.repeat(3);

export const cvPreviewEdgeCasesFixture: CvPreviewFieldsFragment = {
  id: 'cv-edge',
  name: `Principal Full Stack Engineer CV for the Enterprise Healthcare Programme ${longWord}`,
  education: `Master of Science in Computer Engineering, ${longWord} University of Technology`,
  description: `A very long description without spaces: ${longWord}${longWord}.\nSecond paragraph after a line break.`,
  user: {
    id: 'user-edge',
    email: 'alexandria.montgomery-fitzgerald@example.com',
    firstName: 'Alexandria-Konstantina',
    lastName: 'Montgomery-Fitzgerald',
    position: { id: 'position-pm', name: 'Project Manager' },
  },
  languages: [
    {
      id: 'user-language-uk',
      proficiency: 'A1',
      language: { id: 'language-uk', name: 'Ukrainian' },
    },
  ],
  // Two projects share "Healthcare" — the backend already returns it once
  domains: ['Healthcare', 'E-commerce'],
  skillGroups: [
    {
      category: CATEGORIES.languages,
      skills: [
        withExperience(SKILLS.typescript, 0, 2026),
        withExperience(SKILLS.python, null, null),
      ],
    },
    {
      // Should not happen per the contract, but the UI must hide a category without skills
      category: CATEGORIES.devops,
      skills: [],
    },
    {
      category: CATEGORIES.frontend,
      skills: [withExperience(SKILLS.html, null, null), withExperience(SKILLS.css, null, null)],
    },
  ],
  projects: [
    {
      // No roles, no responsibilities → both rows hidden; started this month
      id: 'cv-project-edge-1',
      startDate: '2026-11-01',
      endDate: null,
      responsibilities: null,
      roles: [],
      project: {
        id: 'project-edge-1',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        name: `MediTrack Mobile ${longWord}`,
        domain: 'Healthcare',
        description: 'Mobile companion app.',
        technologies: [SKILLS.typescript],
      },
    },
    {
      // Messy responsibilities: blank lines, surrounding spaces, Windows line endings, commas
      // (splitResponsibilities splits by a new line and by a comma, as the CV project form hints)
      id: 'cv-project-edge-2',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      responsibilities:
        '\n  Migrated legacy reports  \r\n\r\n\n   \nWrote integration tests, fixed flaky specs ,\n' +
        `A single very long responsibility line that must wrap nicely inside the column ${longWord}\n`,
      roles: [ROLES.backend],
      project: {
        id: 'project-edge-2',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        name: 'MediTrack',
        domain: 'Healthcare',
        description: '',
        technologies: [],
      },
    },
    {
      // Only whitespace and separators in responsibilities → treat as empty
      id: 'cv-project-edge-3',
      startDate: '2024-05-01',
      endDate: '2024-09-30',
      responsibilities: ' \n , \n',
      roles: [ROLES.frontend, ROLES.backend, ROLES.fullStack, ROLES.teamLead],
      project: {
        id: 'project-edge-3',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        name: 'ShopWave',
        domain: 'E-commerce',
        description:
          'Online marketplace with product catalog, cart, checkout and an admin panel for sellers.',
        technologies: Object.values(SKILLS),
      },
    },
  ],
};
