JustPrepy — Authentication Implementation Contract
Status: FINAL PRODUCT REQUIREMENTS; IMPLEMENTATION REQUIRES SEPARATE TASK APPROVALS
Version: 1.0
Date: 2026-10-30
Canonical repository path: docs/AUTH_IMPLEMENTATION_CONTRACT.md
Applies to: Supabase Auth, Google OAuth, email/password and email OTP, session security, identity/profile data, nickname onboarding, protected routes, account UI, and verification.
Authority and interpretation. This document is the source of truth for approved authentication requirements and task boundaries. It does not pre-approve a particular privileged SQL implementation, file edit, migration, deployment, account change, or secret-handling operation. If a proposed technical implementation is unsafe, inconsistent with this document, or blocked by an unknown, stop and request approval of a corrected plan. Do not silently weaken any requirement.

1. Mandatory agent operating rules
1. Before every auth-related task, read AGENTS.md, this contract, and the relevant existing docs/ARCHITECTURE.md, docs/SECURITY.md, docs/DESIGN_SYSTEM.md/`docs/design.md`, and docs/CURRENT_WORK.md (where present). Check the actual repository state; prior chat messages are not authoritative over these files.
2. The owner approves and executes one task at a time. The required order is A → B → D → C → E → F. Never proceed to the next task merely because the previous task passed.
3. PLAN FIRST. Before making changes, report the precise files and paths, proposed diff/behavior, dependencies, config changes, DB operations, tests, risks, rollback, and out-of-scope components. Wait for explicit owner approval for that single task.
4. Inspect git status first and git diff afterward. Preserve all existing work, including uncommitted changes. No git reset --hard, broad git clean, unrelated deletions, automatic commits, pushes, deployments, browser-storage clearing, or changes to other accounts or tabs.
5. Keep the existing UI, styles, navigation, educational logic, question fixtures, mock-test scoring, vocabulary logic, and analytics presentation unchanged except for minimal changes explicitly approved within the current task. No redesign or speculative features.
6. Do not paste, request, print, log, or commit private credentials. The owner enters Google Client Secret, SMTP passwords/API keys, and privileged Supabase keys directly into trusted dashboards/environment management. The browser only receives the intended Supabase publishable key.
7. Development and production must remain separate. Never make production DB changes, change OAuth publishing status, or enable billing without explicit additional owner approval.
8. At completion, give an evidence-based summary: files changed, migrations applied (if any), commands run and real results, manual tests, git status, meaningful git diff, unresolved issues, and next recommended single task. Do not claim a test was run if it was not.
9. Update docs/CURRENT_WORK.md after an approved task to track completed work, current blockers, and the next task. Do not rewrite this contract just to mark progress. Changes to this contract require owner approval.
2. Fixed product requirements
2.1 Identity and sign-in methods
- Supabase Auth is the only authoritative identity and session provider. Stable user ID: auth.users.id (UUID). Do not add a second auth system.
- Reuse the existing Google Cloud Web OAuth Client and the already configured Supabase Google Provider. Never recreate them as a side effect of an implementation task.
- Implement Google Sign-In first, then email/password registration/login as a separate approved task, both using the same Supabase Auth identity model.
- Email/password sign-up requires mandatory six-digit email verification code delivered by email and entered inside JustPrepy, not a confirmation-link-only flow. An unverified email/password account must not access student pages.
- Google OAuth users do not need an additional email OTP after successful Google sign-in.
- Implement complete password recovery: request recovery code, verify recovery OTP, set a new password, handle invalid/expired codes and failures.
- Implement secure session persistence/refresh and a working JustPrepy sign-out. Never equate signing out of JustPrepy with signing out of Google.
- Protect against misleading account-enumeration responses, unbounded OTP resend/verification attempts, and unsafe external redirects.
2.2 Routes and onboarding
- Public: /, /subscription, /contact, /what-is-nuet, /earn, and other confirmed marketing/informational routes.
- Student-only: /practice, /mock-tests and all test-taking/child routes, /analytics, /leaderboard, /vocabulary and its child routes, /settings, and any other existing or future private educational route.
- Student pages require both a validated Supabase session and a completed first-time nickname onboarding. Merely having a session is not sufficient.
- /login, /signup, /auth/callback, email confirmation/recovery screens, and other auth endpoints remain reachable as needed. /onboarding is available to authenticated users who have not completed nickname setup. Design redirects so that neither OAuth nor recovery causes loops.
- Activate blocking route guards only after Google sign-in, profile provisioning and onboarding can be exercised. Do not publicly deploy the incomplete intermediate development state.
- A Next.js proxy.ts redirect is not an authorization boundary for private data. Check verified identity and permissions at every protected Server Action, Route Handler, database operation, and RPC.
2.3 Mandatory nickname/username policy
For this project, nickname is the unique public username displayed in the student interface; it is not the login email or password.
- Required for every student, including Google OAuth users, during first-time onboarding.
- Case-insensitively globally unique, enforced by PostgreSQL, including simultaneous claims. Alex123 and alex123 must conflict.
- Approved validation baseline: 3–20 ASCII characters, letters A–Z/a–z, digits 0–9, and underscore _ only. First and final characters must be letters or digits.
- All hyphens and dashes are prohibited, including -, –, — and other Unicode dash variants. No spaces, emoji, periods or other punctuation.
- Exact regex for application and PostgreSQL validation:
  ^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$
- PostgreSQL must enforce the same character/length constraint, preferably a CHECK, plus a case-insensitive unique index/constraint. Do not rely on frontend validation or a preflight availability check to prevent races.
- Reserved names must be rejected case-insensitively in trusted database/server logic. Initial reserved set: admin, administrator, justprepy, support, moderator, mod, system, root, official, nuet, test, help, security, staff, null, undefined. Changes to the reserved set require review.
- The first successful nickname assignment starts the first seven-full-day cooldown. Do not leave a NULL timestamp loophole that permits immediate renaming.
- Subsequent nickname changes may occur only after at least 7 × 24 hours since the last successful assignment/change. Every successful change restarts this period; failed attempts do not.
- Nickname validation, uniqueness and cooldown must be enforced atomically in PostgreSQL/trusted server code with race handling. Users must be unable to edit the cooldown timestamp, substitute someone else's UUID, or circumvent the rules via direct REST/RPC calls.
- The UI should show clear errors for taken/invalid/reserved nicknames and remaining cooldown. A frontend availability indicator is advisory; only the committed database write establishes ownership.
2.4 Profile, titles and demo data
- Store minimal profile data associated with auth.users.id. The proposed baseline is id, nullable nickname until onboarding, avatar_url where already supported, title_id only as required by existing UI, nickname_changed_at, created_at, updated_at.
- Do not duplicate auth.users.email in the public profile table. Show the authenticated email in Settings via Supabase Auth; keep it read-only in this milestone.
- Do not store initials merely to render the UI; compute them from nickname.
- Starting title should follow confirmed existing project logic (rising / Rising Scholar in the latest repository audit). Title achievement/entitlement rules are not implemented by this auth milestone. Users may not assign themselves restricted or unearned titles through a cosmetics endpoint, column update, or crafted RPC.
- Existing demo profiles, bookmarks, attempts and localStorage fixtures are disposable: no migration, sync, account linking or preservation work. Do not indiscriminately clear browser storage or change unrelated modules.
- The existing prototype account-deletion control is not permission to implement real account deletion. Keep it non-destructive unless separately approved.
- Do not create a public_profiles view or public access to the private profiles table during Task D. Leaderboard/public profile exposure requires a future separately approved privacy design.
3. Security contract for Task D (mandatory before any SQL execution)
1. public.profiles: RLS enabled, owner-scoped SELECT, minimal explicit GRANTs; no general anonymous or cross-user SELECT. Treat RLS and SQL privileges as separate controls. No user-editable nickname_changed_at or entitlement fields.
2. Profile provisioning must really work for the current authenticated user, including Google and (later) verified email users, repeated visits, multiple tabs and concurrent calls. Task B must not reference profiles because the table does not exist until Task D.
3. If direct INSERT is allowed, demonstrate precise column-level INSERT privileges plus WITH CHECK so a client cannot supply another user ID, initial nickname, timestamp, custom title, or other protected fields. Alternatively, use a narrowly scoped trusted provisioning path. An ON CONFLICT DO NOTHING clause alone is not an access-control mechanism.
4. Direct arbitrary profile UPDATE must be unavailable. Separate permitted avatar changes from privileged nickname changes. DELETE, title changes and administrative columns must not be exposed implicitly.
5. If using SECURITY DEFINER, locate privileged logic outside API-exposed schemas, pin search_path = '', fully qualify references, verify auth.uid() and owner binding inside the function, and restrict EXECUTE and schema grants. Default function EXECUTE grants must be reviewed and revoked as needed.
6. Important callability requirement: merely storing a privileged function in app_private and revoking USAGE from authenticated does not explain how a normal user/client can invoke it. A public SECURITY INVOKER wrapper alone cannot bypass missing schema/function privileges. Before implementation, document and test the complete callable path (e.g., explicitly scoped secure server endpoint or narrowly designed function bridge), the effective execution role, every GRANT, RLS interaction, and why the public API cannot gain elevated unrestricted access. Do not use an exposed SECURITY DEFINER public RPC as a shortcut without separate security review; Supabase advises against that pattern.
7. A unique index prevents duplicate nickname commits; the client must catch actual database conflict errors and display a neutral, actionable message. Use row-level locking/transaction semantics for cooldown and simultaneous nickname changes.
8. Do not grant arbitrary title_id changes. If avatar change/storage is included, validate allowed data/ownership, and apply Storage RLS as appropriate; otherwise defer avatar upload/storage work.
9. Use versioned reviewed migrations in supabase/migrations/ with one source of truth. A manual SQL Editor action must use exactly the approved migration and be recorded, preventing drift. Never use DROP TABLE profiles as a generic rollback after user data exists.
10. Do not apply Task D SQL until the owner approves the exact migration, privilege model, provisioning path and two-user negative tests.
4. Supabase / Next.js engineering rules
- Repository audit found Next.js 16.4.2, App Router, pnpm (packageManager was reported as pnpm@11.25.0); verify actual files before running commands.
- Use @supabase/supabase-js, @supabase/ssr, and src/proxy.ts for the Next.js 16 session-refresh convention. Use existing architecture boundaries in src/server/ and src/modules/identity/ unless the owner approves deviations.
- Use only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for standard browser/SSR Supabase clients. Do not put the Google Client Secret, SMTP password, DB password, or any sb_secret_/service-role key in client code or an AI chat.
- SSR uses Supabase cookie-based sessions. Do not falsely claim standard browser-compatible @supabase/ssr cookies are HttpOnly. Correctly refresh/forward cookies and avoid shared caching of personalized content or Set-Cookie responses.
- Use verified server identity (getClaims for verified JWT claims where appropriate, getUser when current Auth user state is needed), not unverified getSession().user as proof of authorization. Prevent open redirect by allowlisting internal callback destinations.
- Secrets stay in ignored local env or trusted service dashboards. Commit only placeholder .env.example values. Preserve a strictly ignored .env.local.
- Do not invent packages, test commands, folders or APIs. Check actual installed versions, package scripts and official docs at implementation time.
5. Email OTP and SMTP contract
- The owner prefers free-tier SMTP, with Resend a candidate, connected directly to Supabase Auth. A free tier has quotas and may require a verified sender domain; near-instant delivery is a target, not an SLA.
- New Supabase Free projects using default SMTP cannot customize auth templates as of 2026-06-03; custom SMTP enables template editing under the current documented policy. The owner enters credentials and handles sending-domain DNS/verification.
- Supabase Email provider and mandatory Confirm Email must be enabled. For the confirmation email template, show {{ .Token }} (six-digit OTP) rather than requiring a confirmation link. Official JS signup verification example: verifyOtp({ email, token, type: 'email' }).
- Password recovery must use the appropriate recovery flow (verifyOtp(... type: 'recovery') where supported), an explicit new-password screen and updateUser({ password: ... }) after verified recovery.
- Respect actual project OTP expiry, resend intervals, abuse limits and SMTP quotas. Do not promise a hardcoded expiration or delivery time. Avoid leaking account existence in errors.
- Do not start Task C until custom SMTP is configured and a real test email can be delivered. The owner can configure SMTP while Task A/B/D are underway, but this does not authorize running Task C concurrently.
6. Task execution order, boundaries and acceptance gates
Task A — Supabase / Next.js auth infrastructure
Prerequisite: this contract is saved and referenced from AGENTS.md; exact plan approved.
Scope: install @supabase/supabase-js + @supabase/ssr with pnpm; establish minimal browser/server clients; .env.example with public placeholders; src/proxy.ts for session refresh only; correct env ignore; related documentation.
Not in scope: route blocking, Google button wiring, profiles, SMTP, UI redesign, any SQL migration.
Exit: pnpm typecheck, available tests and pnpm build pass (or failures are disclosed without unrelated fixes); src/proxy.ts works without cookie/runtime warnings; no secret leaks; reviewable diff.
Task B — Google OAuth and real session
Prerequisite: Task A accepted; Google OAuth and Supabase provider settings already configured by owner.
Scope: wire the existing Google buttons, add PKCE /auth/callback code exchange and safe internal redirects; validate actual session persistence/refresh. No profile lookup or provisioning in this task.
Not in scope: signup email/SMTP, profile SQL, protected routes, Sidebar refactor.
Exit: Google test account signs in, user appears in Supabase Auth, session survives reload, callback works without redirect mismatch; failures reported.
Task D — Private profiles, unique nicknames and onboarding
Prerequisite: Tasks A+B accepted; Task C/SMTP is not required; privileged SQL calling path and exact migration approved.
Scope: minimal private profiles schema, safe provisioning, unique nickname/check constraints, reserved-name validation, seven-day cooldown, necessary SQL privileges/RLS, onboarding screen using existing design language. Add provisioning to Google login and prepare it for subsequently verified email users. Do not create public_profiles.
Not in scope: email/password OTP, Leaderboard data publishing, user-created titles, Vocabulary, billing.
Exit: first nickname starts cooldown; concurrent case-insensitive duplicate fails; invalid dash and reserved names fail in DB; repeated provisioning is safe; two real users cannot read/write each other's profile; direct update of timestamps and title fails; tests pass.
Task C — Email/password, custom SMTP, six-digit OTP and recovery
Prerequisite: A+B+D accepted; owner has configured and tested SMTP.
Scope: connect existing email/password forms; dedicated six-digit accessible verification step; confirm email with real OTP; resend/errors; password recovery OTP plus new password; safe session and onboarding transition. Minimal UI additions only as explicitly reviewed.
Not in scope: new auth provider, identity migration, redesign or unrelated educational changes.
Exit: a fresh email user receives a real code, cannot acquire a verified email/password session before confirmation, verifies the code, can sign in and reset the password, and is provisioned without duplicates. Full student-route blocking is tested after Task E, not falsely claimed as complete in Task C.
Task E — Route authorization, Sidebar, Settings and Sign Out
Prerequisite: A+B+D+C accepted and tested.
Scope: protect every existing student route; public marketing stays accessible; redirect incompletely onboarded accounts to onboarding; bind existing Sidebar/account popover to current user, Settings read-only email and authorized nickname/avatar behavior; enable safe Sign Out. Add server-side identity/authorization checks in actual protected operations.
Not in scope: changing question/test logic, public leaderboards, subscription entitlement changes or real account deletion.
Exit: incognito and direct student URLs require login; valid session with no nickname requires onboarding; no redirect loops; personal data isolation; signing out removes JustPrepy session; visual regression checks pass.
Task F — Final regression and release-readiness assessment
Prerequisite: A, B, D, C, E separately accepted.
Scope: run all unit/integration/E2E tests; verify security invariants, RLS/GRANTs and negative REST/RPC cases using independent users; review logs, secrets and all diffs. Provide deployment readiness report, not an automatic production deployment.
Exit: tests demonstrated with evidence; all critical failures fixed only after separately approved changes; no extra scopes or destructive operations.
7. Minimum security test matrix (Task D and F; adapted per task)
Use two different signed-in test users (A and B), separate sessions and real authenticated Supabase Data API requests, together with DB permission tests. Check both success and denial paths; a refusal can be HTTP 401/403, a permission error, or zero visible rows depending on PostgREST/RLS semantics—do not hardcode one HTTP status as the only acceptable outcome.
- A can read A's own private profile; A cannot read B's private profile; unauthenticated clients cannot see private profiles.
- A cannot create/update/delete B's profile or create an account profile using B's UUID.
- A cannot directly update nickname, nickname_changed_at, title_id, administrative timestamps or unauthorized avatar fields.
- A cannot assign a restricted achievement/title to A using any endpoint.
- First-time nickname assignment succeeds exactly once and starts the seven-day period; immediate rename fails; later rename only succeeds after the real interval (test boundary logic safely without altering production clocks).
- alex_test is allowed; alex-test, alex–test, alex—test, spaces and invalid lengths are rejected by the database.
- Case-insensitive collisions and concurrent same-nickname claims reject the extra claimant without creating duplicates.
- Reserved names are rejected regardless of letter case.
- Profile provisioning is idempotent across repeated callbacks, refreshed sessions and multiple tabs.
- Once Task E is implemented, an incomplete profile cannot access student-only routes; at Task D only test onboarding and profile state without claiming route guards are already active. Valid Google and confirmed-email users can complete onboarding at the appropriate milestones.
- Unverified email/password users, logged-out users and users with expired sessions cannot retrieve private data; no open redirects, caching leaks or redirect loops.
- Password reset requires valid recovery flow; resends respect throttling; errors do not reveal private credentials or user data.
- Run available repo commands (pnpm typecheck, pnpm test, pnpm build) and real security tests; document actual passes and failures. Automated unit tests alone do not prove RLS security.
8. Documentation / milestone tracking
- This file is the stable requirements contract, not a running task diary.
- docs/CURRENT_WORK.md records the current task, accepted changes, outstanding issues and next owner-approved stage.
- Before each task, explicitly state: “I read AGENTS.md and docs/AUTH_IMPLEMENTATION_CONTRACT.md. I will work on Task [X] only after approval.”
- After each task, report exact files, tests, evidence, status and next proposed task, then stop.
- Suggested addition to AGENTS.md:
  For every task involving authentication, OAuth, sessions, users, profiles, nickname validation, onboarding, protected routes or database access policies, read docs/AUTH_IMPLEMENTATION_CONTRACT.md before planning or editing. Follow its approved requirements and task order. Work on one separately approved task at a time. Do not treat an old chat plan as more authoritative than the checked-in contract.
9. Official documentation (verify again when implementing)
- Supabase Next.js SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase RLS, grants, views and testing: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database function security: https://supabase.com/docs/guides/database/functions
- Supabase email templates / {{ .Token }}: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase JavaScript verifyOtp: https://supabase.com/docs/reference/javascript/auth-verifyotp
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase June 2026 email-template policy: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
Contract sign-off meaning: approving this document fixes the business rules and safety gates only. It does not authorize Task A, database migrations, SMTP setup, production deployment or any further task. Each task requires its own explicit approval.