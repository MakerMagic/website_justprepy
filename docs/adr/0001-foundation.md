# ADR 0001: Repository foundation

- Status: accepted for website foundation
- Date: 2026-10-23

## Context

JustPrepy needs a maintainable website foundation before features. Its existing
Python pipeline is separate. The inspected `kod_parser` checkout belongs to that
pipeline and has user changes; it must not be repurposed as the website.
The owner selected the separate website_justprepy repository, initially containing
only a committed .gitignore. The existing file and Git history are preserved.

## Decision

Use one feature-oriented modular-monolith website repository, separate from the
pipeline. Adopt official empty Next.js App Router scaffolding, React, strict
TypeScript, pnpm, ESLint, Prettier, Vitest, plain CSS and Node.js 24 LTS.
Installed versions live in the manifest/lockfile. Keep only a smoke route/tests.
Recommend PostgreSQL for future persistence without installing database tooling.
Derive integration from real exports. [Architecture](../ARCHITECTURE.md) owns boundaries.

## Alternatives and consequences

Microservices/workspace monorepos add unnecessary operational cost. Extending
the pipeline checkout conflicts with repository separation. Full UI/auth/database
starters impose unconfirmed feature decisions. One application simplifies
deployment/coordination but requires disciplined module/server-client boundaries.
Deferred infrastructure needs explicit decisions before dependent feature work.

## Open decisions

Content schema/identity mapping; ORM/provider; application and
database hosting; authentication; subscriptions; exam policies. These choices do
not block the foundation.
