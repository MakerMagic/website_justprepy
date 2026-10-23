# JustPrepy

JustPrepy helps students prepare for NUET, with possible future examination support.
This repository contains only the website foundation. Feature implementation has
not started. The educational pipeline remains in a separate repository.

## Setup

Use Node.js 24 LTS (24.x) and pnpm 11.25.0, as recorded in `package.json`.
No credentials, environment variables, external services or remote fonts are needed.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>; stop with Ctrl+C.
For production, run `pnpm build`, then `pnpm start`.

## Validation

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

`pnpm format` formats maintained files. Typecheck generates route types first.
Conventions and testing strategy: [Development](docs/DEVELOPMENT.md).

## Navigation

`src/app/` contains the smoke route, layout and CSS; `tests/` contains foundation
checks; `docs/` contains authoritative decisions. Start AI-assisted work at
[AGENTS.md](AGENTS.md). Product context: [Project scope](docs/PROJECT_SCOPE.md).
Future feature folders are created only with their first implementation.
