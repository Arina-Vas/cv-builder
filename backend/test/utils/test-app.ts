import { Injectable, Module } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';

export interface SentMail {
  to: string;
  kind: 'verification' | 'password-reset';
  /** Verification code or reset link */
  secret: string;
}

/** Replaces SMTP: keeps every email in memory so a test can read the code or link from it. */
@Injectable()
export class FakeMailService {
  readonly sent: SentMail[] = [];

  sendVerificationCode(to: string, code: string): Promise<void> {
    this.sent.push({ to, kind: 'verification', secret: code });
    return Promise.resolve();
  }

  sendPasswordReset(to: string, link: string): Promise<void> {
    this.sent.push({ to, kind: 'password-reset', secret: link });
    return Promise.resolve();
  }

  last(to: string, kind: SentMail['kind']): string {
    const mail = this.sent.filter((item) => item.to === to && item.kind === kind).at(-1);
    if (!mail) {
      throw new Error(`no ${kind} email sent to ${to}`);
    }
    return mail.secret;
  }
}

/**
 * Operations that exist only in the tests: the auth branch has no admin-only or plain signed-in
 * mutation yet, but the guards must be checked against them.
 */
@Resolver()
class ProbeResolver {
  @Roles(UserRole.ADMIN)
  @Query(() => Boolean)
  adminProbe(): boolean {
    return true;
  }

  @Mutation(() => Boolean)
  verifiedProbe(): boolean {
    return true;
  }
}

@Module({ providers: [ProbeResolver] })
class ProbeModule {}

export interface TestApp {
  app: NestExpressApplication;
  server: App;
  prisma: PrismaService;
  mail: FakeMailService;
}

export const createTestApp = async (): Promise<TestApp> => {
  const mail = new FakeMailService();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule, ProbeModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();

  return { app, server: app.getHttpServer() as App, prisma: app.get(PrismaService), mail };
};

/** Empties every application table; migrations history stays. */
export const resetDatabase = async (prisma: PrismaService): Promise<void> => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
};
