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
| Backend tests | Jest + @nestjs/testing                        |
| Code quality  | ESLint 9 (flat config), Prettier              |

Planned (to be added): GraphQL (Apollo), PostgreSQL + Prisma, MUI, react-hook-form + zod, next-intl,
Vitest + React Testing Library, Supertest, Docker (docker-compose for DB and Mailpit).

## 📚 Documentation & Project Structure

This repository is a monorepo containing the frontend and backend applications:

- 🎨 **Frontend** (`frontend/`): Next.js App Router app, see [frontend/README.md](frontend/README.md).
- ⚙️ **Backend** (`backend/`): NestJS API, see [backend/README.md](backend/README.md).

```
cv-builder/
├── package.json          # root scripts that run both apps
├── pnpm-workspace.yaml
├── tsconfig.base.json    # shared TypeScript options, extended by both apps
├── eslint.config.mjs     # shared ESLint flat config
├── .prettierrc           # shared Prettier config
├── backend/              # NestJS API
│   └── src/
└── frontend/             # Next.js app
    └── src/app/
```

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 12.5.1 (pinned via `packageManager`; `npm i -g pnpm@12.5.1` or Corepack)

## Getting started

```bash
pnpm install
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
