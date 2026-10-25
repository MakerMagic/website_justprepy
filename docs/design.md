# JustPrepy — Visual & Interaction Design Specification

**Status:** Proposed v1 design system based on supplied desktop references and confirmed product context. **Authority:** visual language, interaction presentation, responsive behavior, and UI quality. This is a *target specification*, not a claim that the current website implements it.

## 1. How Codex must use this file

- Read this file for substantial UI design, new page, shared component, or visual refactoring work. For a small change, read the relevant section and existing component styles first.
- The current explicit user request may authorize a design change. Otherwise preserve this system and existing reusable patterns; do not invent a separate visual skin.
- `docs/DESIGN_SYSTEM.md` defines the implementation wrapper; **this file owns visual decisions**. `docs/FRONTEND.md` owns component/data boundaries, `docs/CONTENT_CONTRACT.md` owns educational content, and `docs/SECURITY.md` owns sensitive-state/answer exposure. Do not override them here.
- Implement tokens through the repository's existing styling mechanism; do not create parallel CSS/token systems. Screenshots are references, not pixel-perfect oracles.
- **Evidence labels:** **Observed** = visible in supplied references; **Inferred** = consistent interpretation; **Proposed** = recommended target not verified in a running product. Approximate values are design defaults pending confirmation from original Figma/CSS/assets.

## 2. Reference interpretation and chosen direction

| Reference | Keep | Refine / do not copy literally |
|---|---|---|
| Question Bank overview | Graphic sidebar, pale canvas, stat blocks, dark filter groups, subject progress cards | Replace placeholder text/data; keep filters accessible and data-driven |
| Account popover + Years | Compact raised panel, clear actions, selected-year grid, Apply/Clear | Define draft/apply semantics, focus, scrolling, mobile placement |
| Split question-solving screen | Large readable passage, question/answers, timer, bottom navigation | Remove marketing/sidebar distractions during active solving; do not reveal correctness early |
| Question navigator: difficulty/review | Number grid, colored categories, legend, jump navigation | Separate difficulty and review semantics; add current/focused state independent of color |
| Question review dialog | Question context, answers, explanation, previous/next controls | Use responsive dialog/full-screen treatment; only reveal answers when authorized |
| Mock Tests | Filter chips, full/sectional test cards, time/sections, result actions | Do not hardcode exam totals, grades, timing, or scores from mockups |
| Sign-up | Quiet form on left, atmospheric visual on right, single clear submit | Use actual licensed artwork; strong form validation/accessibility |
| Logo close-up | Red rounded-square `j` mark with black `ustprepy` wordmark | Preserve supplied asset/proportions; do not reconstruct a production logo from pixels |
| Timer + blue stat experiments | Strong numeric hierarchy, bordered timer capsule | Treat blue as exploratory; red/ink are canonical unless owner approves a palette change |

**Visual character (Observed/Inferred):** graphic/editorial, high-contrast, bold identity, generous whitespace around dense functional information. **Target:** one unified application, not a generic soft-shadow SaaS kit or a maximalist gaming UI.

**Non-negotiable UX intent:** the active question is visually dominant; peripheral marketing, subscription prompts, illustrations, and irrelevant navigation never compete with reading or answering.

## 3. Design tokens

All values below are **proposed implementation defaults** derived from screenshots unless marked as an observed characteristic. Do not mistake a screenshot-sampled value for an exact brand asset value. Centralize values in code and revise once primary source design tokens are available.

### 3.1 Color

| Semantic token | Value | Use |
|---|---|---|
| `color.brand` / `color.action-accent` | `#D91C23` | Accessible red filled controls, current nav/filter, brand-forward CTA |
| `color.accent-soft` | `#FEE2E2` | Selected/error tint; not the same as a solid active chip |
| `color.ink` | `#111827` | Main text, primary dark buttons, restrained dark panels |
| `color.ink-secondary` | `#303846` | Secondary dark surface |
| `color.text-muted` | `#667085` | Secondary readable labels (not tiny low-contrast gray) |
| `color.canvas` | `#F4F5F8` | Authenticated app background |
| `color.surface` | `#FFFFFF` | Cards, question content, overlays |
| `color.surface-subtle` | `#F0F2F6` | Tracks, quiet selected surfaces, skeletons |
| `color.border` | `#D7DAE0` | Standard card/input/option border |
| `color.success-text` / `color.success-bg` | `#166534` / `#DCFCE7` | Correct/easy/positive status |
| `color.warning-text` / `color.warning-bg` | `#92400E` / `#FEF3C7` | Partial/medium/warning status |
| `color.error-text` / `color.error-bg` | `#B91C1C` / `#FEE2E2` | Incorrect/hard/error status |
| `color.white` | `#FFFFFF` | Surfaces and text on adequately dark fills |

**Color rules**

- Use **filled red** for selected interactive controls and exceptional brand-forward CTAs; use **tinted semantic colors** for informational statuses. A `Wrong` *filter* is still an interactive filter, not a static wrong-answer badge.
- Default primary actions are ink; use accent red for one prominent action within a local action group. A strict “one red element per screen” rule does **not** apply to navigation and multiple selected filters.
- Preserve red as the primary product accent. **Do not introduce blue stat cards as a default brand system** from the exploratory example.
- Do not use pure black everywhere: the strong black outline is part of logo/navigation character, not a mandatory 2px frame around every card.
- Proposed white-on-`#D91C23` contrast is about **5.07:1**; muted `#667085` on white is about **4.97:1**. Recheck actual token implementations and every other foreground/background combination. Never rely on raw brand-red sampled from a screenshot for accessible button text.

### 3.2 Typography

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `type.display` | 36/44px | 700 | Marketing headlines only |
| `type.h1` | 28/36px | 700 | Page heading |
| `type.h2` | 20/28px | 650–700 | Section/dialog heading |
| `type.h3` | 16/24px | 600–700 | Card heading |
| `type.body` | 15/24px | 400 | Application UI |
| `type.reading` | 17/29px | 400 | Passages, question stems, explanation |
| `type.label` | 12/16px | 600 | Functional uppercase group labels |
| `type.caption` | 12/18px | 400–500 | Progress fractions, helper text |
| `type.stat` | 32–40px / 1.1 | 800 | Big stats/scores |

- **Typeface (Inferred):** one clear sans-serif family across product UI; the exact font is not identifiable from the references. Use the repository's approved font, otherwise a robust system sans until explicitly chosen. Do not introduce serif display headings.
- Numeric counters may use a pixel/digital-style numeral treatment **only** if an approved font/asset exists. Never substitute an arbitrary low-legibility font; fall back to heavy tabular numerals.
- Timer and question counters should use tabular numerals to prevent layout jumping.
- Reading columns target **60–75 characters per line**, typically no wider than `680px`; don't stretch passages edge-to-edge on large screens.
- Uppercase labels (`PRACTICE`, `EXTRA`, `DIFFICULTY`, `ACCOUNT`) are for **real groups**, not decorative eyebrow text. Avoid coloring single words in ordinary headlines for emphasis.

### 3.3 Space, dimensions, surfaces

| Token / pattern | Value | Use |
|---|---|---|
| Spacing scale | `4, 8, 12, 16, 24, 32, 48, 64px` | Layout and component rhythm |
| `radius.xs` | `8px` | Small fields/chips |
| `radius.sm` | `10px` | Buttons, answer rows |
| `radius.md` | `14px` | Cards and panels |
| `radius.lg` | `20px` | Dialogs, large containers |
| `radius.pill` | `9999px` | Pills, avatars, timer |
| `border.flat` | `1px solid color.border` | Ordinary content cards |
| `shadow.raised` | `0 8px 24px rgba(17,24,39,.12)` | Popovers/dialogs/floating panels only |
| Sidebar width | `240–260px` | Desktop application shell |
| Content max width | `1200px` | Authenticated overview screens |
| Marketing content max | `960px` | Public pages, excluding intentional full-width media |
| Reading max width | `680px` | Sustained text/explanation |
| Desktop/tablet/mobile | `>=1024 / 640–1023 / <640px` | Proposed layout breakpoints |

- **Flat** surface: white, 1px neutral border, no shadow. For category cards, mock cards, stats when not deliberately accented.
- **Raised** surface: white, 1px border and one soft shadow. For dropdowns, popovers, dialogs; never scatter shadows over ordinary content cards.
- **Ink panel:** intentionally dark, high-contrast grouping (e.g. filter group or premium panel), used selectively rather than as every content container.
- The bold, black-bordered **sidebar/nav treatment** is a deliberate identity exception; preserve it without imposing heavy outlines on passage/reading surfaces.
- Use a small, consistent stacking system: sticky chrome < popovers < modal/backdrop < notifications. Do not add arbitrary competing `z-index` values.

## 4. Layout families

### 4.1 Authenticated product overview

**Observed desktop:** fixed left sidebar + slim top header + pale content canvas + white section surfaces. Main panel typically contains a page heading, optional metrics/filter area, then a grid/list.

- Desktop sidebar: logo → PRACTICE links → EXTRA links → lower account/social/subscription content when relevant.
- Preserve active red nav pill and high-contrast outlines for inactive navigation, but avoid redundant branding/promo blocks.
- The top header provides section context. A community CTA may appear on browsing/marketing surfaces, **not during active examination work**.
- Header content and page headings must not compete: avoid large duplicated titles.
- Use functional section whitespace rather than decorative dividers everywhere.

### 4.2 Immersive solving (deliberate exception)

**Observed:** passage-left / question-right desktop split with timer and bottom actions. **Proposed correction:** during active practice/mock solving, suppress persistent sidebar, marketing CTA, social tiles, and subscription promotion. Use only a compact top bar for exit/context/timer/bookmark where allowed.

- Passage-containing question: left reading pane and right question/answers pane; proportion guided by content, not rigid screenshot pixels.
- Passage-free/math-heavy question: allow a wider single main content column; do not reserve empty passage space.
- Actions/navigation remain predictable and accessible without obscuring content.
- Preserve context when showing explanations or moving between questions.

### 4.3 Marketing and authentication

- Marketing: restrained header, centered content, consistent brand CTAs. Do not transform it into an authenticated dashboard.
- Authentication (Observed): left form, right atmospheric landscape artwork on desktop. On narrow screens prioritize the form and omit decorative artwork.
- Original landscape imagery is only a reference; require an owned/licensed approved asset before production use. Do not fabricate a matching asset claim.

## 5. Reusable component standards

| Component | Anatomy and visual behavior | Interaction and restrictions |
|---|---|---|
| Button | `Primary` ink, `Accent` red, `Secondary` outline, `Ghost` quiet; 44px desktop / 48px mobile min height, radius.sm | Distinct disabled/loading/focus states; no decorative arrow appended by default |
| Sidebar nav item | Icon + label, strong outline; selected red filled | Keyboard accessible, current-page semantic state; active and hovered distinct |
| Filter chip | Compact pill/rounded control, neutral outline unselected, filled red selected | Multiple selections permitted where model allows; label + selected state programmatic |
| Status badge | Soft semantic tint with text/icon | Non-interactive; not visually identical to a filter |
| Flat card | Heading, optional metadata, content, optional actions | No default drop shadow; whole-card clickable only if semantically one action |
| Raised panel | Heading/close where appropriate, content, optional footer actions | Focus/dismissal/scroll management; anchored within viewport |
| Progress bar | Neutral track, consistent fill, number/fraction label | Never imply progress when denominator unknown; accessible value/label |
| Stat card | Large number + short metric caption; optional understated graphic motif | Red variant is canonical; do not hardcode sample numbers |
| Text field | Label, optional icon, neutral border, clear error/helper | Real label association, accessible error, visible focus |
| Account popover | Account label, nickname, optional status, settings/subscription, separated sign-out | No hardcoded `PRO`; escape/outside dismiss, keyboard control, mobile-safe layout |
| Modal/dialog | Raised panel, visible heading and close; content scrolls as needed | Trap/manage focus, restore trigger focus, block unintended background interaction |

**Buttons:** Use `Primary` for ordinary confirmation/check/continue, `Accent` for especially salient start/upgrade/retake/community actions, and `Secondary` for back/analyze/cancel. Context and hierarchy override pixel-for-pixel copying of conflicting screenshot buttons.

**States for interactive components:** default, hover (subtle tint/border), visible keyboard focus, pressed, selected (when applicable), disabled, loading, error, and success. Never encode a status only as a hue. Do not implement hover-only essential behavior.

## 6. Screen-specific contracts

### 6.1 Question Bank overview

**Observed:** heading/description, solved and accuracy metrics, black filter-group containers, subject cards for Critical Thinking, Problem Solving, Mathematics, and subcategory progress rows.

- Preserve subject-card hierarchy: title + start/continue affordance → overall progress → subcategory rows with label, progress and navigational cue.
- Desktop 3 columns, tablet 2, mobile 1. A card's height follows its content, not a forced equal-height blank filler.
- The number of subjects, categories, rows, counts, and percentages comes from application data; screenshots are example content only.
- Long topic titles wrap. Keep progress numbers aligned without truncating essential labels.
- Filter groups contain **Question Status**, **Sources**, **Difficulty**; **Years** appears as a separate selector reference. Do not assume this is the exhaustive future filter set.
- `Saved` is an independent user-specific filter, not a correctness state. Display multi-filter selections consistently.
- Empty filtered result: explain there are no matches and provide a clear filter-reset affordance.

### 6.2 Years multi-select popover

**Observed anatomy:** Years title + calendar icon; close and Apply; selected count; Select All/Clear; scrollable year grid with selected red controls and checkmarks.

**Proposed interaction contract:** selected values are edited as a draft until **Apply**. Clear and Select All edit the draft; closing without Apply discards changes. The selected-count label reflects the draft. Available years are data-driven, not a hardcoded 2004–2024 sequence.

- Within the panel, scrolling must not hide heading/Apply controls.
- Anchored popover on desktop; dialog/bottom sheet on narrow viewports.
- Escape/close behavior is predictable; focus is restored to trigger.
- Provide programmatic selected states and keyboard navigation.

### 6.3 Question answer options

**Observed:** white rounded answer rows, thin border, letter-in-circle marker, multiline answer text; references include A–E.

- The full row is the hit target; letter, text, math, and image belong to the same selectable control.
- Variable option count and order; letter is presentation, not persistent option identity.
- **Before grading:** neutral → selected with red border/tint and visible marker. **Do not show correct/incorrect feedback while answers must remain hidden.**
- **After authorized grading:** correct option uses green-tint label/border, student's wrong selection uses red-tint label/border, partial result (if supported by assessment) uses warning treatment. Show explicit text/symbol, not hue alone.
- During timed mock mode, answer reveal and explanation follow exam-state permissions; visual reference is not authorization.
- Never crop math, images, or long options merely to maintain a fixed card height.

### 6.4 Question-solving toolbar and navigation

**Observed:** compact exit, timer capsule, bookmark, topic/difficulty context, bottom Explanation, previous/next, question counter, Check action.

- Top bar displays only essential exam controls; sticky if helpful but must not block reading.
- Timer: outlined capsule, readable tabular numbers, not a tiny caption. Avoid blinking or second-by-second screen-reader announcements. **Proposed:** quiet time warning near the final 10% when actual timed policy exists; threshold is not a NUET rule.
- Bottom actions form three groups: explanation/review when permitted, question navigation, and checking/submission. Reflow on mobile; no overlapping fixed controls.
- Disabled/blocked navigation must be explicit. Question counter is current/total from session data, not a static screenshot value.
- Do not assume whether navigating away saves, auto-submits, or loses drafts: follow the established session policy.

### 6.5 Question Navigator

**Observed:** numbered grid with a close control, "Show Difficulty" toggle, and legend; two visual contexts are illustrated.

- **Difficulty view:** semantic Easy (green), Medium (amber), Hard (red) classifications, only when that data is available and permitted to show.
- **Review view:** Correct (green), Partly correct (amber), Wrong (red), with neutral/unanswered states when appropriate. These are *outcomes*, not difficulty.
- Display a visible current-question outline/marker independent of state color. Support keyboard movement/activation and an accessible text legend.
- Use number-of-questions-driven grid, not a hardcoded 65-question layout.
- On mobile allow the grid within a full-screen dialog and vertical scrolling; avoid tiny touch targets.
- "Show Difficulty" controls difficulty-color visibility where applicable; it must not silently switch between pre-grading and post-grading contexts.
- Never reveal grading outcome through navigator color while a mock run prohibits feedback.

### 6.6 Question Review + Explanation

**Observed:** centered wide review overlay with question number, section/difficulty metadata, previous/next, close, "Show Answer", passage/question/answer content, explanation pane and source identifier.

- Desktop: content on left, explanation on right; mobile: stacked/full-screen review. Preserve the complete question context.
- The question and explanation should each scroll only if necessary; avoid confusing nested scrolling and hidden action controls.
- `Show Answer` appears only if the session's answer-release policy allows it. Do not infer permission from the mockup.
- Explanation text uses reading typography and supports MathML/assets where supplied.
- Show content/source identifier only if available from real data. Do not fabricate provenance IDs.
- Make close, previous/next, and focus-return behavior predictable; background dimming must preserve modal contrast.

### 6.7 Mock Tests catalogue

**Observed:** headline stats, filter chips, test cards with Full Simulation/Sectional Focus, subject statuses, duration, number of questions, attempts/score, Start/Analyze/Retake.

- Reuse Flat card anatomy, badges, and buttons. Distinguish test type, section inclusion, activity status, and actual result.
- Display counts, timing, score maximum, availability, and results only when provided by trusted product data. The mockup's `120 mins`, `60 questions`, and `/240` are not exam-policy specifications.
- Missing result is not numeric zero. Completed test cards may show score and actions; unattempted cards show available start actions.
- Filter chips reflect actual filter state and remain usable on narrow screens without tiny targets.
- Avoid excessive stat cards or gamification.

### 6.8 Authentication

**Observed:** quiet two-column sign-up; form labels; federated sign-in control; email, username, password/confirmation; terms checkbox; strong red submission; atmospheric right illustration.

- Preserve a clear form hierarchy and readable validation/help messages.
- Actual sign-in methods/required fields are product/security decisions, **not established by the screenshot**. Do not implement Google sign-in or terms behavior solely because they appear in the reference.
- Mobile prioritizes form, hides decorative image, and maintains visible CTA and accessible controls.

### 6.9 Account, stats, analytics, vocabulary, and other future screens

- Account: anchored Raised menu shown in reference; account status from data, never hardcoded.
- Stats: large label-paired numbers and calm progress bars. The **red** statistic treatment is the default; the blue example is not a second design system.
- Analytics (when implemented): prioritize useful labeled comparisons, readable chart legends, and restrained semantic color; no 3D charts or dashboard wall of KPI widgets.
- Vocabulary/leaderboard/profile (when implemented): inherit the product shell, typography, cards, and state conventions. Do not invent separate branded experiences without owner approval.

## 7. Educational content presentation

- Content may interleave text, lists, **native MathML**, and image/diagram references. Preserve the published sequence; see `docs/CONTENT_CONTRACT.md`.
- Render validated MathML in-line or display according to content semantics. **Do not add KaTeX/MathJax, convert formulas into images, or reinterpret LaTeX without an approved content-contract change.**
- Long inline/display formulas must remain readable; use contained horizontal overflow for exceptionally wide equations, never page-wide overflow or arbitrary downscaling to illegibility.
- Preserve image/diagram aspect ratio. Use `contain`, not destructive cropping, for question/answer assets. Allow enlarging essential diagrams where a safe implementation exists.
- Do not shrink answer-option content to caption-size just to fit one line. Rows grow vertically.
- Passage, prompt, and explanation use `type.reading`; metadata uses `type.caption`.
- Render missing/invalid essential content as a clear controlled error; never silently rewrite a mathematical statement or hide an option.
- MathML interaction/screen-reader support should be evaluated in target browsers and assistive technologies; do not claim a11y solely because MathML is semantic.

## 8. Responsive behavior

**Only desktop references were supplied; the rules below are proposed.** Test at narrow mobile (approximately 360px), larger mobile, tablet, desktop, and zoomed text.

| Element | Desktop `>=1024` | Tablet `640–1023` | Mobile `<640` |
|---|---|---|---|
| App navigation | Sidebar 240–260px | Compact sidebar/drawer | Accessible drawer; don't force full sidebar |
| Subject/mock grid | 3 columns | 2 columns | 1 column |
| Reading + question | Split when passage exists | Split if content remains readable, else stack | Stack: passage then question; optional explicit collapse for very long passages |
| Filter groups | Multi-column as space allows | Wrap/stack | Vertical groups; chip wrapping |
| Years selector | Anchored popover | Viewport-contained popover/dialog | Sheet/full-screen dialog with scrollable options |
| Review dialog | Two-pane modal | Adapt pane widths | Full-screen or stacked sheet |
| Answer/navigation controls | Full row and bottom controls | Reflow without overlap | Full-width accessible answers; actions wrap or stack |
| Auth page | Form + approved imagery | Reduced image area | Form only |

- For mobile, maintain minimum **44×44px** interactive hit targets (48px preferred for principal actions).
- Keep font size for question/passage readable; reduce display headings before reducing reading text.
- Never allow a card, image, graph, modal, or MathML block to force horizontal scrolling on the overall page. Local scrolling is acceptable only for inherently wide content with a visible affordance.
- Use safe-area insets for sticky controls when applicable. Avoid hidden bottom actions behind mobile browser chrome/keyboards.
- Do not infer responsive behavior from scaled-down desktop screenshots.

## 9. Accessibility and interaction behavior

- Meet WCAG 2.2 AA as an implementation target where applicable; verify actual rendered contrast, keyboard flows, and focus handling. Body text >=4.5:1, large text/UI indicators >=3:1 as applicable.
- Use real buttons, links, fields, radio/checkbox semantics, labels, and grouped answer controls. Avoid click-handled generic `<div>` controls.
- Visible focus indicator: proposed 2px red outline with 2px offset; verify contrast against the actual adjacent surfaces.
- Communicate selected, saved, answered, correct, incorrect, difficulty, and disabled states via text/shape/icon/semantics in addition to color.
- Dialogs/popovers require accessible names, Escape behavior when safe, focus placement/restoration, and scroll containment.
- Errors describe recovery; loading is announced appropriately without excessive live updates; prevent duplicate submissions.
- Important content is accessible without hover. Do not hide essential scores or labels in tooltips only.
- Use actual relevant alt text for meaningful illustrations/diagrams when provided; decorative graphics are hidden from assistive technologies. Do not fabricate educational image descriptions.
- Respect `prefers-reduced-motion`, browser zoom, and text scaling. No motion or effects that hinder timed reading.

## 10. Feedback and motion

| State | Presentation |
|---|---|
| Hover | Subtle background/border shift; never scale an answer row |
| Keyboard focus | Strong visible focus ring, no layout jump |
| Pressed | Slight surface darkening, immediate response |
| Selected | Explicit marker plus active control treatment; separate from correctness |
| Disabled | Muted treatment plus semantic disabled state; not color-only |
| Loading | Shape-stable skeleton/spinner with status; no label/width jump |
| Empty | Clear statement and relevant action; no forced illustration in solving mode |
| Error | Specific readable message and recovery, not generic red surface |
| Success | Brief restrained acknowledgement where needed; no confetti for routine answers |
| Review result | Semantic tint + explicit label; only after authorized grading |

**Motion defaults (Proposed):** ~120–160ms for small hover/selection changes, ~200–240ms for panels/dialogs with non-elastic easing. No continuous animation, staggered page-load effects, or bounce. Reduced-motion preference removes nonessential animation.

## 11. Icons, imagery, and content fidelity

- Prefer a consistent simple geometric icon family; do not mix multiple stroke weights and clip-art styles.
- Social icons may retain their recognizable identities but should not dominate academic workflows.
- Use the supplied logo artwork if a repository asset exists; the screenshots alone do **not** supply a verified editable vector or original font. Request an original asset before redrawing, exporting, or rebranding.
- Promotional illustrations belong to public/low-density surfaces, not active question/answer areas.
- Use source-approved imagery with correct licensing; do not treat a screenshot's scenic auth illustration as a production asset.
- Screenshot texts, student names, timers, scores, source labels, and year grids are examples, not production content constants.

## 12. Anti-patterns and design-change policy

**MUST NOT:**

- Recreate screens pixel-for-pixel including placeholder labels, mismatched spacing, or inaccessible components.
- Use gradients, blue stat variants, glassmorphism, arbitrary accent colors, heavy shadows on static cards, or oversized decorative UI as automatic defaults.
- Mix filled interactive chips with indistinguishable static status badges.
- Show correct answers, grading, or explanation earlier than allowed by assessment state.
- Keep subscription upsells/social promotions visible during focused solving.
- Convert mathematics to image assets, stretch diagrams, truncate answer choices, or force a four-option layout.
- Hardcode year lists, difficulty labels, scores, category counts, exact exam times, or credentials from screenshots.
- Create a different card/button/navigation system for every page.

When a new reference conflicts with this spec:

1. Identify whether it shows a component state, page-specific exception, an experiment, or a genuine change request.
2. Preserve established tokens and patterns by default.
3. If the user explicitly approves a visual change, update this document and affected tokens/components together.
4. Do not silently apply a new skin to unrelated screens.

G.17 Data-Driven UI and Edge Cases
All Question Bank and statistics components must support realistic data variations.

## 13. Codex implementation and QA checklist

For any substantial UI task:

1. Identify page family: **overview / solving / review / marketing / auth**.
2. Inspect existing components/tokens. Reuse before introducing a new primitive.
3. Apply only the relevant sections of this file; don't invent unsupported visual values or exam rules.
4. Verify all reachable states: default, selected, hover/focus, loading, empty, error, authorized feedback, disabled.
5. Test long text, rich MathML, variable option counts, missing assets, and responsive overflow where relevant.
6. Confirm contrast, keyboard navigation, focus/dismissal, hit areas, reduced motion, and semantic status communication.
7. Review at desktop, tablet, and mobile widths when tooling is available; report untested viewports honestly.
8. Ensure active solving stays free of promotional distractions and answer leaks.
9. Limit changes to requested screens/shared components; inspect for visual regression in other consumers of shared tokens.
10. Treat this as the visual specification, not authority to alter backend contracts, grading policies, or architectural ownership.

**Open items needing primary-source confirmation:** official logo/vector and font; exact sampled brand values; availability of approved auth illustration; actual mobile designs; precise timed-test UX policy; category data and source taxonomies. These do not justify inventing backend behavior or declaring the screenshots implemented.
