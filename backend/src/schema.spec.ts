import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { buildSchema, type GraphQLSchema, lexicographicSortSchema, printSchema } from 'graphql';
import { AuthResolver } from '@/auth/auth.resolver';
import { EmailVerificationResolver } from '@/auth/email-verification/email-verification.resolver';
import { PasswordResetResolver } from '@/auth/password-reset/password-reset.resolver';
import { DepartmentResolver } from '@/departments/department.resolver';
import { HealthResolver } from '@/health/health.resolver';
import { LanguageResolver } from '@/languages/language.resolver';
import { PositionResolver } from '@/positions/position.resolver';
import { ProjectResolver } from '@/projects/project.resolver';
import { SkillResolver } from '@/skills/skill.resolver';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

// Every resolver registered in AppModule. A resolver missing here makes the schemas differ.
const RESOLVERS = [
  AuthResolver,
  EmailVerificationResolver,
  PasswordResetResolver,
  HealthResolver,
  DepartmentResolver,
  PositionResolver,
  LanguageResolver,
  SkillResolver,
  ProjectResolver,
];

const print = (schema: GraphQLSchema): string => printSchema(lexicographicSortSchema(schema));

describe('GraphQL schema', () => {
  let app: INestApplication;
  let factory: GraphQLSchemaFactory;

  beforeAll(async () => {
    app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: false });
    await app.init();
    factory = app.get(GraphQLSchemaFactory);
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches the committed schema.gql (run the backend to regenerate it)', async () => {
    const built = await factory.create(RESOLVERS);
    const committed = buildSchema(readFileSync(join(__dirname, '..', 'schema.gql'), 'utf8'));

    expect(print(built)).toBe(print(committed));
  });
});
