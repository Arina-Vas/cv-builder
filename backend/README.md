# Backend

NestJS 11, TypeScript, Prisma 7 (PostgreSQL). Tests: Jest + @nestjs/testing, Supertest.

## Scripts

Run from the repo root (`pnpm <script>`) or from this folder.

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Start in watch mode (port 4000)                |
| `pnpm build`       | Build to `dist/`                               |
| `pnpm start`       | Run the built app (`dist/main`)                |
| `pnpm test`        | Run Jest tests                                 |
| `pnpm test:cov`    | Run Jest tests with coverage (fails under 80%) |
| `pnpm test:int`    | Run integration tests (needs Docker Postgres)  |
| `pnpm typecheck`   | Type-check with `tsc --noEmit`                 |
| `pnpm db:migrate`  | Create and apply a migration (`--name <name>`) |
| `pnpm db:deploy`   | Apply pending migrations                       |
| `pnpm db:status`   | Show migration status                          |
| `pnpm db:reset`    | Drop the DB and re-apply all migrations        |
| `pnpm db:generate` | Regenerate the Prisma Client                   |
| `pnpm db:studio`   | Open Prisma Studio                             |

Linting and formatting are configured at the repo root (`pnpm lint`, `pnpm format`).

## Tests and coverage

- Unit tests sit next to the code as `*.spec.ts`.
- `pnpm test:cov` writes the report to `backend/coverage/` (`lcov-report/index.html`) and fails when statements,
  branches, functions or lines drop below **80%** (`coverageThreshold` in `package.json`).
- Coverage counts every source file, not only the ones a test imports. Excluded: generated Prisma Client,
  `main.ts` and `*.module.ts` (wiring only; the app boot is checked by integration tests).
- `src/schema.spec.ts` builds the schema from the resolvers and compares it with the committed `schema.gql`.
  When it fails, start the backend to regenerate the file and commit it. Add a new resolver to its `RESOLVERS`
  list. `src/shared-models.spec.ts` checks that every shared `@ObjectType` builds, even before an operation uses it.

### Integration tests

`pnpm test:int` starts the whole `AppModule` and sends real GraphQL requests with Supertest to a real PostgreSQL
database. Requirements: `docker compose up -d`. Nothing else: the tests set their own environment
(`test/test-env.ts`) and do not read `backend/.env`.

- Database: `cv_builder_test` in the same Postgres container. Before the run, `test/global-setup.ts` creates it if
  needed and applies the migrations (`prisma migrate deploy`). Override it with `TEST_DATABASE_URL`.
- Every test starts with empty tables (`TRUNCATE`). The setup refuses to run against a database whose name does not
  end with `_test`, so `cv_builder` is never touched.
- Emails go to `FakeMailService` (`test/utils/test-app.ts`), which keeps them in memory, so a test reads the
  verification code or the reset link from the "sent" email.
- `GqlClient` (`test/utils/graphql-client.ts`) acts as one browser: it keeps the httpOnly cookies between requests
  and sends its own client IP in `X-Forwarded-For`, so rate limits of one test do not affect another.
- Test-only operations (`adminProbe` with `@Roles(ADMIN)`, `verifiedProbe` without `@AllowUnverified`) check the
  guards until real admin operations exist. With `NODE_ENV=test` the schema is built in memory, so they never reach
  `schema.gql`.
- `@nestjs/config` and `@nestjs/jwt` are ESM-only. `test/jest-int.json` compiles them to CommonJS for Jest, so the
  integration tests use the real modules; unit tests mock them instead.
- Files: `test/*.int-spec.ts`; they run in one process (`--runInBand`) because they share the database.

## Database

Setup, migration workflow and model conventions: see [Database](../README.md#database) in the root README.
Entities, relations, deletion policy and constraints: see [docs/data-model.md](../docs/data-model.md).

The environment is read from `backend/.env` (copy `backend/.env.example`).

## API

- `POST /graphql` — GraphQL API; Apollo Sandbox opens at the same URL in a browser (outside production).
- `GET /health` — health check.

The port is taken from the `PORT` environment variable (default `4000`).

The schema is code-first: NestJS generates [schema.gql](schema.gql) from the decorators on start; commit it together
with the code. Conventions and access rules: [docs/api/conventions.md](../docs/api/conventions.md),
[docs/api/permissions.md](../docs/api/permissions.md).

## Structure

```
prisma/
  schema/             # data models, one file per domain (schema.prisma: generator + datasource)
  migrations/         # SQL migrations (committed)
prisma.config.ts      # Prisma CLI config
schema.gql            # generated GraphQL schema (committed)
src/                  # main.ts, app.module.ts, app.controller.ts
  common/
    graphql/          # list args and responses, SortOrder, Date scalar, GraphQL enums, constants
    errors/           # error codes, helpers, validation errors, global exception filter
    validation/       # input transforms (@NormalizeText(), …), @IsNotBeforeDate()
    auth/             # @Roles() decorator
  prisma/             # PrismaService (global module), isPrismaError()
  departments/        # feature module, see Module layout
  positions/          # feature module, same layout
  languages/          # feature module, same layout
  skills/             # feature module, same layout; also the skillCategories lookup
  projects/           # feature module, same layout; also the technologies lookup
  generated/prisma/   # generated Prisma Client (git-ignored)
```

### Module layout

A feature module is one folder; Departments is the reference implementation:

```
departments/
  department.module.ts       # registers the resolver and the service; imported in AppModule
  department.resolver.ts     # queries and mutations; @Roles() on admin operations; no logic
  department.service.ts      # Prisma calls, search / sort / pagination, Prisma error handling
  department.mapper.ts       # Prisma row → output type
  dto/                       # @ArgsType list args and @InputType inputs with class-validator rules
  models/                    # @ObjectType output types, <Entity>Page, <Entity>SortField enum
```

Rules for each part are in [docs/api/conventions.md](../docs/api/conventions.md).

## Tests

`*.spec.ts` next to the tested file (`pnpm test`). DTO tests run `plainToInstance` + `validate`, as the global
`ValidationPipe` does. Service tests pass a mocked `PrismaService` to the constructor and replace the real module
with `jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }))`: it imports `@nestjs/config`, which
Jest cannot load as ESM.
