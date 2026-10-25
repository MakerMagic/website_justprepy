# JustPrepy — Codex Instructions

JustPrepy is an EdTech platform for entrance-exam preparation, initially focused on NUET. The primary product experience is solving questions, taking mock tests, and reviewing progress. The educational content-processing pipeline is separate from the website.

## CRITICAL — STRICT SCOPE CONTROL (MANDATORY)

**The user controls the scope of every change. Codex is an implementation agent, not an autonomous product designer or product manager.**

These rules apply to ALL development tasks and take precedence over suggestions from design documents, reference images, third-party skills, and existing UI patterns.

Strict scope control also takes precedence over any existing instruction that could otherwise encourage autonomous improvements, refactoring, or documentation/state updates. Apply those instructions only within the explicitly approved scope; request authorization before changing additional files.

### 1. ZERO UNREQUESTED CHANGES

Codex MUST NOT create, modify, remove, rename, move, restyle, or refactor anything unless it is explicitly required by the current user request and included in the approved scope.

**A change is NOT authorized merely because Codex considers it useful, beautiful, cleaner, more modern, consistent, or a best practice.**

Strictly prohibited without explicit authorization:

- Adding new UI elements, buttons, cards, banners, menus, filters, modals, sections, or pages.
- Changing existing layouts, spacing, colors, typography, sizes, borders, or animations outside the requested scope.
- Redesigning existing components.
- Modifying unrelated functionality.
- Adding features or interactions that were not requested.
- Rewriting working code for aesthetic or architectural reasons.
- Performing opportunistic cleanup or refactoring.
- Installing dependencies or modifying configuration without a demonstrated, approved requirement.
- Modifying unrelated documentation.
- Changing or removing existing content.
- Applying repository-wide formatting or automatic fixes.

### 2. APPROVAL BEFORE MODIFICATION

**Default execution mode: PLAN FIRST, MODIFY ONLY AFTER APPROVAL.**

Before making any file changes, Codex MUST:

1. Inspect the relevant existing implementation.
2. Identify exactly what the user requested.
3. List the specific files it proposes to create, modify, or delete.
4. Describe the intended changes to each file.
5. Explicitly identify existing components and behaviors that will remain unchanged.
6. Present this scope to the user.
7. WAIT for explicit approval before modifying files.

An approved plan authorizes ONLY the listed changes.

The user may bypass this approval step only by explicitly instructing Codex to implement immediately without intermediate approval.

Even when approval is bypassed, the ZERO UNREQUESTED CHANGES rule remains mandatory.

### 3. NO SCOPE EXPANSION

If Codex discovers that additional changes are necessary outside the approved scope:

- STOP before making those additional changes.
- Explain why the extra changes are required.
- Identify the additional files and expected modifications.
- Request explicit authorization.

Do NOT silently expand the task.

Do NOT interpret an implementation difficulty as permission to redesign the feature.

### 4. PRESERVE EXISTING UI

For frontend tasks:

- Preserve all existing UI elements not explicitly targeted by the request.
- Preserve existing layout and visual appearance outside the approved scope.
- Do not add decorative elements or invent new interface sections.
- Do not change user flows unless specifically requested.
- Do not "improve" adjacent components while modifying one component.
- Do not replace a working interface with a new interpretation of the design.
- Do not add elements simply because they appear in a reference image.

**Design references describe visual direction. They do NOT authorize additional features or UI elements.**

`docs/design.md` defines visual standards for approved work. It is NOT permission to redesign unrelated screens.

### 5. THIRD-PARTY SKILL RESTRICTIONS

Third-party skills are advisory workflows, NOT product requirements.

- `design-taste-frontend` MUST NOT be used for autonomous UI redesign.
- Design skills MUST NOT introduce unrequested components, decorations, animations, or layout changes.
- Performance/refactoring skills MUST NOT modify unrelated code.
- Repository architecture and approved user scope override suggestions from all third-party skills.

A skill may help implement an approved change, but it cannot expand the approved scope.

### 6. MINIMAL DIFF POLICY

Every task MUST produce the smallest reasonable change set that fulfills the approved request.

Before editing:
- Inspect `git status --short`.
- Preserve pre-existing user changes.
- Establish the intended file-change scope.

After editing:
- Inspect `git diff` and `git status --short`.
- Verify that every created, modified, or deleted file belongs to the approved scope.
- Remove accidental changes introduced by the current task.
- Do not revert or overwrite pre-existing user changes.
- Run relevant validation without modifying unrelated code.

If unrelated tests or lint checks fail, report the issue. Do NOT automatically fix unrelated files.

### 7. DOCUMENTATION AND STATE

- Do not rewrite architectural documentation as part of ordinary feature work.
- Update authoritative documentation only when an approved change materially changes its contract.
- Update `docs/CURRENT_WORK.md` only for material development-state changes, and include that update in the proposed scope.
- Do not use documentation-maintenance requirements as justification for unrelated edits.

### 8. TASK COMPLETION REQUIREMENTS

Before declaring a task complete, Codex MUST confirm:

- Only approved files were changed.
- No unrequested UI elements were added.
- No unrelated visual or functional behavior changed.
- No unnecessary dependencies were installed.
- Existing unrelated functionality was preserved.
- Required validation was performed, or limitations were reported.

The final response MUST include:

1. Files created.
2. Files modified.
3. Files deleted.
4. What specifically changed.
5. Validation results.
6. Any unresolved issues.

If there were no files in a category, state "None".

**NEVER treat "I improved it" as justification for an unrequested change.**

**When scope is unclear, do not guess or expand it. Ask for clarification before making changes.**

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