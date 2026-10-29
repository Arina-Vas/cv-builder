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
| `pnpm typecheck`   | Type-check with `tsc --noEmit`                 |
| `pnpm db:migrate`  | Create and apply a migration (`--name <name>`) |
| `pnpm db:deploy`   | Apply pending migrations                       |
| `pnpm db:status`   | Show migration status                          |
| `pnpm db:reset`    | Drop the DB and re-apply all migrations        |
| `pnpm db:generate` | Regenerate the Prisma Client                   |
| `pnpm db:studio`   | Open Prisma Studio                             |

Linting and formatting are configured at the repo root (`pnpm lint`, `pnpm format`).

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
