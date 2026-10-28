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
| API           | GraphQL, code-first (NestJS + Apollo Server)  |
| Database      | PostgreSQL 17 (Docker), Prisma ORM 7          |
| Backend tests | Jest + @nestjs/testing                        |
| Code quality  | ESLint 9 (flat config), Prettier              |

Planned (to be added): GraphQL Code Generator, MUI, react-hook-form + zod, next-intl,
Vitest + React Testing Library, Supertest.

## 📚 Documentation & Project Structure

This repository is a monorepo containing the frontend and backend applications:

- 🎨 **Frontend** (`frontend/`): Next.js App Router app, see [frontend/README.md](frontend/README.md).
- ⚙️ **Backend** (`backend/`): NestJS API, see [backend/README.md](backend/README.md).
- 🗄️ **Data model** (`docs/`): entities, relations, deletion policy and constraints, see [docs/data-model.md](docs/data-model.md).
- 🔌 **API** (`docs/api/`): GraphQL conventions (lists, errors, scalars) and access rules, see
  [docs/api/conventions.md](docs/api/conventions.md) and [docs/api/permissions.md](docs/api/permissions.md).
  The generated schema is [backend/schema.gql](backend/schema.gql).
- 🔐 **Authentication** (`docs/`): tokens, sessions, email verification and password reset, see [docs/auth.md](docs/auth.md).

```
cv-builder/
├── package.json          # root scripts that run both apps
├── pnpm-workspace.yaml
├── docker-compose.yml    # local PostgreSQL + Mailpit
├── tsconfig.base.json    # shared TypeScript options, extended by both apps
├── eslint.config.mjs     # shared ESLint flat config
├── .prettierrc           # shared Prettier config
├── docs/                 # project documentation
│   ├── data-model.md     # database schema
│   ├── auth.md           # authentication decisions
│   └── api/              # GraphQL conventions and permissions
├── backend/              # NestJS API
│   ├── prisma/           # schema/ (one .prisma file per domain) + migrations/
│   ├── prisma.config.ts  # Prisma CLI config (schema path, DATABASE_URL)
│   ├── schema.gql        # generated GraphQL schema (committed)
│   └── src/
└── frontend/             # Next.js app
    └── src/app/
```

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 12.5.1 (pinned via `packageManager`; `npm i -g pnpm@12.5.1` or Corepack)
- Docker Desktop (for the local database and mail catcher)

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
- Mailpit (emails sent in development): http://localhost:8025

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
| `pnpm db:up`        | Start PostgreSQL and Mailpit in Docker  |
| `pnpm db:down`      | Stop Docker services (data is kept)     |
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
- `backend/prisma/seed.ts`: the same initial data.

### After `git pull`

```bash
pnpm install      # new dependencies + regenerated Prisma Client
pnpm db:up
pnpm db:deploy    # apply migrations added by teammates
pnpm db:seed      # fill the database with shared dev data
```

### Seed data

`pnpm db:seed` fills the catalogs (departments, positions, skill categories and skills, languages, project roles,
sample projects) and creates two accounts with a verified email. Their emails and passwords come from the
`SEED_*` variables in `backend/.env` (defaults in [`backend/.env.example`](backend/.env.example)):

| Role     | Email                       | Password      |
| -------- | --------------------------- | ------------- |
| Admin    | `admin@cv-builder.local`    | `admin123`    |
| Employee | `employee@cv-builder.local` | `employee123` |

The seed is idempotent: it only adds missing rows and never changes existing ones, so it is safe to run again.
These accounts are for local development only.

### Changing the schema

1. Edit the models in `backend/prisma/schema/` (one file per domain; generator and datasource live in `schema.prisma`).
2. Run `pnpm db:migrate --name <short-description>`, e.g. `--name add-user`.
   It creates `backend/prisma/migrations/<timestamp>_<name>/migration.sql`, applies it and regenerates the client.
3. Read the generated SQL and commit the migration together with the code that uses it.
4. If you add a model, a relation or a constraint, update [docs/data-model.md](docs/data-model.md) in the same PR.

Some rules cannot be expressed in Prisma (the `citext` extension, `CHECK` constraints). Create such a migration with
`pnpm db:migrate --name <name> --create-only`, add the SQL by hand, then run `pnpm db:migrate` to apply it.

Rules:

- The schema changes only through migrations. Do not use `prisma db push`.
- Never edit a migration that is already merged. Add a new one instead.
- If two branches both add migrations, the second one to merge runs `pnpm db:migrate` again after rebasing.
- Start from scratch: `pnpm db:reset`, then `pnpm db:seed` (Prisma 7 does not run the seed on reset).
  To also remove the Docker volume: `docker compose down -v`.

### Model conventions

- IDs: `String @id @default(uuid()) @db.Uuid`.
- Fields are camelCase in Prisma and snake_case in the DB: `@map("created_at")`, table names via `@@map("users")`.
- Every table has `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`).
- Uniqueness rules from the spec are enforced with `@unique` / `@@unique` in the DB, not only in services.
  Case-insensitive values (emails, catalog names) use `@db.Citext`.
- Length limits from the spec are enforced with `@db.VarChar(n)` and repeated in the input DTOs.
- Every relation sets `onDelete` explicitly: catalog items use `Restrict` (cannot be deleted while referenced),
  owner → link relations use `Cascade`. See [Deletion policy](docs/data-model.md#deletion-policy).
- One schema file per domain; a join table lives in the file of the module that writes it.

## Environment variables

Backend variables live in `backend/.env` (git-ignored). The template is `backend/.env.example`.

| Variable                 | Description                                         | Default (local)                                                              |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`               | `development`, `production` or `test`               | `development`                                                                |
| `PORT`                   | Port the API listens on                             | `4000`                                                                       |
| `DATABASE_URL`           | PostgreSQL connection string                        | `postgresql://cv_builder:cv_builder@localhost:5432/cv_builder?schema=public` |
| `FRONTEND_URL`           | Frontend origin for CORS and links in emails        | `http://localhost:3000`                                                      |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens, at least 32 chars | none, generate with `openssl rand -base64 32`                                |
| `JWT_ACCESS_TTL_SECONDS` | Access token lifetime in seconds                    | `1800`                                                                       |
| `REFRESH_TTL_DAYS`       | Refresh token lifetime in days                      | `1`                                                                          |
| `SMTP_HOST`              | Mail server host                                    | `localhost` (Mailpit)                                                        |
| `SMTP_PORT`              | Mail server port                                    | `1025` (Mailpit)                                                             |
| `MAIL_FROM`              | Sender of outgoing emails                           | `CV Builder <no-reply@cv-builder.local>`                                     |
| `TRUST_PROXY_HOPS`       | Number of reverse proxies in front of the API       | `0`                                                                          |
| `SEED_*`                 | Accounts created by `pnpm db:seed`                  | see [Seed data](#seed-data)                                                  |

The backend validates these variables on startup (`backend/src/config/env.validation.ts`) and does not start if
one is missing or invalid. `SEED_*` are read only by the seed script.

The database credentials in `docker-compose.yml` are for local development only.

## Architectural decisions

- **ORM: Prisma 7** with the `@prisma/adapter-pg` driver adapter. Chosen for schema-first models and migrations
  that are simple to share in a small team.
- **Database: PostgreSQL 17** in Docker for local development.
- **Prisma Client** is generated into `backend/src/generated/prisma` (git-ignored, CommonJS output for NestJS)
  on `pnpm install`.
- Prisma 7 does not read `.env` by itself: `prisma.config.ts` loads `backend/.env` with `process.loadEnvFile()`.

### Authentication

- Access and refresh tokens in httpOnly cookies; access JWT for 30 minutes, refresh token for 1 day with rotation.
- Sign up starts a session; email verification uses it. Unverified users are read-only.
- Details and reasons: [docs/auth.md](docs/auth.md).
