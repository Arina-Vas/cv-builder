import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HealthModule } from './health/health.module';
import { Environment, EnvironmentVariables, validate } from './config/env.validation';
import { join } from 'node:path';
import { createGqlContext } from './common/graphql/graphql.context';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentModule } from '@/departments/department.module';
import { PositionModule } from '@/positions/position.module';
import { LanguageModule } from '@/languages/language.module';
import { SkillModule } from '@/skills/skill.module';
import { ProjectModule } from '@/projects/project.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>) => {
        const nodeEnv = configService.get('NODE_ENV', { infer: true });
        const isProduction = nodeEnv === Environment.Production;

        return {
          autoSchemaFile: nodeEnv === Environment.Test ? true : join(process.cwd(), 'schema.gql'),
          sortSchema: true,
          introspection: !isProduction,
          includeStacktraceInErrorResponses: !isProduction,
          context: createGqlContext,
        };
      },
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    DepartmentModule,
    PositionModule,
    LanguageModule,
    SkillModule,
    ProjectModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
