# CV Builder

Fullstack CV Builder app (Innowise JS Trainee, Task 8 "Frontend Team Practice").
Users manage their profile, skills, languages and CVs (details, skills, projects, preview + PDF export);
admins also manage users and global catalogs (skills, languages, departments, positions, projects).

> Status: initial project skeleton. No features implemented yet.

## Tech stack

| Layer           | Tech                                         |
| --------------- | -------------------------------------------- |
| Monorepo        | pnpm workspaces (`frontend`, `backend`)      |
| Frontend        | Next.js 15 (App Router), React 19, TypeScript |
| Backend         | NestJS 11, TypeScript                        |
| Backend tests   | Jest + @nestjs/testing                       |

Planned (to be added): GraphQL (Apollo), PostgreSQL + Prisma, MUI, react-hook-form + zod, next-intl,
Vitest + React Testing Library, Supertest, Docker (docker-compose for DB and Mailpit).

## Project structure

```
cv-builder/
├── package.json          # root scripts that run both apps
├── pnpm-workspace.yaml
├── backend/              # NestJS API
│   └── src/
└── frontend/             # Next.js app
    └── src/app/
```

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 10+

## Getting started

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000 (health check: `GET /health`)

## Scripts (run from the repo root)

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start frontend and backend in parallel |
| `pnpm dev:frontend` | Start only the frontend            |
| `pnpm dev:backend`  | Start only the backend             |
| `pnpm build`        | Build both apps                    |
| `pnpm lint`         | Lint all packages (where configured) |
| `pnpm test`         | Run tests in all packages          |

## Environment variables

TODO: list required variables once `.env.example` files are added (backend: `PORT`, defaults to `4000`).

## Database & migrations

TODO: docker-compose (PostgreSQL), migrations and seed instructions.

## Testing & coverage

TODO: unit and integration test instructions, coverage report (target > 80% for frontend and backend).

## E2E tests (optional)

TODO

## Implemented features

TODO

## Architectural decisions

TODO: UI library, auth approach, ORM & DB approach, SSR/SSG usage, testing tools — agreed with the mentor.

## API documentation

TODO

## Team & task distribution

TODO

## Git workflow

- Feature branches: `feature/<topic>`, `fix/<topic>`
- Every change goes through a PR with code review
- Conventional Commits: `feat(cvs): ...`, `fix(auth): ...`, `test(users): ...`
