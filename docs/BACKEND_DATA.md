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

## Current browser-only Mock Test analytics adapter

The current Mock Test flow has no authenticated identity, published exam pool,
server assessment or official points policy. Its existing demo attempt adapter
uses immutable per-attempt localStorage records behind mock-test-attempt.storage.ts.
This is device/browser/origin-local, editable demo storage, never a production database.

New attempts optionally capture versioned analytics inputs: the stable local demo
profile owner (not the editable nickname or an authenticated user ID), test section
configuration, composite question IDs, source revision fingerprints, assigned subjects,
known source-matched topics, and observed question dwell milliseconds. Manual Finish
and timeout share one finalization boundary and freeze the existing evaluation in the
same attempt record. Results and advanced analytics read that evaluation; derived
counts, percentages and changes are not additional writable copies. Retakes retain
separate IDs. Web Locks plus immutable completion prevent duplicate finalization.

Dwell time is checkpointed by the existing timer and before navigation/exit/submission.
It measures visible question time; hidden pages, time after exit and time before a
refresh/resume observation are excluded. Total exam elapsed time still includes time
away and retains its configured deadline. Week/month timing means rolling 7/30-day
windows ending at the selected completion, weighted by observed question samples.
No unobserved zero samples or future completions enter an average.

Previous comparison uses the closest strictly earlier completion with a known matching
demo owner and section configuration, across catalogue test IDs. Legacy records remain
readable, immutable and unmodified; absent ownership/timing/taxonomy is unavailable,
not backfilled. Catalogue example results are explicitly labelled and never become
synthetic attempt history. Section points are compared only when both exist; otherwise
available correct-answer accuracy is explicitly labelled separately from scaled score.
The reused CT examples in Mathematics slots do not gain invented Mathematics topics.
A future backend must supply authenticated ownership, server time, published question
revisions and authoritative scoring through the same read model/adapter boundary.
