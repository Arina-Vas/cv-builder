# CV Builder

Fullstack CV Builder app (Innowise JS Trainee, Task 8 "Frontend Team Practice").
Users manage their profile, skills, languages and CVs (details, skills, projects, preview + PDF export);
admins also manage users and global catalogs (skills, languages, departments, positions, projects).

> Status: initial project skeleton. No features implemented yet.

## Tech stack

| Layer         | Tech                                          |
| ------------- | --------------------------------------------- |
| Monorepo      | pnpm workspaces (`frontend`, `backend`)       |
| Frontend      | Next.js 16 (App Router), React 19, TypeScript |
| Backend       | NestJS 11, TypeScript                         |
| Database      | PostgreSQL 17 (Docker), Prisma ORM 7          |
| Backend tests | Jest + @nestjs/testing                        |
| Code quality  | ESLint 9 (flat config), Prettier              |

Planned (to be added): GraphQL (Apollo), MUI, react-hook-form + zod, next-intl,
Vitest + React Testing Library, Supertest, Mailpit (docker-compose).

## 📚 Documentation & Project Structure

This repository is a monorepo containing the frontend and backend applications:

- 🎨 **Frontend** (`frontend/`): Next.js App Router app, see [frontend/README.md](frontend/README.md).
- ⚙️ **Backend** (`backend/`): NestJS API, see [backend/README.md](backend/README.md).

```
cv-builder/
├── package.json          # root scripts that run both apps
├── pnpm-workspace.yaml
├── docker-compose.yml    # local PostgreSQL
├── tsconfig.base.json    # shared TypeScript options, extended by both apps
├── eslint.config.mjs     # shared ESLint flat config
├── .prettierrc           # shared Prettier config
├── backend/              # NestJS API
│   ├── prisma/           # schema.prisma + migrations/
│   ├── prisma.config.ts  # Prisma CLI config (schema path, DATABASE_URL)
│   └── src/
└── frontend/             # Next.js app
    └── src/app/
```

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 12.5.1 (pinned via `packageManager`; `npm i -g pnpm@12.5.1` or Corepack)
- Docker Desktop (for the local database)

## Getting started

```bash
pnpm install                              # also generates the Prisma Client
cp backend/.env.example backend/.env
pnpm db:up                                # start PostgreSQL and wait until it is healthy
pnpm db:deploy                            # apply all migrations
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000 (health check: `GET /health`)

## Scripts (run from the repo root)

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start frontend and backend in parallel  |
| `pnpm dev:frontend` | Start only the frontend                 |
| `pnpm dev:backend`  | Start only the backend                  |
| `pnpm build`        | Build both apps                         |
| `pnpm lint`         | Lint the whole repo with ESLint         |
| `pnpm lint:fix`     | Lint and auto-fix (e.g. unused imports) |
| `pnpm typecheck`    | Run `tsc --noEmit` in all packages      |
| `pnpm format`       | Format the repo with Prettier           |
| `pnpm format:check` | Check formatting without writing        |
| `pnpm test`         | Run tests in all packages               |
| `pnpm db:up`        | Start PostgreSQL in Docker              |
| `pnpm db:down`      | Stop PostgreSQL (data is kept)          |
| `pnpm db:migrate`   | Create and apply a migration (dev)      |
| `pnpm db:deploy`    | Apply pending migrations                |
| `pnpm db:status`    | Show which migrations are applied       |
| `pnpm db:reset`     | Drop the DB and re-apply all migrations |
| `pnpm db:generate`  | Regenerate the Prisma Client            |
| `pnpm db:studio`    | Open Prisma Studio (DB browser)         |

## Database

PostgreSQL runs in Docker (`docker-compose.yml`); the backend talks to it through Prisma.
The database itself is never shared between developers. Everyone gets the same database from git:

- `docker-compose.yml`: the same PostgreSQL version and settings;
- `backend/prisma/migrations/`: the same schema;
- seed script (added together with the first models): the same initial data.

### After `git pull`

```bash
pnpm install      # new dependencies + regenerated Prisma Client
pnpm db:up
pnpm db:deploy    # apply migrations added by teammates
```

### Changing the schema

1. Edit `backend/prisma/schema.prisma`.
2. Run `pnpm db:migrate --name <short-description>`, e.g. `--name add-user`.
   It creates `backend/prisma/migrations/<timestamp>_<name>/migration.sql`, applies it and regenerates the client.
3. Read the generated SQL and commit the migration together with the code that uses it.

Rules:

- The schema changes only through migrations. Do not use `prisma db push`.
- Never edit a migration that is already merged. Add a new one instead.
- If two branches both add migrations, the second one to merge runs `pnpm db:migrate` again after rebasing.
- Start from scratch: `pnpm db:reset`. To also remove the Docker volume: `docker compose down -v`.

### Model conventions

- IDs: `String @id @default(uuid()) @db.Uuid`.
- Fields are camelCase in Prisma and snake_case in the DB: `@map("created_at")`, table names via `@@map("users")`.
- Every table has `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`).
- Uniqueness rules from the spec are enforced with `@unique` / `@@unique` in the DB, not only in services.

## Environment variables

Backend variables live in `backend/.env` (git-ignored). The template is `backend/.env.example`.

| Variable       | Description                  | Default (local)                                                              |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `PORT`         | Port the API listens on      | `4000`                                                                       |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://cv_builder:cv_builder@localhost:5432/cv_builder?schema=public` |

The database credentials in `docker-compose.yml` are for local development only.

## Architectural decisions

- **ORM: Prisma 7** with the `@prisma/adapter-pg` driver adapter. Chosen for schema-first models and migrations
  that are simple to share in a small team.
- **Database: PostgreSQL 17** in Docker for local development.
- **Prisma Client** is generated into `backend/src/generated/prisma` (git-ignored, CommonJS output for NestJS)
  on `pnpm install`.
- Prisma 7 does not read `.env` by itself: `prisma.config.ts` loads `backend/.env` with `process.loadEnvFile()`.
