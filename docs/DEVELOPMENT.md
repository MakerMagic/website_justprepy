# Development Standards

## Before implementation

1. Read `AGENTS.md` and `CURRENT_WORK.md`.
2. Identify the task owner and read the relevant authoritative document(s).
3. Inspect existing code, tests, dependencies, and Git changes.
4. Confirm the smallest required implementation scope.
5. Resolve material uncertainty before introducing irreversible contracts or architecture.

Do not implement unrelated features or refactor adjacent code without a clear need.

## Code organization

- Prefer clear, typed interfaces and small cohesive modules.
- Follow existing project naming/import conventions.
- Keep feature behavior within its owning module.
- Keep transport, domain, persistence, and presentation responsibilities separate according to `ARCHITECTURE.md`.
- Do not duplicate established logic or create abstractions without consumers.
- Avoid broad type escapes, suppressed errors, and unnecessary compatibility layers.
- Prefer existing supported tooling over new packages.

Formatting/lint rules are enforced through repository configuration, not duplicated here.

## Dependencies

Before adding a dependency:

- Verify an existing dependency or platform capability cannot meet the need.
- Identify the real consumer and ownership layer.
- Check compatibility, maintenance, security, bundle/runtime impact, and license constraints.
- Add only the packages required for the current task.
- Keep the project's selected package manager and lockfile consistent.
- Do not install speculative UI, database, AI, authentication, or infrastructure libraries.

A third-party Codex skill does not authorize changes to the product architecture or dependencies.

## Testing strategy

| Change | Expected validation |
|---|---|
| Pure domain logic | Unit tests |
| Persistence or server workflow | Integration tests with controlled data |
| External content contract | Schema/fixture regression tests |
| Question rendering | Rich-content, MathML, assets, options, and error-state tests |
| User workflow | End-to-end tests when browser tooling exists |
| Shared UI/design change | Accessibility, responsive, and visual regression checks |
| Security-sensitive behavior | Authorization, exposure, and invalid-input tests |

Add tests where the behavior lives. Avoid unnecessary snapshots and brittle mocks.

Do not introduce new test frameworks until a test requirement justifies them.

## Validation commands

Use scripts actually defined in the repository's `package.json`.

For the proposed pnpm/TypeScript foundation, expected equivalents are:

| Check | Expected command |
|---|---|
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Tests | `pnpm test` |
| Build | `pnpm build` |
| Formatting | `pnpm format:check` |

These commands are expectations, **not confirmation that scripts currently exist**.

Verify the actual package manager/scripts before executing. If a check is missing or cannot run, report it honestly; do not silently skip or falsely claim success.

Run checks appropriate to the change, including broader regression checks when shared code or architectural boundaries are affected.

## Refactoring and migrations

- Preserve observable behavior unless the task explicitly changes it.
- Review consumers before changing shared interfaces.
- Avoid unrelated formatting or file moves.
- Database schema changes, once applicable, require versioned migrations.
- Preserve stable question identities, publication revisions, and historical attempt meaning.
- Never modify generated files instead of their source when regeneration is available.
- Do not alter external pipeline output formats without explicit cross-system agreement.
- Do not overwrite or delete unrelated user work.

## Documentation updates

Update the authoritative document only when its documented contract or convention materially changes:

| Change | Document |
|---|---|
| Product requirements | `PROJECT_SCOPE.md` |
| Module/system boundaries | `ARCHITECTURE.md` |
| Educational content contract | `CONTENT_CONTRACT.md` |
| Backend/data conventions | `BACKEND_DATA.md` |
| Frontend implementation conventions | `FRONTEND.md` |
| Design implementation rules | `DESIGN_SYSTEM.md` |
| Security requirements | `SECURITY.md` |
| Development process | `DEVELOPMENT.md` |

Visual design values belong to `docs/design.md` once supplied and adopted.

Update `CURRENT_WORK.md` when a milestone, active objective, blocker, important decision, or next task materially changes.

- Describe the current state, not the history of changes.
- Remove stale entries rather than appending a log.
- Do not update documentation for trivial changes that preserve existing documented behavior.
- Keep navigation and references correct.

## Handling uncertainty

- Verify repository state before assuming a feature, library, or schema exists.
- Distinguish established decisions from recommendations and open questions.
- Do not invent NUET policies, question formats, database structures, or design values.
- Choose the smallest reversible solution where requirements permit.
- Ask for clarification when correctness depends on unknown external facts or contracts.
- If partial work is possible safely, complete and validate that portion while identifying unresolved blockers.

## Completion criteria

A task is complete only when:

- The requested behavior is implemented within the correct boundaries.
- Relevant tests/checks pass, or their limitations are reported.
- No unrelated features or dependencies were introduced.
- Security and content invariants remain intact.
- Necessary authoritative documentation and current state are updated.
- The final report states what changed, what was verified, and what remains unresolved.

Do not automatically commit, push, deploy, or perform destructive operations without appropriate authorization.