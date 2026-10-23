# System Architecture

## Architectural model

**Target architecture:** One feature-oriented modular-monolith website application, with clear frontend, application, domain, and infrastructure boundaries.

The existing educational question-processing pipeline remains outside the website's application responsibilities.

A single repository/deployable application is preferred initially. Do not introduce microservices or a multi-package monorepo without a demonstrated requirement.

**Technology status:** Next.js/React/TypeScript and PostgreSQL were recommended as a baseline, but their actual adoption and installation must be verified from the repository. Do not treat a proposed technology as installed or approved solely because it appears here.

## Logical system boundaries

| Boundary | Owns | Does not own |
|---|---|---|
| External content pipeline | Parsing, cleaning, answer matching, categorization, content validation, explanation preparation | Student accounts, attempts, application UI |
| Content publication/import | Validation and controlled publication of website-ready releases | Recreating question-authoring logic |
| Application domain/services | Practice, assessment, mock-test workflows, progress operations | Rendering and framework-specific page layout |
| Persistence/infrastructure | Storage, queries, transactions, external service adapters | Product behavior and UI decisions |
| Frontend | Routes, interactions, question rendering, user-facing state | Privileged grading and direct database access |
| Marketing | Public product presentation | Exam engine and user assessment rules |

## Target repository ownership

Create directories when their first real implementation requires them; do not scaffold empty feature modules.

| Location | Responsibility |
|---|---|
| `src/app/` | Route entry points, layouts, thin page/API adapters if using Next.js App Router |
| `src/modules/<feature>/` | Feature-owned domain logic, services, interfaces, and UI |
| `src/components/` | Reusable application-independent UI primitives/layout |
| `src/design/` | Runtime visual tokens and shared styling foundations |
| `src/server/` | Shared server-only infrastructure/adapters |
| `src/shared/` | Pure cross-feature utilities/types with no business ownership |
| `contracts/` | Versioned external integration contracts when finalized |
| `db/` | Database migrations and controlled database artifacts when a persistence stack is chosen |
| `scripts/` | Operational commands that reuse application logic |
| `tests/` | Cross-module, contract, browser, and fixture-based tests |
| `docs/` | Authoritative development documentation |

If the existing repository has a valid different layout, adapt the boundaries rather than reorganizing blindly.

## Module ownership

| Module | Responsibilities |
|---|---|
| `questions` | Published question access, categories, question presentation contracts |
| `assessment` | Privileged grading, answer checking, authoritative attempt recording |
| `practice` | Individual-question practice interactions and feedback workflow |
| `mock-tests` | Test definitions, runs, navigation/timing lifecycle, submission orchestration |
| `progress` | Statistics and progress projections based on authoritative attempt data |
| `bookmarks` | User-specific saved-question relationships |
| `vocabulary` | Vocabulary content and learning interactions |
| `identity` | User identity integration, profile ownership and authorization interfaces |
| `content-import` | Validation, staging and publication of pipeline releases |
| `billing` | Future subscription/entitlement behavior, only when requirements are established |

A module owns its business rules. Shared infrastructure does not become a dumping ground for feature logic.

## Dependency rules

- Route/API adapters → application services → domain interfaces and persistence adapters.
- Domain logic MUST NOT depend on React, route handlers, databases, or external services.
- UI may depend on public domain types and presentation interfaces, not server-only implementations.
- Modules access another module's behavior through defined public interfaces; never import its private persistence implementation.
- `questions` MUST NOT depend on practice, mock-tests, attempts, or progress.
- `practice` and `mock-tests` reuse `assessment` for grading; they MUST NOT implement competing grading engines.
- `progress` derives from authoritative attempts; it MUST NOT maintain another competing attempt history.
- `content-import` may publish content but MUST NOT own educational authoring decisions.
- Avoid circular module dependencies.

## Data ownership and flow

**Educational content:** Existing pipeline → versioned publication boundary → validated application storage → question delivery → renderer/assessment.

**User interaction:** Client interaction → authorized server operation → attempt/application persistence → progress projections → client view.

Canonical educational content and user/application state are different ownership domains.

Stable question IDs and published revisions must preserve the meaning of historical attempts.

The actual content contract is governed by `CONTENT_CONTRACT.md`; persistence/API details by `BACKEND_DATA.md`.

## Replaceability and scaling

- Authentication, storage, and database providers remain replaceable behind narrow interfaces until explicitly selected.
- Keep infrastructure concerns isolated from domain policies.
- Prefer ordinary server-side execution and indexed relational queries before introducing caches, queues, or distributed services.
- Introduce background processing, specialized storage, or service extraction only after a concrete requirement or measured bottleneck.
- Document material boundary changes in the appropriate architecture documentation before relying on them elsewhere.