# Frontend

Next.js 16 (App Router), React 19, TypeScript.

## Scripts

Run from the repo root (`pnpm <script>`) or from this folder.

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start the dev server (port 3000) |
| `pnpm build`     | Production build                 |
| `pnpm start`     | Run the production build         |
| `pnpm typecheck` | Type-check with `tsc --noEmit`   |

Linting and formatting are configured at the repo root (`pnpm lint`, `pnpm format`).

## Structure

```
src/app/   # App Router: layout.tsx, page.tsx
```

Path alias: `@/*` → `src/*`.
