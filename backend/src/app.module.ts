import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HealthModule } from './health/health.module';
import { Environment, EnvironmentVariables, validate } from './config/env.validation';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>) => {
        const isProduction =
          configService.get('NODE_ENV', { infer: true }) === Environment.Production;

        return {
          autoSchemaFile: join(process.cwd(), 'schema.gql'),
          sortSchema: true,
          introspection: !isProduction,
          includeStacktraceInErrorResponses: !isProduction,
        };
      },
    }),
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
