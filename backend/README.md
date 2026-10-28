# Backend

NestJS 11, TypeScript, Prisma 7 (PostgreSQL). Tests: Jest + @nestjs/testing.

## Scripts

Run from the repo root (`pnpm <script>`) or from this folder.

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Start in watch mode (port 4000)                |
| `pnpm build`       | Build to `dist/`                               |
| `pnpm start`       | Run the built app (`dist/main`)                |
| `pnpm test`        | Run Jest tests                                 |
| `pnpm test:cov`    | Run Jest tests with coverage (fails under 80%) |
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
    graphql/          # list args, pagination, SortOrder, Date scalar, GraphQL enums
    errors/           # error codes, helpers, validation errors, global exception filter
    auth/             # @Roles() decorator
  generated/prisma/   # generated Prisma Client (git-ignored)
```
