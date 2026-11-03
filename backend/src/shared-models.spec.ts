import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { HealthResolver } from '@/health/health.resolver';
import { Department } from '@/departments/models/department.model';
import { Language } from '@/languages/models/language.model';
import { Position } from '@/positions/models/position.model';
import { Project } from '@/projects/models/project.model';
import { ProjectRole } from '@/projects/models/project-role.model';
import { Skill } from '@/skills/models/skill.model';
import { SkillCategory } from '@/skills/models/skill-category.model';
import { User } from '@/users/models/user.model';

// Kept apart from schema.spec.ts: every imported @ObjectType ends up in a built schema
const MODELS = [Department, Language, Position, Project, ProjectRole, Skill, SkillCategory, User];

describe('shared GraphQL models', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('build into valid GraphQL types, including the ones no operation returns yet', async () => {
    const schema = await app
      .get(GraphQLSchemaFactory)
      .create([HealthResolver], [], { orphanedTypes: MODELS });

    expect(Object.keys(schema.getTypeMap())).toEqual(
      expect.arrayContaining(MODELS.map((model) => model.name)),
    );
  });
});
