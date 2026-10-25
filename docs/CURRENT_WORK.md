# Current Work

## Current milestone

Mock Tests catalogue preview at `/mock-tests`, alongside Question Bank, `/practice` and public auth previews.

Question Bank frontend at `/` rebuilt around the owner-supplied reference and
`docs/design.md`: exactly Introductory, Filters and Tasks sections. Taste's app-screen
workflow guided density, data integrity, responsive behavior and visual review.

## Implemented

- `/mock-tests` reuses `PracticeShell` and the extracted shared `StatisticCard`; desktop/mobile navigation links to the catalogue with the correct active state. Typed illustrative test records drive completion/type filters, counts, recent-score statistics and full/sectional cards. Start, Analyze and Retake retain explicit unavailable-preview notices; no mock-test engine, analysis route or persisted results are implemented.

- `/practice` reuses the finalized sidebar and extracted header through `PracticeShell`. It provides passage/answers, an elapsed demo timer, per-question selections/bookmarks, demo-only checking, a difficulty/status navigator and a two-pane explanation dialog with isolated answer reveal. Failed evaluations remain retryable; first-attempt success is correct, success after a failed evaluation is partly correct, and unresolved failure remains wrong while selecting a retry. Both dialogs use the same session state; shared content/answer renderers support LaTeX-to-native-MathML and image parts. Topic previews link to it. The owner explicitly requested the existing sidebar/Telegram header here; this preview is an exception to the immersive-shell default, not a new mock-exam policy.
- Public `/login` and `/signup` auth previews share a responsive form shell, local validation, password visibility controls, and original SVG landscape. Authentication, Google, recovery and legal content remain explicitly unconnected; credentials are never transmitted or persisted.
- Compact/expanded membership promotion; account-only trigger morph and four-stage content reveal with reduced-motion support. Subscription destination remains an explicit preview notice.
- Red progress statistics, compact neutral filters, outlined navigation and circular play actions.
- Collapsed desktop rail with sidebar-owned pointer events, keyboard and touch alternatives; original monogram and full wordmark states.
- Anchored account menu; source panels positioned before first paint, resized to available space and updated on scroll.
- Functional status, saved, difficulty, source and draft/apply year filtering.
- Only Oxford and BMAT appear as independent source/year selectors. Applied years are preserved per source. Availability remains illustrative; underlying fixture contracts are unchanged.
- Topic progress and set previews derive from typed fixtures supplied through page props.
- Header Telegram CTA has a configurable, currently absent destination. Statistics open fixture-derived summaries; topic actions retain previews. Upgrade/account actions remain preview boundaries.

## Data boundary

`src/modules/questions/question-bank.fixtures.ts` holds temporary profile, sources,
year availability and question-summary data. `practice.fixtures.ts` separately holds three authored demo questions and illustrative local feedback; it is not published exam content or a production grading contract. No database, API, authentication service,
real-question integration, authoritative grading or persistent user data has been implemented. Unavailable
navigation opens an explicit preview limitation; account actions remain disabled.

## Local preview

The LAN preview at `192.168.1.2:3000` is explicitly allowed in `next.config.ts`.
Next's dev HMR/debug transport otherwise rejects this origin and React hydration
stalls: native popovers open at fallback coordinates and React hover handlers do
not run. Keep this allowance scoped to the actual development host.

## Validation

Lint, typecheck, all 59 tests, changed-file formatting and the production build pass.
Practice browser checks cover repeated failed attempts, first-attempt success versus eventual partial success, richer navigator statuses, red switches, fully neutral review options with Show Answer off, circle-only feedback, navigator modes/jumps, retained answers, modal scrolling/dismissal/focus cycling, bookmarking, timer continuity and shared-sidebar hover. Desktop/tablet/mobile reviews include a 320px navigator; the updated review composition was inspected at 1440/768/390px. MathML/LaTeX and image rendering have focused regression coverage. Taste inspection passes at 1440/768/390px with zero failures or warnings; screenshots were reviewed.
Auth visual checks cover desktop, tablet and mobile; forms validate locally and use explicit preview feedback instead of account creation.
Browser checks cover desktop/tablet/mobile interactions and data states, including
320px layout, focus restoration and conditional years. Production console is clean.
Repository-wide formatting still flags nine pre-existing documentation files.

## Next / open decisions

Replace illustrative view data when authorized services are available. Real practice
sessions, account actions and future navigation destinations remain unconnected.
Database/provider/ORM, authentication services and pipeline integration remain out of scope.
