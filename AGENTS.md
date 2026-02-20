# Repository Guidelines

## Project Structure & Module Organization
This is a Bun + Turborepo monorepo.
- `apps/native`: Expo React Native app (Expo Router entrypoint, UI components, assets).
- `packages/backend`: Convex backend (`convex/` queries, mutations, actions, schema).
- `packages/domain-kernel`: shared domain logic and tests in `src/__tests__`.
- `packages/config`: shared TypeScript config.
- `packages/env`, `packages/ui`: shared environment and UI-related packages.
- `docs/`: design notes and planning docs.

Use workspace imports like `@seila/backend` and `@seila/domain-kernel` instead of deep relative paths.

## Build, Test, and Development Commands
Run from repo root unless noted.
- `bun run dev`: start all dev tasks via Turbo.
- `bun run dev:native`: run only the Expo app.
- `bun run dev:server`: run only Convex dev server.
- `bun run dev:setup`: initialize/configure Convex (`@seila/backend`).
- `bun run check-types`: run type checks across workspaces.
- `bun run test`: run workspace tests.
- `bun run check`: run lint pipeline + formatter (`oxfmt`).

Package-specific examples:
- `cd apps/native && bun run ios`
- `cd packages/backend && bun run dev`

## Coding Style & Naming Conventions
- TypeScript with strict settings; avoid `any` unless justified.
- Follow existing style: 2-space indentation, semicolons, double quotes in TS/TSX.
- Components/types: `PascalCase`; variables/functions: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Convex files are grouped by role: `queries/`, `commands/`, `actions/`, `agents/`.

## Testing Guidelines
- Primary tests are in `packages/domain-kernel/src/__tests__` with `*.test.ts` naming.
- Run all tests: `bun run test`.
- Run domain-kernel only: `cd packages/domain-kernel && bun run test`.
- Add/update tests when changing domain behavior, reducers, or decision logic.

## Commit & Pull Request Guidelines
Git history mixes plain messages and Conventional Commit prefixes; prefer Conventional Commits:
- `feat: ...`, `fix: ...`, `chore: ...`, `test: ...`
- Keep subject imperative and specific.

PRs should include:
- What changed and why.
- Affected packages/paths.
- Verification steps (commands run).
- Screenshots/video for UI changes (`apps/native`).
- Linked issue/task when available.

## Security & Configuration Tips
- Do not commit secrets. Use `.env`/`.env*.local` (gitignored).
- Keep `.vscode/` ignored.
- When changing Convex contracts, update both backend handlers and native callsites in the same PR.
