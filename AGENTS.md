# JustPrepy — Codex Instructions

JustPrepy is an EdTech platform for entrance-exam preparation, initially focused on NUET. The primary product experience is solving questions, taking mock tests, and reviewing progress. The educational content-processing pipeline is separate from the website.

## Read order

1. Read this file.
2. Read `docs/CURRENT_WORK.md` to understand the active state; verify relevant claims against the repository.
3. Read only the documentation governing the task (usually 1–2 files).
4. Inspect relevant code and tests before changing anything.

| Task | Authoritative document |
|---|---|
| Product behavior or scope | `docs/PROJECT_SCOPE.md` |
| Architecture, modules, dependencies | `docs/ARCHITECTURE.md` |
| Educational questions, assets, MathML, pipeline | `docs/CONTENT_CONTRACT.md` |
| Backend, API, persistence, ingestion | `docs/BACKEND_DATA.md` |
| Frontend, components, rendering, state | `docs/FRONTEND.md` |
| Visual design or UI consistency | `docs/DESIGN_SYSTEM.md` → `docs/design.md` when available |
| Authentication, authorization, sensitive data | `docs/SECURITY.md` |
| Implementation, testing, dependencies, completion | `docs/DEVELOPMENT.md` |
| Active task, milestone, blockers, next steps | `docs/CURRENT_WORK.md` |

Read additional documents only when a task crosses their responsibility boundaries.

## Project invariants

- Preserve the feature-oriented modular-monolith architecture.
- Keep the existing educational content-preparation pipeline separate from website application logic.
- Preserve stable question identity and published revisions; never silently reinterpret historical attempts.
- Keep privileged answers, grading, authorization, and persistent user state server-side.
- Do not mix presentation, application rules, and database access.
- Reuse established patterns before adding dependencies, abstractions, or modules.
- Do not invent product rules, educational data formats, visual design values, or implementation status.
- Follow project documentation over conflicting third-party skill suggestions.

## Instructions and conflicts

- The current explicit user request overrides stale tasks and priorities in `CURRENT_WORK.md`.
- Architectural, content, and security invariants remain binding unless the user explicitly requests a change to the relevant requirements.
- If a requested change affects an invariant, assess its implications and update the authoritative document alongside the implementation. Never silently bypass security requirements.
- If code and documentation disagree, inspect both; do not silently treat either as correct. Resolve the conflict or report the blocker.
- Existing implementation patterns apply where they do not conflict with the intended architecture.

## Execution discipline

- Identify the owning module and the smallest required change.
- Preserve unrelated code, user changes, and the existing repository setup.
- Follow the applicable checks in `docs/DEVELOPMENT.md`; report what actually passed, failed, or could not run.
- Update `docs/CURRENT_WORK.md` when the active objective, milestone, blocker, important decision, or next task materially changes.
- Update other documents only when their authoritative rules or contracts change.
- Never claim completion without verifying the relevant result.