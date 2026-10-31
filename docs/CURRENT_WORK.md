# Current Work

## Current Milestone: Authentication & Identity Integration (Supabase Auth)

Establish authoritative authentication, private profile management, and route protection using Supabase Auth and `@supabase/ssr` on Next.js 16.4.2 in accordance with [`docs/AUTH_IMPLEMENTATION_CONTRACT.md`](./AUTH_IMPLEMENTATION_CONTRACT.md).

For previous completed frontend milestones and historical context, refer to the archive in [`docs/CURRENT_WORK_OLD.md`](./CURRENT_WORK_OLD.md).

---

## Completed Preparation & Infrastructure

- **Authentication repository audit:** COMPLETE. Confirmed Next.js 16.4.2 (App Router), `pnpm@11.25.0`, and absence of real backend auth or database packages.
- **Product requirements and security planning:** COMPLETE.
- **Authentication implementation contract:** APPROVED. [`docs/AUTH_IMPLEMENTATION_CONTRACT.md`](./AUTH_IMPLEMENTATION_CONTRACT.md) (v1.0) is the authoritative single source of truth for all authentication requirements, security invariants, and acceptance gates.
- **Google Cloud OAuth Web Client:** Configured by the owner.
- **Supabase Google Provider:** Configured by the owner.
- **Task A (Supabase Next.js Auth Infrastructure):** COMPLETE & ACCEPTED.
  - Installed official Supabase SSR libraries: `@supabase/ssr@^0.12.7` and `@supabase/supabase-js@^2.118.0`.
  - Created `.env.example` with public key placeholders.
  - Created singleton browser client in `src/modules/identity/identity-client.ts`.
  - Created request-scoped server client in `src/server/supabase/server-client.ts` with Next.js 16 async cookie handling.
  - Created session refresh helper in `src/server/supabase/proxy-client.ts` with fail-closed production blocking and anti-caching protection.
  - Created Next.js 16 network proxy in `src/proxy.ts` for passive cookie refresh without route blocking.
  - Added `.gitignore` exception `!.env.example` ensuring `.env.local` remains strictly ignored.
- **Task B (Google Sign-In and Session Verification):** IMPLEMENTED & VERIFIED (Automated).
  - Created `src/modules/identity/auth.service.ts` initiating Google OAuth via Supabase PKCE (`signInWithOAuth`).
  - Created `src/app/auth/callback/route.ts` exchanging PKCE `code` for session, with strict internal redirect allowlisting and anti-caching headers (`no-store`).
  - Connected existing Google buttons on `/login` and `/signup` in `src/modules/auth/auth-form.tsx` with error display and loading state.
  - Automated validation: `pnpm typecheck` (0 errors), `pnpm test` (420 tests passed), `pnpm build` (clean Turbopack compilation), automated `/auth/callback` error routing (cancellation, missing code, invalid code redirecting safely to `/login` with HTTP 307 and `no-store`).

---

## Task Execution Order

The approved execution sequence is:

**A → B → D → C → E → F**

- **Task A:** Supabase Next.js authentication infrastructure (`@supabase/ssr`, Next.js 16 `src/proxy.ts`, environment templates, typed clients) — **COMPLETED & ACCEPTED**.
- **Task B:** Google Sign-In and session verification (PKCE callback, session persistence; no profile dependencies) — **IMPLEMENTED (AWAITING OWNER LIVE SIGN-IN VERIFICATION)**.
- **Task D:** Private profiles, unique nicknames, seven-day cooldown, and onboarding (minimal schema, strict RLS, no public VIEW, initial selection fixes cooldown start) — **NEXT (AWAITING SEPARATE AUTHORIZATION)**.
- **Task C:** Custom SMTP, email/password authentication, mandatory six-digit email confirmation, and password recovery (Custom SMTP prerequisite, `verifyOtp(type: 'email')`, full recovery flow).
- **Task E:** Protected educational routes, Sidebar, Settings, and Sign Out (`src/proxy.ts` guards, dynamic user state, working logout, defense-in-depth server checks).
- **Task F:** End-to-end testing, PostgreSQL security tests, and production-readiness review (automated test suite + 2-user real PostgREST allow/deny verification).

---

## Current Implementation Scope

**Current Task: Task B — Google Sign-In and Session Verification**

**Task B Status: IMPLEMENTED (Automated checks passed; manual Google Sign-In verification pending on localhost:3000)**

**Tasks D, C, E, F: NOT AUTHORIZED TO BEGIN**

### Implemented Task B Scope

Files created:
- `src/modules/identity/auth.service.ts`
- `src/app/auth/callback/route.ts`

Files modified:
- `src/modules/auth/auth-form.tsx`
- `docs/CURRENT_WORK.md`

Strict exclusions maintained:
- No database migrations, schemas, or profile tables created (belongs to Task D).
- No nickname onboarding or editing implemented (belongs to Task D).
- No email/password authentication or OTP implemented (belongs to Task C).
- No route blocking or redirects enforced on educational routes (belongs to Task E).
- No Sidebar, Settings, or Sign Out functionality changed (belongs to Task E).
- No unrelated website UI modified.

---

## Carry-over Issues (Historical)

These items are carried over from previous development milestones for project visibility. **Work on these items is NOT authorized under the current authentication milestone:**

1. **LAN Development Preview Allowance:** Hosts `192.168.1.2:3000` and `192.168.1.4:3000` are explicitly allowed in `next.config.ts` for LAN HMR/debug transport. This allowance must remain strictly scoped to these development hosts.
2. **Demo Call Booking URL:** `DEMO_CALL_URL` in `src/modules/subscription/subscription.config.ts` is empty; the button on `/subscription` remains unlinked and labelled as not open.
3. **Creator Program Destination:** The source application URL in `/earn` remains empty; clicking Apply scrolls to an unavailable notice and the official Telegram link.
4. **Practice Question Fixtures:** Only three authored Critical Thinking practice examples exist; they repeat across demo slots (including Mathematics) as disclosed in the interface. Real exam content pipeline integration remains pending.
5. **Subscription & Billing:** Checkout remains unconnected. Subscription tiers (Free/Pro) are UI presentations; no billing provider or entitlement checks exist.
6. **Prototype Account Deletion:** The account-deletion control in `/settings` is a non-destructive UI prototype. Real account deletion is not implemented and must not be simulated destructively.
7. **Repository Documentation Formatting:** Pre-existing markdown formatting warnings flag nine documentation files when running repo-wide prettier checks.

---

## Next / Open Decisions

1. Owner executes live manual sign-in test on `http://localhost:3000` using Google OAuth.
2. Confirm session cookies (`sb-*-auth-token`) are set and survive page refresh.
3. Confirm new authenticated user appears in Supabase Dashboard (`Authentication` → `Users`).
4. Stop and wait for owner's explicit authorization before beginning Task D.
5. Tasks D, C, E, and F remain paused and unauthorized until their respective prior tasks are reviewed and approved.
