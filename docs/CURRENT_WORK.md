# Current Work

## Current milestone

Reference-matched public Contact Us at `/contact` and the supplied What is NUET
content at `/what-is-nuet` and the supplied UGC Creator Program at `/earn`,
alongside Leaderboard, Mock Tests, Question Bank,
`/practice` and public auth previews.

Question Bank frontend at `/` rebuilt around the owner-supplied reference and
`docs/design.md`: exactly Introductory, Filters and Tasks sections. Taste's app-screen
workflow guided density, data integrity, responsive behavior and visual review.

## Implemented

- Results More Analytics opens the source-matched four-section Advanced Mock Test
  Analytics native dialog. Answer distribution reads the exact completed evaluation;
  topic accuracy and period timing use saved source-matched metadata and observed dwell
  samples. New browser-only attempts snapshot existing evaluation and analytics inputs
  through the same manual/timeout finalization boundary. Earlier-comparable selection
  requires known demo ownership and identical section configuration. Legacy missing data,
  unknown official points and unmapped demo Mathematics topics remain unavailable.
  No backend, authenticated identity, invented scores or synthetic history is introduced.

- Saved profile titles share one renderer and source in Settings, Sidebar and the
  matching current-user Leaderboard row, including gradients/emoji. Missing titles stay empty.
  Mock Test total-duration expiry shares manual finalization, caps elapsed time at the configured
  deadline, restores expired attempts into Results, and preserves sequential section locks.
  Browser Web Locks and the existing immutable attempt key coordinate duplicate finalization.
  Completed demo Results open the existing Question Bank ExplanationModal using composite
  question IDs, section-local numbering and original authored demo feedback. Historical
  illustrative completions without question records show an unavailable notice. Production
  auth, authoritative server time, grading and cross-device persistence remain unconnected.

- `/settings` ports the supplied Settings layout, profile title picker, avatar canvas
  cropping, save/cancel, seven-day nickname lock and confirmation motion. It has no shared
  header/sidebar/footer; the existing profile menu Settings action opens it on all app pages.
  No authentication, registration email or billing account service exists. This route exposes
  only the existing demo profile, clearly labelled, with versioned browser-only nickname,
  title and cropped avatar preferences shared with the sidebar. Real account access control,
  server persistence and cross-device synchronization remain pending. Subscription dates and
  refund eligibility stay unavailable; cancellation and deletion never simulate success.
  Legal links use the existing unavailable-preview behavior because no legal routes exist.

- Public `/subscription` page renders inside `PublicSiteShell` (no sidebar) with the Free/Pro
  cards shared with the pop-up through `renderSubscriptionPlans`, plus a "Not sure yet?" demo-call
  block. The shell's header Subscribe and footer Subscription link to it; the sidebar pop-up is
  unchanged. `DEMO_CALL_URL` in `subscription.config.ts` is empty (no booking page or URL exists
  yet), so the button is unlinked and labelled as not open until one is supplied.

- Mock Test taking at /mock-tests/[testId]/take reuses the practice workspace.
  Owner-approved browser-only demo attempts preserve answers, flags, completed sections and section positions;
  full tests start with Mathematics, followed sequentially by combined CT/PS, each numbered 1–30.
  The manual section switcher is removed and the active section name appears inline next to Exit;
  completing Mathematics via Finish Section locks it permanently and opens CT/PS Question 1,
  while the final section uses Finish Test.
  Only three authored Critical Thinking practice examples exist: they repeat across demo
  slots (including Mathematics), explicitly disclosed in the interface. No real exam content
  or production assessment service is connected. The unpausable elapsed timer includes time
  away; the configured total duration now automatically finalizes expired attempts. Finish Test confirms and evaluates demo keys
  into the existing Results page; official and section points remain unavailable because
  no scoring policy exists. Save & Exit resumes the same browser attempt in the active section; Retake retains
  completed history. Browser data is non-authoritative and is not synced between devices.

- Analytics at `/analytics` ports the supplied illustrative data, SVG charts and
  four sections inside PracticeShell. Existing sidebar navigation includes Analytics;
  period/subject controls, dual-axis tooltips, annual activity heatmap, topic-fill
  transitions and per-configuration Mock Test comparisons follow the source.
  The three section View more buttons open source-matched Analytics dialogs with
  outcome/accuracy bars, per-configuration scores, error radars and vocabulary charts.
  Source controls, chart/modal motion, focus restoration and underlying page state
  are preserved; pop-up data remains illustrative. Ranking retains its existing route.
  Styles and source light/dark palettes are scoped
  to Analytics; no real student analytics or backend is introduced.

- Shared subscription plans open above the current page from public Subscribe/footer
  Subscription, sidebar Pro/Try Now and account Subscription. The supplied Free/Pro
  design, Inter typography, 0 ₸ / 10,000 ₸ prices and 1.7s button shimmer are retained.
  A native dialog coordinates a 600ms spatial entrance, staggered cards, progressive
  backdrop blur/dimming and 220ms exit, with reduced motion, focus restoration and
  scroll locking. Checkout remains unconnected and reports that explicitly.

- Vocabulary at /vocabulary recreates the screenshot with the existing PracticeShell
  sidebar and NUET Preparation header, platform typography and two centered shared
  statistic cards retaining check/trend motifs. Three screenshot-derived demo
  presets (My Words selected initially) use independent checkbox multi-selection. Vocabulary is
  under Practice navigation. Inspect Words opens the source-matched preset inspector:
  My Words supports add/edit/delete and four-second Undo; built-in presets expose
  read-only details and user-only exclude/unexclude preferences. Status restoration,
  nested dialogs and source motion are preserved with scoped platform typography.
  Source example lists are labelled Demo data. Practice opens reference-matched flashcards for
  selected, non-excluded words, with flip/slide/bookmark motion, source keyboard
  controls, self-assessment, early/automatic completion and missed-only review.
  Bookmark/Save All changes share My Words data with the inspector and persist as
  non-authoritative browser bookmarks. Edits to saved copies follow those bookmarks;
  other edits and all exclusion preferences remain in memory. Exit returns to
  Vocabulary with selection preserved.
  No server persistence, grading API or new study rules are introduced.

- The owner-approved global color identity is green: `#3DD86D` primary with ink
  foregrounds, deeper green text/focus states and exact `#E7F9ED` public footer.
  Shared tokens, feature accents, all existing logo assets and bookmark animation
  colors use this palette. Semantic errors, wrong answers, hard difficulty and
  destructive actions retain red; success/warning, medal and external-brand colors
  retain their meaning. Routes, layouts, content and interaction/motion logic are unchanged.

- Public `/earn` ports all four sections of the supplied Claude creator-program
  HTML, with its Inter typography, CSS phone illustration, seven one-shot reveals
  (600ms, cyclic 70ms stagger, 0.12 threshold), 6s progress loop and commission
  tabs (180ms copy replacement within 250ms fade/slide transitions). Arrow keys,
  focus movement, reduced-motion styling and cleanup on navigation are preserved.
  It reuses `PublicSiteShell` unchanged in appearance; Footer and Sidebar Earn money
  both link to `/earn`. All page branding is lowercase `justprepy`. The source
  application URL remains empty: Apply scrolls to the provided unavailable-application
  message and configured official Telegram link. No application backend, assets
  or dependencies are added.

- Public `/what-is-nuet` ports the owner-supplied Claude HTML main content: all five
  sections, complete topic disclosures, official source links, Inter typography,
  responsive layouts and one-shot scroll reveals. It shares the exact existing
  public header/footer with Contact through `PublicSiteShell`; their layout and interactions are unchanged.
  The footer links to this route, Telegram reuses the configured official channel,
  and Start Practicing uses the existing Question Bank route `/`. Native disclosures
  work without JavaScript, and reveals support reduced motion and missing-observer
  fallback. No exam-content research, backend or dependencies are added.

- Public `/contact` follows the supplied compact header, three-channel contact-card
  grid and pale-green four-column footer. Its local styles preserve reference button
  proportions with the approved shared green palette. Header/footer share a
  reusable transparent PNG derived from the existing logo; the enclosed white `j`
  is preserved. Confirmed email, Telegram and TikTok destinations are centralized
  in `contact.config.ts`; the existing sidebar Contact us item links to the page.
  Unimplemented public and legal destinations show preview notices.
  No contact backend or email service is introduced.

- `/leaderboard` reuses the app shell, shared statistics cards, hover scaling and
  dialog behavior. Its cards follow the individual blue/green/brand-green references with
  lighter comparison pills; weekly change and population percentile labels are
  explicit demo fixtures, separate from the seven-row ranking sample. Main user
  metrics still derive from Question Bank fixtures and advancement from the preceding
  row. Top-three accuracy values share green pills; hard-solved counts are unboxed
  deep-green text. Updated/Reloaded and Refresh stay together across breakpoints. Refresh,
  Flame and Trending Up use official Lucide SVG geometry fetched together, with the
  ISC notice retained in `leaderboard-icons.tsx`; the supplied Figma source was
  inaccessible and separate SVG attachments were unavailable. Refresh reloads local
  fixtures only; detailed analytics remains an explicit preview boundary. No ranking
  backend or analytics infrastructure is implemented.

- `/mock-tests` reuses `PracticeShell` and the extracted shared `StatisticCard`; desktop/mobile navigation links to the catalogue with the correct active state. Typed illustrative test records drive completion/type filters, counts, recent-score statistics and full/sectional cards. Completed Analyze links open `/mock-tests/[testId]/results` for the matching completion timestamp. The Results page ports the supplied summary, section analytics, filters, placeholder review dialogs and reveal animations; semantic statistic cards reuse the shared style and compact section spacing. Mock Test #4 has owner-authorized, explicitly illustrative question/timing details consistent with its existing 211/240 result. Missing or invalid detailed records remain unavailable. Start and Retake retain unavailable-preview notices; no mock-test engine or persisted result service is implemented.

- `/practice` reuses the finalized sidebar and extracted header through `PracticeShell`. It provides passage/answers, an elapsed demo timer, per-question selections/bookmarks, demo-only checking, a difficulty/status navigator and a two-pane explanation dialog with isolated answer reveal. Failed evaluations remain retryable; first-attempt success is correct, success after a failed evaluation is partly correct, and unresolved failure remains wrong while selecting a retry. Both dialogs use the same session state; shared content/answer renderers support LaTeX-to-native-MathML and image parts. Topic previews link to it. The owner explicitly requested the existing sidebar/Telegram header here; this preview is an exception to the immersive-shell default, not a new mock-exam policy.
- Public `/login` and `/signup` auth previews share a responsive form shell, local validation, password visibility controls, and original SVG landscape. Authentication, Google, recovery and legal content remain explicitly unconnected; credentials are never transmitted or persisted.
- Compact/expanded membership promotion; account-only trigger morph and four-stage content reveal with reduced-motion support. Subscription actions open the shared plan modal.
- Green progress statistics, compact neutral filters, outlined navigation and circular play actions.
- Collapsed desktop rail with sidebar-owned pointer events, keyboard and touch alternatives; original monogram and full wordmark states.
- Anchored account menu; source panels positioned before first paint, resized to available space and updated on scroll.
- Functional status, saved, difficulty, source and draft/apply year filtering.
- Only Oxford and BMAT appear as independent source/year selectors. Applied years are preserved per source. Availability remains illustrative; underlying fixture contracts are unchanged.
- Topic progress and set previews derive from typed fixtures supplied through page props.
- Header Telegram CTA opens `https://t.me/justprepy` in a new tab. Statistics open fixture-derived summaries; topic actions retain previews. Subscription plans open in a modal; Settings/sign-out remain unavailable.

## Data boundary

`src/modules/questions/question-bank.fixtures.ts` holds temporary profile, sources,
year availability and question-summary data. `practice.fixtures.ts` separately holds three authored demo questions and illustrative local feedback; it is not published exam content or a production grading contract. No database, API, authentication service,
real-question integration, authoritative grading or persistent user data has been implemented. Unavailable
navigation opens an explicit preview limitation; Settings/sign-out remain disabled and checkout is unconnected.

## Local preview

The LAN previews at `192.168.1.2:3000` and `192.168.1.4:3000` are explicitly allowed in `next.config.ts`.
Next's dev HMR/debug transport otherwise rejects this origin and React hydration
stalls: native popovers open at fallback coordinates and React hover handlers do
not run. Keep this allowance scoped to the actual development hosts.

## Validation

Subscription plans are checked against all 145 ported reference CSS declarations,
all feature copy and unchanged shimmer keyframes. Desktop/tablet/mobile browser
checks cover the five existing triggers, spatial entrance/exit, focus cycling,
Escape/X, hover shimmer, internal scrolling and preserved underlying page state.
The 12 new lifecycle/integration tests include reduced motion and interrupted exits;
checkout remains explicitly unavailable.

Vocabulary practice browser checks at 1440/768/390/320px cover source flip/slide
motion, Space/arrow/1/2 controls, self-assessment, early/final completion, missed-only
redo, bookmark/Save All, browser reload persistence and Exit. Inspector permissions
and user exclusions remain enforced; the landing markup and computed styles match
the pre-task view. All 246 supplied main-content CSS declarations match after
selector/keyframe scoping; only the font family changes. No horizontal overflow
was found. The standalone HTML was compared as source; the integrated UI was
visually reviewed in the browser.

Creator-program source text matches completely after lowercase branding normalization;
all 194 main-content CSS declarations match the source after selector scoping and
keyframe namespacing. Browser review at desktop, 768px, 390px and 320px covers all four
sections, in-flight reveal/tab transitions, keyboard tabs, phone progress, hover
states, Apply anchor, both Earn money entry points and remount behavior. No page
horizontal overflow or production console errors were found. Shared CSS/assets
and all unrelated tracked files retain their pre-task hashes. The supplied HTML
reference is compared through code because browser policy blocks local file URLs.

NUET main-content text matches the supplied HTML except the owner-requested
removal of the 2015 specification note and link, verified through a complete
decoded-text hash check. Desktop browser review covers the hero, exam structure, native topic
disclosures with Enter/Space and visible focus, scroll-reveal timing, anchor CTAs,
the Start Practicing destination, shared preview dialog and footer/social links.
The unchanged Contact stylesheet hash is verified. The green migration was reviewed at desktop and 390px across all eight existing
routes: header/footer logos, exact footer background, filters, statistics, local
Refresh, bookmark animation, grading feedback, form validation and NUET disclosures.
No page-level horizontal overflow was found; wide tables remain locally scrollable.
A structured CSS comparison confirms all non-color declarations are unchanged;
logo checks preserve dimensions, alpha and every pixel outside the original red mask.
Bookmark timing and geometry are unchanged. Ink on primary green measures 9.50:1. The local HTML reference could
not be opened by browser policy and was compared through its supplied source.

Lint, typecheck, all 214 tests, changed-source formatting and the production build pass.
Contact layout, compact header controls, footer color treatment and transparent
logo were compared with the supplied reference; confirmed link destinations,
preview dialogs, keyboard focus and responsive containment were checked in-browser.
Leaderboard refinement was visually reviewed at 1440/768/390px: the three card
references, sourced Lucide icons, lighter comparison pills, grouped controls after
local refresh, top-three green accuracy pills and unboxed deep-green hard counts were
checked. Narrow 320px DOM measurements confirm no card or page overflow. Existing
statistics hover scaling and dialog keyboard/focus behavior remain intact. The
reduced-motion fallback is preserved; runtime media emulation was unavailable.
Practice browser checks cover repeated failed attempts, first-attempt success versus eventual partial success, richer navigator statuses, green switches, fully neutral review options with Show Answer off, circle-only feedback, navigator modes/jumps, retained answers, modal scrolling/dismissal/focus cycling, bookmarking, timer continuity and shared-sidebar hover. Desktop/tablet/mobile reviews include a 320px navigator; the updated review composition was inspected at 1440/768/390px. MathML/LaTeX and image rendering have focused regression coverage. Taste inspection passes at 1440/768/390px with zero failures or warnings; screenshots were reviewed.
Auth visual checks cover desktop, tablet and mobile; forms validate locally and use explicit preview feedback instead of account creation.
Browser checks cover desktop/tablet/mobile interactions and data states, including
320px layout, focus restoration and conditional years. Production console is clean.
Repository-wide formatting still flags nine pre-existing documentation files.

## Next / open decisions

Replace illustrative view data when authorized services are available. Real practice
sessions, Settings/sign-out, checkout and future navigation destinations remain unconnected.
Database/provider/ORM, authentication services and pipeline integration remain out of scope.
