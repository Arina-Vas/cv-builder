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
    environment: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    name: 'MediTrack',
    domain: 'Healthcare',
    startDate: '2023-06-01',
    endDate: '2026-06-30',
    description: 'Patient appointment and medical records system for a network of private clinics.',
    environment: ['TypeScript', 'Angular', 'NestJS', 'GraphQL', 'PostgreSQL', 'Docker'],
  },
  {
    name: 'FinSight',
    domain: 'Finance',
    startDate: '2024-01-15',
    endDate: '2027-01-15',
    description: 'Dashboard for personal budgeting with bank account sync and spending analytics.',
    environment: ['JavaScript', 'React', 'Express', 'MongoDB', 'AWS'],
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

  for (const { environment, startDate, endDate, ...project } of PROJECTS) {
    // Project name is not unique, so look it up instead of upsert.
    const existing = await prisma.project.findFirst({ where: { name: project.name } });
    const { id } =
      existing ??
      (await prisma.project.create({
        data: { ...project, startDate: new Date(startDate), endDate: new Date(endDate) },
      }));

    await prisma.projectSkill.createMany({
      data: environment.map((skill) => ({ projectId: id, skillId: skillIdByName.get(skill)! })),
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

async function main(): Promise<void> {
  await seedCatalogs();
  await seedProjects();
  await seedUsers();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
