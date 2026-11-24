import { Mastery, Proficiency, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const PREVIEW = `query ($id: ID!) {
  cvPreview(id: $id) {
    id name education description
    user { id firstName lastName position { name } }
    languages { proficiency language { name } }
    domains
    skillGroups { category { name } skills { skill { name } experienceYears lastUsedYear } }
    projects { startDate endDate responsibilities roles { name } project { name domain technologies { name } } }
  }
}`;

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlPreview {
  id: string;
  name: string;
  education: string;
  description: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    position: { name: string } | null;
  };
  languages: { proficiency: Proficiency; language: { name: string } }[];
  domains: string[];
  skillGroups: {
    category: { name: string };
    skills: {
      skill: { name: string };
      experienceYears: number | null;
      lastUsedYear: number | null;
    }[];
  }[];
  projects: {
    startDate: string;
    endDate: string | null;
    responsibilities: string | null;
    roles: { name: string }[];
    project: { name: string; domain: string; technologies: { name: string }[] };
  }[];
}

/** YYYY-MM-DD of today minus the given years and months, so the expected years do not depend on the run date */
const ago = (years: number, months = 0): string => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCFullYear(date.getUTCFullYear() - years, date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
};

const CURRENT_YEAR = new Date().getUTCFullYear();

describe('CV preview (integration)', () => {
  let t: TestApp;
  const skills: Record<string, string> = {};
  let developer: string;

  /** Id of a skill created in beforeEach */
  const skillId = (name: string): string => {
    const id = skills[name];
    if (!id) throw new Error(`Unknown test skill: ${name}`);
    return id;
  };
  const client = () => new GqlClient(t.server);

  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const insertCv = async (userId: string) =>
    (
      await t.prisma.cv.create({
        data: { name: 'Frontend CV', education: 'BSUIR', description: 'React developer', userId },
        select: { id: true },
      })
    ).id;

  /** Gives the owner the skills and adds them to the CV, straight in the database */
  const addSkills = async (userId: string, cvId: string, names: string[]) => {
    for (const name of names) {
      const id = skillId(name);
      await t.prisma.userSkill.create({
        data: { userId, skillId: id, mastery: Mastery.ADVANCED },
      });
      await t.prisma.cvSkill.create({ data: { cvId, skillId: id, mastery: Mastery.ADVANCED } });
    }
  };

  /** A catalog project with the given technologies, added to the CV with its own dates */
  const addProject = async (
    cvId: string,
    {
      name,
      domain,
      technologies,
      startDate,
      endDate,
    }: {
      name: string;
      domain: string;
      technologies: string[];
      startDate: string;
      endDate: string | null;
    },
  ) => {
    const project = await t.prisma.project.create({
      data: {
        name,
        domain,
        description: `${name} description`,
        startDate: new Date('2000-01-01'),
        endDate: new Date('2100-01-01'),
        technologies: { create: technologies.map((skill) => ({ skillId: skillId(skill) })) },
      },
    });
    await t.prisma.cvProject.create({
      data: {
        cvId,
        projectId: project.id,
        startDate: new Date(startDate),
        endDate: endDate === null ? null : new Date(endDate),
        responsibilities: 'Built the UI',
        roles: { create: [{ roleId: developer }] },
      },
    });
  };

  const preview = (browser: GqlClient, id: string) =>
    browser.data<{ cvPreview: GqlPreview }>(PREVIEW, { id }).then((data) => data.cvPreview);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    const frontend = await t.prisma.skillCategory.create({
      data: { name: 'Frontend', type: 'Frontend' },
    });
    const languages = await t.prisma.skillCategory.create({
      data: { name: 'Programming Languages', type: 'Languages' },
    });
    await t.prisma.skillCategory.create({ data: { name: 'Databases', type: 'Databases' } });
    for (const [name, categoryId] of [
      ['React', frontend.id],
      ['Angular', frontend.id],
      ['JavaScript', languages.id],
      ['TypeScript', languages.id],
    ] as const) {
      skills[name] = (await t.prisma.skill.create({ data: { name, categoryId } })).id;
    }
    ({ id: developer } = await t.prisma.projectRole.create({ data: { name: 'Developer' } }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('access', () => {
    it('requires authentication', async () => {
      const error = await client().error(PREVIEW, { id: MISSING_ID });

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it("rejects an Employee on another user's CV with FORBIDDEN", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);
      const cvId = await insertCv(other.id);

      const error = await browser.error(PREVIEW, { id: cvId });

      expect(error.extensions.code).toBe('FORBIDDEN');
    });

    it('fails with NOT_FOUND for a missing CV', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(PREVIEW, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });

    it('rejects an id that is not a UUID', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(PREVIEW, { id: 'not-a-uuid' });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
    });

    it('lets an Employee open the own CV', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      expect(await preview(browser, cvId)).toMatchObject({ id: cvId, user: { id: user.id } });
    });

    it("lets an Admin open another user's CV", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const cvId = await insertCv(owner.id);

      expect(await preview(browser, cvId)).toMatchObject({ id: cvId, user: { id: owner.id } });
    });
  });

  describe('data', () => {
    it('returns empty sections for a CV without skills, projects and owner languages', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      expect(await preview(browser, cvId)).toMatchObject({
        name: 'Frontend CV',
        education: 'BSUIR',
        description: 'React developer',
        languages: [],
        domains: [],
        skillGroups: [],
        projects: [],
      });
    });

    it("shows the owner's languages sorted by name", async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      for (const [name, iso, proficiency] of [
        ['Ukrainian', 'UK', Proficiency.NATIVE],
        ['English', 'EN', Proficiency.C1],
      ] as const) {
        const language = await t.prisma.language.create({ data: { name, iso, nativeName: name } });
        await t.prisma.userLanguage.create({
          data: { userId: user.id, languageId: language.id, proficiency },
        });
      }

      expect((await preview(browser, cvId)).languages).toEqual([
        { proficiency: Proficiency.C1, language: { name: 'English' } },
        { proficiency: Proficiency.NATIVE, language: { name: 'Ukrainian' } },
      ]);
    });

    it('groups CV skills by category and counts experience from the CV projects', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await addSkills(user.id, cvId, ['React', 'Angular', 'JavaScript', 'TypeScript']);
      const finished = ago(1, 2);
      await addProject(cvId, {
        name: 'Shop A',
        domain: 'E-commerce',
        technologies: ['React', 'JavaScript'],
        startDate: ago(4, 1),
        endDate: finished,
      });
      await addProject(cvId, {
        name: 'Shop B',
        domain: 'E-commerce',
        technologies: ['TypeScript', 'React'],
        startDate: ago(3, 1),
        endDate: null,
      });

      const result = await preview(browser, cvId);

      expect(result.domains).toEqual(['E-commerce']);
      expect(result.skillGroups).toEqual([
        {
          category: { name: 'Frontend' },
          skills: [
            { skill: { name: 'Angular' }, experienceYears: null, lastUsedYear: null },
            { skill: { name: 'React' }, experienceYears: 4, lastUsedYear: CURRENT_YEAR },
          ],
        },
        {
          category: { name: 'Programming Languages' },
          skills: [
            {
              skill: { name: 'JavaScript' },
              experienceYears: 4,
              lastUsedYear: Number(finished.slice(0, 4)),
            },
            { skill: { name: 'TypeScript' }, experienceYears: 3, lastUsedYear: CURRENT_YEAR },
          ],
        },
      ]);
    });

    it('lists the CV projects with the latest start first, with their CV data', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await addSkills(user.id, cvId, ['React']);
      await addProject(cvId, {
        name: 'Old',
        domain: 'Healthcare',
        technologies: ['React'],
        startDate: '2020-01-01',
        endDate: '2021-06-30',
      });
      await addProject(cvId, {
        name: 'New',
        domain: 'FinTech',
        technologies: [],
        startDate: '2024-03-01',
        endDate: null,
      });

      const result = await preview(browser, cvId);

      expect(result.domains).toEqual(['FinTech', 'Healthcare']);
      expect(result.projects).toEqual([
        {
          startDate: '2024-03-01',
          endDate: null,
          responsibilities: 'Built the UI',
          roles: [{ name: 'Developer' }],
          project: { name: 'New', domain: 'FinTech', technologies: [] },
        },
        {
          startDate: '2020-01-01',
          endDate: '2021-06-30',
          responsibilities: 'Built the UI',
          roles: [{ name: 'Developer' }],
          project: { name: 'Old', domain: 'Healthcare', technologies: [{ name: 'React' }] },
        },
      ]);
    });

    it('leaves out CV skills the owner no longer has, as the CV Skills tab does', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await addSkills(user.id, cvId, ['React']);
      await t.prisma.cvSkill.create({
        data: { cvId, skillId: skillId('Angular'), mastery: Mastery.ADVANCED },
      });

      const { skillGroups } = await preview(browser, cvId);

      expect(skillGroups.flatMap((group) => group.skills.map((s) => s.skill.name))).toEqual([
        'React',
      ]);
    });
  });
});
