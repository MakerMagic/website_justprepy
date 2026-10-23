# Backend and Data Rules

## Scope

This document governs server-side application services, persistence, data access, APIs, transactions, ingestion, and data evolution.

The target architecture is a modular monolith (`ARCHITECTURE.md`). Database/ORM/provider selection and existing backend implementation must be verified from the repository. PostgreSQL is a recommended baseline, not an assumed installed service.

## Data ownership

| Data | Authority |
|---|---|
| Prepared educational questions and explanations | External content pipeline |
| Published website question versions | Validated application publication store |
| Users and authentication identities | Selected identity system and application identity mapping |
| Practice/mock attempts and outcomes | Server-side assessment operations |
| Saved questions | Server-side user/application state |
| Progress/statistics | Derived from authoritative attempt records |
| Vocabulary user progress | Server-side vocabulary state when implemented |

Published educational content and user-generated/application state must remain independently managed.

## Server structure

- Route handlers/API adapters handle transport concerns: authentication context, input parsing, response mapping, and errors.
- Application services implement use cases and transaction boundaries.
- Domain logic owns validation of business invariants and grading policies.
- Persistence adapters own database queries and mappings.
- UI code MUST NOT issue database queries directly.
- Feature modules MUST NOT import another module's private repository.
- Shared server infrastructure MUST NOT become a location for unrelated business rules.

Cross-module operations must use explicit service/query interfaces.

## API and validation

- Use direct server-side service calls where appropriate; create HTTP endpoints only for actual clients/integrations.
- Validate request shape, identifiers, pagination/filter inputs, and authorization at server boundaries.
- Never trust client-supplied correctness, scores, elapsed time, user IDs, ownership, or entitlements.
- Use explicit, stable response/error contracts once an endpoint is implemented.
- Do not expose internal errors, database details, or privileged content to clients.
- Do not invent endpoints or API version schemes before actual consumers require them.

See `SECURITY.md` for mandatory access-control and exposure rules.

## Assessment and attempts

`assessment` owns authoritative grading and attempt recording.

- Practice and Mock Tests reuse shared assessment rules.
- The server determines correctness using the appropriate published question revision.
- Submitted answers reference stable question/option identities, not visual positions.
- Completed attempts must remain interpretable after question edits.
- Handle retries and duplicate submissions without duplicate final results.
- Record submission/result changes atomically where consistency requires it.
- Distinguish in-progress mock state from finalized attempt outcomes.
- Server time is authoritative for persisted timestamps; client timers are presentation aids.
- Do not accept client-generated progress counters as authoritative.

Exact mock timing, resumption, partial-credit, submission, and answer-release policies require product decisions before implementation.

## Progress and analytics

Persist authoritative user events/attempt results first. Build progress views from those records.

- Daily/weekly/monthly counts must have explicit counting and timezone semantics.
- Accuracy denominators and repeat-attempt handling must be defined consistently.
- Topic/subcategory statistics must reference stable taxonomy/question revisions as appropriate.
- Aggregated or cached statistics must be reproducible from source records.
- Do not create competing writable sources for the same statistics.
- Add precomputation only after justified performance needs.

## Content ingestion

Ingestion is a publication boundary, not an authoring pipeline.

- Accept only validated versions of the external content contract.
- Validate references before publication.
- Keep import/release identity for traceability.
- Use idempotent processing and safe publication transitions.
- Never silently overwrite history-referenced question revisions.
- Failed imports must not leave partially visible content.
- Do not transform, invent, or repair academic answers in website backend logic.

The source contract is governed by `CONTENT_CONTRACT.md`.

## Persistence and migrations

- Choose one primary persistence approach when implementation requires it.
- All schema changes must be versioned and reproducible.
- Migrations must preserve existing user history and published content identity.
- Use database constraints to support established invariants.
- Use transactions for logically indivisible operations.
- Avoid destructive production-data changes without an explicit migration/rollback plan.
- Keep database queries in the owning server/persistence layer.
- Do not create speculative tables for unimplemented features.

## Caching and failures

- Begin without additional cache infrastructure unless measurement justifies it.
- Published content may be cached only with revision/publication-aware invalidation.
- Never share user-specific or privileged response caches across users.
- Handle unavailable content, failed dependencies, validation errors, and conflicts explicitly.
- Log enough context to diagnose failures without exposing secrets or unnecessary personal data.

## Decisions requiring confirmation

- Actual framework/server runtime and database provider.
- ORM/query and migration tooling.
- Identity provider and session integration.
- Concrete API contracts.
- Exact logical/physical data schema.
- Grading and mock-exam policies.
- Statistics timezone/counting rules.
- Asset storage and publication mechanism.
- Performance thresholds requiring caches or background work.

Do not resolve these by installing libraries or inventing schemas without an implementation requirement and supporting decision.