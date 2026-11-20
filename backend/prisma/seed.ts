import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

// Idempotent: safe to run many times, existing rows are left as they are.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv('DATABASE_URL') }),
});

const DEPARTMENTS = ['Frontend', 'Backend', 'Quality Assurance', 'DevOps', 'Design'];

const POSITIONS = [
  'Junior Software Engineer',
  'Software Engineer',
  'Senior Software Engineer',
  'QA Engineer',
  'Project Manager',
];

const SKILLS_BY_CATEGORY: { name: string; type: string; skills: string[] }[] = [
  {
    name: 'Programming Languages',
    type: 'Programming',
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java'],
  },
  { name: 'Frontend', type: 'Frontend', skills: ['React', 'Next.js', 'Angular', 'HTML5', 'CSS3'] },
  { name: 'Backend', type: 'Backend', skills: ['Node.js', 'NestJS', 'Express', 'GraphQL'] },
  { name: 'Databases', type: 'Backend', skills: ['PostgreSQL', 'MongoDB', 'Redis'] },
  { name: 'DevOps', type: 'DevOps', skills: ['Docker', 'Kubernetes', 'AWS'] },
  { name: 'Source Control Systems', type: 'Tools', skills: ['Git', 'GitHub', 'GitLab'] },
];

const LANGUAGES = [
  { name: 'English', iso: 'EN', nativeName: 'English' },
  { name: 'French', iso: 'FR', nativeName: 'Français' },
  { name: 'German', iso: 'DE', nativeName: 'Deutsch' },
  { name: 'Italian', iso: 'IT', nativeName: 'Italiano' },
  { name: 'Polish', iso: 'PL', nativeName: 'Polski' },
  { name: 'Portuguese', iso: 'PT', nativeName: 'Português' },
  { name: 'Russian', iso: 'RU', nativeName: 'Русский' },
  { name: 'Spanish', iso: 'ES', nativeName: 'Español' },
  { name: 'Ukrainian', iso: 'UK', nativeName: 'Українська' },
];

const PROJECT_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
  'Team Lead',
  'Project Manager',
];

const PROJECTS = [
  {
    name: 'ShopWave',
    domain: 'E-commerce',
    startDate: '2022-03-01',
    endDate: '2024-12-31',
    description:
      'Online marketplace with product catalog, cart, checkout and an admin panel for sellers.',
    technologies: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    name: 'MediTrack',
    domain: 'Healthcare',
    startDate: '2023-06-01',
    endDate: '2026-06-30',
    description: 'Patient appointment and medical records system for a network of private clinics.',
    technologies: ['TypeScript', 'Angular', 'NestJS', 'GraphQL', 'PostgreSQL', 'Docker'],
  },
  {
    name: 'FinSight',
    domain: 'Finance',
    startDate: '2024-01-15',
    endDate: '2027-01-15',
    description: 'Dashboard for personal budgeting with bank account sync and spending analytics.',
    technologies: ['JavaScript', 'React', 'Express', 'MongoDB', 'AWS'],
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} (see backend/.env.example)`);
  }
  return value;
}

async function seedCatalogs(): Promise<void> {
  await prisma.department.createMany({
    data: DEPARTMENTS.map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.position.createMany({
    data: POSITIONS.map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.skillCategory.createMany({
    data: SKILLS_BY_CATEGORY.map(({ name, type }) => ({ name, type })),
    skipDuplicates: true,
  });
  const categories = await prisma.skillCategory.findMany();
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  await prisma.skill.createMany({
    data: SKILLS_BY_CATEGORY.flatMap(({ name, skills }) =>
      skills.map((skill) => ({ name: skill, categoryId: categoryIdByName.get(name)! })),
    ),
    skipDuplicates: true,
  });

  await prisma.language.createMany({ data: LANGUAGES, skipDuplicates: true });
  await prisma.projectRole.createMany({
    data: PROJECT_ROLES.map((name) => ({ name })),
    skipDuplicates: true,
  });
}

async function seedProjects(): Promise<void> {
  const skills = await prisma.skill.findMany();
  const skillIdByName = new Map(skills.map((s) => [s.name, s.id]));

  for (const { technologies, startDate, endDate, ...project } of PROJECTS) {
    // Project name is not unique, so look it up instead of upsert.
    const existing = await prisma.project.findFirst({ where: { name: project.name } });
    const { id } =
      existing ??
      (await prisma.project.create({
        data: { ...project, startDate: new Date(startDate), endDate: new Date(endDate) },
      }));

    await prisma.projectSkill.createMany({
      data: technologies.map((skill) => ({ projectId: id, skillId: skillIdByName.get(skill)! })),
      skipDuplicates: true,
    });
  }
}

async function seedUsers(): Promise<void> {
  const department = await prisma.department.findUniqueOrThrow({ where: { name: 'Frontend' } });
  const users = [
    {
      email: requireEnv('SEED_ADMIN_EMAIL'),
      password: requireEnv('SEED_ADMIN_PASSWORD'),
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      position: 'Project Manager',
    },
    {
      email: requireEnv('SEED_EMPLOYEE_EMAIL'),
      password: requireEnv('SEED_EMPLOYEE_PASSWORD'),
      role: UserRole.EMPLOYEE,
      firstName: 'John',
      lastName: 'Doe',
      position: 'Software Engineer',
    },
  ];

  for (const { email, password, position, ...user } of users) {
    const { id: positionId } = await prisma.position.findUniqueOrThrow({
      where: { name: position },
    });
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        ...user,
        email,
        passwordHash: await argon2.hash(password),
        emailVerifiedAt: new Date(),
        departmentId: department.id,
        positionId,
      },
    });
  }
}

const DEMO_FIRST_NAMES = [
  'Olivia',
  'Liam',
  'Emma',
  'Noah',
  'Sophia',
  'Lucas',
  'Mia',
  'Ethan',
  'Anna',
  'Mark',
];

const DEMO_LAST_NAMES = ['Smith', 'Kowalski', 'Müller', 'Rossi', 'Shevchenko', 'Garcia'];

/**
 * 60 employees (every first × last name) for the Employees list: enough for a second page at
 * pageSize 50. Deterministic, so every run produces the same people. Every 15th has no name and
 * every 12th has no department/position, to show the email fallback and empty cells.
 * They sign in with SEED_EMPLOYEE_PASSWORD.
 */
async function seedDemoUsers(): Promise<void> {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  const positions = await prisma.position.findMany({ orderBy: { name: 'asc' } });
  // argon2 is slow on purpose: hash once, not 60 times
  const passwordHash = await argon2.hash(requireEnv('SEED_EMPLOYEE_PASSWORD'));

  const users = DEMO_FIRST_NAMES.flatMap((firstName, i) =>
    DEMO_LAST_NAMES.map((lastName, j) => {
      const index = i * DEMO_LAST_NAMES.length + j;
      const hasName = index % 15 !== 14;
      const hasJob = index % 12 !== 11;

      return {
        email: `${firstName}.${lastName}@example.com`.toLowerCase(),
        passwordHash,
        emailVerifiedAt: new Date(),
        firstName: hasName ? firstName : null,
        lastName: hasName ? lastName : null,
        departmentId: hasJob ? departments[index % departments.length]!.id : null,
        positionId: hasJob ? positions[index % positions.length]!.id : null,
      };
    }),
  );

  await prisma.user.createMany({ data: users, skipDuplicates: true });
}

type SeedCv = { name: string; education: string; description: string };

const CV_TEMPLATES: SeedCv[] = [
  {
    name: 'Software Engineer with 5+ years of experience',
    education: 'Computer Systems Design',
    description:
      'Highly motivated and experienced Software Engineer with 5+ years of proven success in leading ' +
      'and developing robust and scalable applications. Adept at leveraging React, Node.js and ' +
      'TypeScript to create innovative and visually appealing user interfaces.',
  },
  {
    name: 'Frontend Developer',
    education: 'Applied Mathematics',
    description:
      'Frontend developer focused on accessible, responsive interfaces built with React and TypeScript.',
  },
  {
    name: 'Full Stack Developer',
    education: 'Software Engineering',
    description:
      'Full stack developer building GraphQL APIs with NestJS and PostgreSQL and the React clients ' +
      'that consume them.',
  },
  {
    name: 'Backend Developer',
    education: 'Information Systems and Technologies',
    description:
      'Backend developer experienced in Node.js services, relational databases and cloud deployment.',
  },
  {
    name: 'Angular Developer',
    education: 'Computer Science',
    description: 'Angular developer working on enterprise dashboards and complex reactive forms.',
  },
  {
    name: 'QA Automation Engineer',
    education: 'Radio Engineering',
    description: 'QA engineer who writes end-to-end and API tests and keeps CI pipelines green.',
  },
  {
    name: 'DevOps Engineer',
    education: 'Computer Networks',
    description: 'DevOps engineer working with Docker, Kubernetes and AWS infrastructure as code.',
  },
  {
    name: 'Team Lead',
    education: 'Computer Systems Design',
    description:
      'Team lead who mentors junior developers, plans releases and keeps the codebase healthy.',
  },
  {
    name: 'React Native Developer',
    education: 'Applied Informatics',
    description: 'Mobile developer shipping cross-platform apps with React Native and TypeScript.',
  },
  {
    name: 'Node.js Developer',
    education: 'Software Engineering',
    description: 'Node.js developer building REST and GraphQL services with Express and NestJS.',
  },
  {
    name: 'Junior Frontend Developer',
    education: 'Computer Science',
    description: 'Junior developer with a solid HTML, CSS and JavaScript base, learning React.',
  },
  {
    name: 'Project Manager',
    education: 'Economics and Management',
    description: 'Project manager running agile teams and communicating with stakeholders.',
  },
];

/** Demo employees that get one CV each, so the Admin CVs list has owners to search by email. */
const CV_DEMO_OWNERS = 8;

/**
 * CVs without skills or projects (those belong to the CV Skills / CV Projects tasks).
 * The seeded employee gets every template: 12 CVs, a second page at pageSize 10. The admin gets one,
 * and the first CV_DEMO_OWNERS demo employees get one each, so an Admin sees 21 CVs of 10 owners.
 * Cv.name is not unique, so a CV is skipped when its owner already has one with that name.
 */
async function seedCvs(): Promise<void> {
  const employee = await prisma.user.findUniqueOrThrow({
    where: { email: requireEnv('SEED_EMPLOYEE_EMAIL') },
  });
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: requireEnv('SEED_ADMIN_EMAIL') },
  });
  const demoOwners = await prisma.user.findMany({
    where: { email: { endsWith: '@example.com' } },
    orderBy: { email: 'asc' },
    take: CV_DEMO_OWNERS,
  });

  const cvs = [
    ...CV_TEMPLATES.map((cv) => ({ ...cv, userId: employee.id })),
    { ...CV_TEMPLATES[0]!, userId: admin.id },
    ...demoOwners.map((user, i) => ({
      ...CV_TEMPLATES[(i + 1) % CV_TEMPLATES.length]!,
      userId: user.id,
    })),
  ];

  const existing = await prisma.cv.findMany({
    where: { userId: { in: [...new Set(cvs.map((cv) => cv.userId))] } },
    select: { userId: true, name: true },
  });
  const existingKeys = new Set(existing.map((cv) => `${cv.userId}:${cv.name}`));

  await prisma.cv.createMany({
    data: cvs.filter((cv) => !existingKeys.has(`${cv.userId}:${cv.name}`)),
  });
}

async function main(): Promise<void> {
  await seedCatalogs();
  await seedProjects();
  await seedUsers();
  await seedDemoUsers();
  await seedCvs();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
