# Backend

NestJS 11, TypeScript. Tests: Jest + @nestjs/testing.

## Scripts

Run from the repo root (`pnpm <script>`) or from this folder.

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `pnpm dev`       | Start in watch mode (port 4000) |
| `pnpm build`     | Build to `dist/`                |
| `pnpm start`     | Run the built app (`dist/main`) |
| `pnpm test`      | Run Jest tests                  |
| `pnpm typecheck` | Type-check with `tsc --noEmit`  |

Linting and formatting are configured at the repo root (`pnpm lint`, `pnpm format`).

## API

- `GET /health` — health check.

The port is taken from the `PORT` environment variable (default `4000`).

## Structure

```
src/   # main.ts, app.module.ts, app.controller.ts
```
