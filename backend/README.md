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

- `GET /health` — health check.

The port is taken from the `PORT` environment variable (default `4000`).

## Structure

```
prisma/
  schema/             # data models, one file per domain (schema.prisma: generator + datasource)
  migrations/         # SQL migrations (committed)
prisma.config.ts      # Prisma CLI config
src/                  # main.ts, app.module.ts, app.controller.ts
  generated/prisma/   # generated Prisma Client (git-ignored)
```
