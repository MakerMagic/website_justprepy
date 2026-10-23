# justprepy — Design System (`design.md`)

Version 1.0 — synthesized from existing product screenshots, `design_audit.md`, `design_audit_summary.md`, professional frontend-design principles, and product-owner preferences. This document defines the **intended, improved** justprepy design — not a catalog of problems.

---

## A. Purpose and Agent Usage

This file is the **authoritative frontend design specification** for justprepy, an EdTech platform preparing students (16–19) for the NUET entrance exam.

- Any coding agent (Codex, Claude, or other) implementing or modifying justprepy frontend UI **MUST** consult this document first and follow it over ad-hoc judgment.
- This document defines *what to build*. It does not assume a specific framework; apply its rules using whatever component system, CSS approach, or design-token mechanism the actual repository uses. If the repository already has a token file or component library, **implement these rules inside that existing system** rather than creating a parallel one.
- When a needed UI case is **not** explicitly covered here, the agent **MUST** derive it from the nearest documented pattern (same component family, same page type, same information hierarchy) rather than inventing a new visual style. If no reasonable derivation exists, the agent **SHOULD** flag it for product-owner decision instead of guessing.
- Agents **MUST NOT** make unrelated visual changes while implementing a feature (e.g., don't restyle a card while fixing a button). Scope changes to what was requested, using this document as the shared contract.
- Where this document says a value is "established" or "canonical," treat it as fixed. Where it says "approximate, pending source confirmation," treat it as a strong default that should be reconciled with real design files/CSS if they become available, not silently reinvented each time.

---

## B. Core Design Principles

1. **Clarity before decoration.** Every visual choice must help a student understand what to read, what to click, or what to do next. Decoration that does not serve comprehension is not added.
2. **Calm by default, bold on purpose.** Most of the interface (surfaces, neutrals, structure) stays quiet so that the brand red and key data remain meaningful when they appear. Red is a signal, not a theme.
3. **Concentration is sacred during active solving.** The Question Bank practice screen and Mock Test question screen are the lowest-noise surfaces in the product. Nothing competes with the question there.
4. **Richness is earned elsewhere.** Dashboard/Home, Analytics, Vocabulary, Leaderboard, Profile, Subscription, and marketing/onboarding pages may be visually expressive — custom graphics, elegant composition, subtle motion — as long as it stays coherent and functional.
5. **Premium = precision, not embellishment.** The premium feel comes from exact spacing, a disciplined type scale, consistent components, and considered micro-interaction — never from gradients, glassmorphism, excess shadow, or ornamental icons.
6. **One system, not two.** justprepy currently shows two competing visual "skins" (heavy black-stroke flat cards vs. soft-shadow cards) and two competing CTA colors (red vs. black) across different pages. This document resolves both into one coherent system (see §D, §G).
7. **Distinctiveness over templates.** justprepy's bold black-stroke, high-contrast, pill-based graphic language is a real, distinctive identity — closer to an editorial/poster aesthetic than a generic "SaaS card kit." This document refines it; it does not replace it with generic rounded-card-plus-soft-shadow conventions.
8. **Respect the exam's seriousness.** Youthful and motivating, never childish, cartoonish, or over-gamified.

---

## C. Brand Identity

- **Logo:** The existing "J" mark in a rounded-square red container, paired with the wordmark "justprepy" (lowercase "j" styled as the icon, remaining letters in the primary UI typeface). **No standalone vector logo file was supplied with this project.** Agents **MUST NOT** redraw, recolor, or reconstruct the logo from screenshots. Treat the current logo lockup as fixed and request the source vector asset before any task that requires exporting or resizing it beyond what is already visible in existing screens.
- **Visual character:** Confident, high-contrast, slightly graphic/editorial — black strokes, solid fills, large bold numerals for stats, generous use of white space around content blocks. This is justprepy's actual differentiator and **MUST** be preserved, not softened into a generic SaaS look.
- **Brand color (Signal Red):** The single accent color. **MUST** be used selectively — see §D and §G.5 for exact rules. **MUST NOT** be applied to every button, border, icon, or decorative element "because it's the brand color."
- **Backgrounds:** Light neutral (off-white/light gray) for the app shell; pure white for content surfaces; near-black ("Ink") reserved for a small number of deliberately dark surfaces (premium upgrade panel, dark pricing tier, footer) — not as a default background.
- **Prohibited stylistic departures:** No warm cream + serif + terracotta aesthetic, no neon-on-black aesthetic, no broadsheet/hairline newspaper layout, no identical-rounded-card-with-soft-grey-shadow treatment applied uniformly regardless of hierarchy, no decorative gradients as a default surface treatment, no tracked-out ALL-CAPS "eyebrow" labels added purely for flavor (see §N — note this is distinct from justprepy's existing *functional* uppercase section labels, which are preserved; see §E).

---

## D. Design Tokens

Values marked **(established)** are newly standardized by this document to resolve documented inconsistencies. Values marked **(approximate, sampled)** are derived from visual/pixel sampling of the supplied screenshots and should be reconciled against real source files (Figma tokens or CSS) when available — treat as a strong starting point, not an exact legal spec.

### Color — Primitives

| Token | Approx. value | Role |
|---|---|---|
| `color.red.600` (Signal Red / brand) | `#E2413E` *(approximate, sampled)* | Brand accent, primary interactive/selection red |
| `color.red.100` | `#FBE4E3` *(established)* | Light tint for red status badges (e.g. "Hard," "Incorrect") |
| `color.ink.900` | `#111317` *(established)* | Primary text, dark UI surfaces |
| `color.ink.700` | `#30333B` *(established)* | Secondary dark UI surface (e.g. dark cards) |
| `color.black.pure` | `#000000` *(observed)* | Reserved for logo mark and the sidebar/page-frame hairline strokes only |
| `color.neutral.50` | `#F4F5F8` *(approximate, sampled)* | App shell background |
| `color.neutral.100` | `#ECEEF2` *(established)* | Subtle fills (inactive track, disabled bg) |
| `color.neutral.300` | `#D7DAE0` *(established)* | Default border |
| `color.neutral.500` | `#8A8F99` *(established)* | Secondary/meta text |
| `color.white` | `#FFFFFF` | Content surfaces, cards |
| `color.green.600` | `#1E9E5A` *(established)* | Success / Correct / Easy |
| `color.green.100` | `#E1F6EA` *(established)* | Light tint for green status badges |
| `color.amber.600` | `#C9830A` *(established)* | Warning / Partial / Medium |
| `color.amber.100` | `#FBF0DA` *(established)* | Light tint for amber status badges |

**Rule:** No component introduces a new one-off color outside this table. If a new need arises, pick the closest existing semantic token before proposing a new primitive.

### Color — Semantic usage (resolves audit F-01 / C-1 / C-3)

The core fix: **color meaning is now carried by component style (filled vs. tinted), not by hue alone.**

- **Interactive / selectable** (nav items, filter chips, selected answer, tabs): solid filled `color.red.600` when active, white/outline with `color.neutral.300` border when inactive. This is the *only* place a solid red fill appears.
- **Status / severity, non-interactive** (difficulty tag, correctness marker, section score bar): tinted background (`*.100`) + matching `*.600` text/icon. **MUST NOT** use a solid filled pill identical to the interactive style — this is what previously made "selected" and "hard/wrong" visually indistinguishable.
- **Difficulty:** Easy → green tint, Medium → amber tint, Hard → red tint.
- **Correctness:** Correct → green tint, Partial → amber tint, Incorrect → red tint, Omitted → neutral tint.

### Typography

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `type.display` | 36 / 44 *(est.)* | Bold | Marketing hero headline only |
| `type.h1` | 28 / 36 | Bold | Page titles ("Question bank," "Mock Tests," "Settings") |
| `type.h2` | 20 / 28 | Semibold | Section/card titles |
| `type.h3` | 16 / 24 | Semibold | Subsection titles |
| `type.body` | 15 / 24 | Regular | Default UI text |
| `type.body-reading` | 17 / 30 | Regular | Passages, question stems, explanations — wider line-height for sustained reading |
| `type.label` | 12 / 16, tracked +0.04em | Semibold, uppercase | **Functional** group/section labels only (see §E) |
| `type.caption` | 12 / 16 | Regular | Meta text (progress fractions, timestamps) |
| `type.stat` | 32–40 / 1.1 | Extrabold | Big numbers (score, accuracy, stat badges) |

**Font family:** One sans-serif family for the entire product (display, UI, body) — consistent with the existing identity and avoiding the generic "serif display + sans body" AI pattern. If two weights of personality are needed, use weight/size, not a second typeface.

**Line length:** Passage and explanation text **MUST** target under ~75 characters per line at default width; constrain the reading column rather than letting it stretch edge-to-edge.

### Spacing

Base unit: **4px**. Scale: `4, 8, 12, 16, 24, 32, 48, 64`.
- Component-internal padding: 12–16 (compact) / 16–24 (cards).
- Section-to-section vertical rhythm: 24–32.
- Page margins: 24 (mobile) / 32–48 (desktop).

### Radius (established — resolves audit inconsistency)

| Token | Value | Use |
|---|---|---|
| `radius.xs` | 8px | Inputs, small chips |
| `radius.sm` | 10px | Buttons |
| `radius.md` | 14px | Cards, panels |
| `radius.lg` | 20px | Large hero/section containers, modals |
| `radius.full` | 9999px | Pills, avatars, nav items |

### Borders & Elevation (resolves audit C-2 / F-03 — the "two skins" problem)

Two elevation tiers only. Do not introduce a third.

- **Flat** (default, for in-page cards: dashboard cards, mock-test cards, question-bank category cards): 1px `color.neutral.300` border, **no drop shadow**. This replaces the old heavy 2px black stroke with a lighter, more precise line while keeping the graphic, outlined identity.
- **Raised** (for anything floating above content: modals, dropdowns, the sidebar subscription panel, tooltips): 1px border + a single soft shadow `0 8px 24px rgba(17,19,23,0.12)`. Shadows **MUST NOT** appear on static flat cards — reserving shadow for true elevation keeps the interface calm and prevents the generic "every card has a shadow" SaaS-kit look.

### Breakpoints (established — not previously documented)

| Token | Range |
|---|---|
| `bp.mobile` | < 640px |
| `bp.tablet` | 640–1023px |
| `bp.desktop` | ≥ 1024px |

### Container widths

- App content max-width: 1200px, centered, with page margin per §Spacing.
- Reading column (passages/explanations): max 680px.
- Marketing page content: max 960px, centered.

---

## E. Typography — Usage Rules

- **Uppercase group labels are preserved as a justprepy pattern** ("PRACTICE," "EXTRA," "DIFFICULTY," "ACCOUNT," "QUESTION STATUS") — these are *functional section headers*, not decorative eyebrows, and audit evidence shows they are one of the product's strongest, most consistent primitives. **MUST** continue using `type.label` for this exact purpose: grouping a cluster of related controls or fields.
- **MUST NOT** add *new* uppercase labels purely for visual flavor above content that doesn't need grouping (e.g., don't add an uppercase tag above a single stat or a single paragraph just to look structured). This is the specific AI-slop pattern being avoided — the rule is about new decorative use, not the existing functional convention.
- Page titles (`type.h1`) are left-aligned, bold, and set directly above their supporting description line — matches existing pattern (e.g., "Question bank" + "You can use different filters...").
- Big stat numbers (`type.stat`) always pair with a small caption beneath (e.g., "236" + "Questions Solved") — never shown without their label.
- Passage, question-stem, and explanation text always use `type.body-reading`, never `type.body` — the extra line-height is required for sustained exam-prep reading.
- **MUST NOT** bold or color a single word within a sentence/headline for emphasis (e.g., don't make one word of a headline red or italic). Use a full phrase, a separate stat callout, or a supporting line instead.

---

## F. Layout and Spacing

- **App shell:** fixed-width left sidebar (≈240–260px) + fluid content area, `color.neutral.50` background, content rendered in white `Flat` cards. This pattern is preserved for all authenticated app pages (Question Bank, Mock Tests, Settings, Leaderboard, Analytics, Vocabulary).
- **Card grids:** 3-column grid on desktop for category/test cards, wrapping to a partial final row (not centering/padding it out artificially). On tablet, reduce to 2 columns; on mobile, stack to 1 column (see §I).
- **Practice/solving layout:** two-column split (passage/content left, question+answers right) on desktop and tablet-landscape; stacks vertically (passage above, question below) on mobile and tablet-portrait, passage collapsible if long (see §H).
- **Marketing pages:** centered, single-column, max 960px, top nav bar with pill nav links + two CTA buttons — this exact template is already consistent across the two marketing pages observed and **MUST** be reused for any new marketing/landing page rather than invented freshly.
- **Auth pages:** two-column split (form left, illustrative image right on desktop), already consistent between Sign Up and Log In — reuse as the canonical auth template; stacks to form-only (image hidden) on mobile.

---

## G. Component Specifications

### G.1 Buttons (resolves audit F-02 / C-1 / C-4)

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| **Primary (Ink)** | `color.ink.900` | white | none | Default primary action on most screens: Log in, Get Started, Save Changes, Apply, Continue, generic confirmations. |
| **Accent (Red)** | `color.red.600` | white | none | Reserved for the single highest-value, brand-forward action per screen: Start Test / Resume, Subscribe / Upgrade, Retake, a primary community CTA (e.g. "Join Telegram"). At most one Accent button visible per screen. |
| **Secondary (Outline)** | transparent | `color.ink.900` | 1px `color.neutral.300` | Supporting actions: Analyze, Back, Cancel. |
| **Ghost** | transparent | `color.ink.900` | none | Low-emphasis/tertiary actions, inline links-as-buttons. |

- All buttons: `radius.sm`, height 44px (desktop/tablet) / 48px (mobile, touch target), horizontal padding 20px, `type.body` semibold.
- **MUST** use one height per variant across the entire product — this directly resolves the previously inconsistent button heights/paddings.
- Disabled state: 40% opacity on fill/text, no shadow, not clickable (`cursor: not-allowed`).

> **Resolved conflict with audit recommendation:** `design_audit.md` suggested standardizing all primary CTAs on red. Given the explicit product-owner requirement to avoid red overuse, this document instead makes **Ink the default primary** and reserves **red for a small, meaningful set of brand-forward actions**. This satisfies the audit's actual goal (one consistent, predictable CTA system) while better matching the stated preference. See final chat response for this noted explicitly.

### G.2 Filter chips / Tags (interactive)

- Pill shape (`radius.full`), 1px `color.neutral.300` border, white fill when inactive; `color.red.600` fill + white text + no border when active/selected.
- Used exclusively for things the user can toggle (filters, tabs, selected answer option indicator). **MUST NOT** be used to display non-interactive status (use Status Badge, G.3, instead).

### G.3 Status badges (non-interactive — resolves C-3/F-01)

- Pill or rounded-rect (`radius.xs`–`radius.full` depending on context), tinted background (`*.100`) + `*.600` text, small icon optional.
- Used for: difficulty tag, correctness tag, "Excluded," "Coming soon," "PRO," "Official Channel."
- **MUST NOT** be filled solid in the interactive-chip style.

### G.4 Cards

- Single `Flat` card system (§D Elevation) for all in-page content cards: dashboard category cards, mock-test cards, question-bank cards.
- Standard anatomy: title (`type.h2`) + optional meta line (`type.caption`) + content + optional footer action.
- `radius.md`, internal padding 20–24px.
- `Raised` tier used only for modals/dropdowns/floating panels (§D).

### G.5 Sidebar / Navigation (resolves preference: premium upgrade panel)

- Structure preserved: logo → grouped nav sections under `type.label` headers ("PRACTICE," "EXTRA") → social/community links → account/profile access → subscription panel at the bottom.
- Nav items: pill (`radius.full`), active = `color.red.600` fill + white text (the primary legitimate use of a filled red pill in navigation); inactive = white + `color.neutral.300` border + `color.ink.900` text.
- **Subscription/Upgrade panel (new spec, replaces the current plain black "Unlock More" block):** a `Raised` card using `color.ink.700` background, white text, a short one-line value statement (e.g., "Unlock full mock tests and analytics"), and a single **Accent (Red)** button. No gradient, no decorative illustration unless a small, custom, brand-consistent vector accent is used (per §G.9/§K preferences) — never a generic lock/crown clip-art icon.
- Profile/account access: avatar + nickname pattern (reuse the existing account dropdown anatomy — Settings / Subscription / Sign out) unchanged, since this pattern tested as internally consistent in the audit.

### G.6 Inputs

- Preserved as-is: `radius.xs`, 1px `color.neutral.300` border, label above field (`type.caption`, not uppercase), leading/trailing icon where relevant, 44px height.
- Focus state: 2px `color.red.600` outline ring, offset 2px (also satisfies §K accessibility focus requirement).
- Error state: border becomes `color.red.600`, helper text below in `color.red.600`, explaining what's wrong and how to fix it (see §N writing rules).

### G.7 Question card / Answer options (educational-critical — see §H for full spec)

- Row-based list, each option: lettered circle (`radius.full`, `type.body` semibold) + option text (`type.body-reading`), full-row click target, 1px `color.neutral.300` border, `radius.sm`.
- **Selecting** (live, during solving): selected row gets `color.red.600` border + light red tint background + filled red letter-circle. This is the *only* color feedback during active solving — no green/red correctness shown yet.
- **Reviewing** (after submit / in results mode): correct option shown with green tint/border, student's incorrect pick (if different) shown with red tint/border — using the Status Badge tinted treatment, not a solid fill.

### G.8 Progress / Stat components

- Preserved exactly: large `type.stat` number + `type.caption` label, optionally inside a tinted or `Flat` card; horizontal progress bar (`radius.full` track, `color.red.600` or semantic fill) + fraction label trailing.
- This is confirmed as one of the strongest existing patterns — no structural change, only token alignment (radius/color per §D).

### G.9 Vector graphics / illustration (new — supports preference)

- Permitted on: Dashboard/Home, Analytics, Vocabulary, Leaderboard, Profile, Subscription, onboarding/empty states, marketing/landing pages.
- **MUST NOT** appear on the active practice/solving screen or inside the question/answer area anywhere.
- Style: flat or very lightly shaded vector illustration using only tokens from §D (no arbitrary illustration-specific colors), geometric rather than cartoonish, no stock-illustration look. Used to fill genuine empty states (e.g., "No mock tests yet") or to add character to low-density pages (e.g., onboarding, subscription) — never as filler on already-content-rich screens.

### G.10 Modals

- `Raised` elevation, `radius.lg`, title + close control, content area, optional legend/key at the bottom for any color-coded grid inside (preserves the "Navigate Questions" legend pattern — a genuine strength).
- **Disambiguation (resolves audit C-3):** the "Navigate Questions" grid is formally **two named states of one component**, `QuestionNavigator`: `mode="difficulty"` (shown before/while solving, colored by Easy/Medium/Hard) and `mode="review"` (shown after submission, colored by Correct/Partial/Wrong/Omitted). Only one mode is shown at a time, each with its own legend, using the Status Badge tint system (§G.3) rather than solid fills, so neither mode is visually confused with a filter-selection state.

### G.11 Leaderboard (redesign per preference)

- Component: `LeaderboardRow` — rank (quiet numeral, `type.caption`/`type.h3` weight, not a loud colored badge; top 3 may use a small, restrained medal glyph, not a cartoon icon) + avatar (circle, `radius.full`) + nickname (`type.body` semibold) grouped tightly together on the left, score/metric right-aligned in `type.h3`/stat weight.
- Row style: `Flat` card or simple divider-separated row, hover = subtle background tint (`color.neutral.50`→`color.neutral.100`), not a border/shadow jump.
- Color restraint: only the current user's row and top-3 rows get any visual distinction (a subtle left accent bar or tinted background in `color.red.100` for "you," restrained gold/silver/bronze-neutral tint for top 3 — not saturated, not red-dominant). All other rows are visually equal and quiet.
- **MUST NOT** use multiple saturated colors per row, heavy square card borders, or badge-heavy gamification.

### G.12 Analytics page (new section spec)

- Composition: a small number of top-level stat cards (G.8 pattern, max 3–4) above a focused set of charts — **MUST NOT** become a 8–10 KPI-card wall.
- Chart color palette: fixed mapping — Critical Thinking / Problem Solving / Mathematics each get one consistent, distinguishable color (reuse the same hue used elsewhere in the product for each section, e.g., the Section Diagnostics colors already seen on Mock Test Results) + `color.red.600` reserved for a single "you/current" highlight series where relevant. No more than 4–5 colors in any one chart.
- Charts favor clarity: labeled axes/legends, no 3D effects, no decorative gradients inside chart fills, generous whitespace around each chart so pages don't feel dense.
- Section Diagnostics pattern (score + topic description per section, from Mock Test Results) is the canonical building block for deeper analytics — reuse and extend it rather than inventing a new chart style per page.

### G.13 Vocabulary page (new section spec)

- Inherits the same app shell, card system, and typography as the rest of the product — **MUST NOT** introduce a separate visual identity.
- Word/term entries use the `Flat` card or row pattern with clear typographic hierarchy: term (`type.h3`), part of speech/metadata (`type.caption`, not uppercase unless grouped under a labeled section), definition/example (`type.body-reading`).
- Progress/mastery indicators reuse the existing progress-bar + stat pattern (G.8), not a new gamified widget.

---

## H. Educational UX

This is the product's core job; these rules take priority over generic visual preferences when the two conflict.

- **Passage/question reading:** `type.body-reading`, max ~680px reading column, no borders around the passage text block itself (preserve current unstyled, high-contrast treatment — confirmed strength).
- **Answer options:** see §G.7. Only one feedback color state is visible at a time: neutral (unanswered) → selected (red, during solving) → reviewed (green/red tint, after submission). Never show "selected" and "correct/incorrect" styling simultaneously during live solving.
- **Explanations:** revealed via the existing "Explanation" button; expanded content uses `type.body-reading` inside a `Flat` card directly below the question, pushing content down rather than overlaying it (keeps context visible). Exact expand/collapse animation: see §L.
- **Navigation between questions:** preserve the three-tier system — prev/next arrows, "Question X/N" counter, and the `QuestionNavigator` jump modal (§G.10). This is a confirmed strength; do not reduce to a single method.
- **Mock-test mode:** preserve "Full Simulation" vs. "Sectional Focus" badges and per-section time/question counts on test cards.
- **Timer:** **MUST** be visually clearer than the currently small top-left treatment, especially in full Mock Test mode. Rule: timer uses `type.h3` weight (not caption-size), sits in a consistently visible position (top bar, not buried), and transitions to `color.red.600` text/icon once remaining time drops below ~10% of the total — this is a new, explicit rule resolving an audit risk, not an observed existing behavior.
- **Difficulty tagging:** Status Badge (§G.3) on both the individual question screen and in list/card contexts (Question Bank, Mock Test cards).
- **Cognitive load during solving:** no sidebar, no marketing banners, no vector illustration, no subscription upsell visible on the active practice/mock-test screen. This is the strictest rule in the whole document and **MUST NOT** be relaxed for any future feature.
- **Question/answer images:** **MUST** preserve their original aspect ratio (no stretching/cropping to fill a fixed box) and **MUST** remain fully contained within the question or answer container at all breakpoints, scaling down proportionally rather than overflowing or forcing horizontal scroll.
- **Mathematical notation:** render with a proper math-typesetting approach (e.g., KaTeX/MathJax if available in the stack) rather than plain text approximations; notation inherits `type.body-reading` sizing to stay legible alongside surrounding text. No backend/grading logic is specified here — this is a presentation rule only.
- **Section diagnostics / results:** preserve the Mock Test Results structure (headline score → correct/incorrect/omitted counts → per-section diagnostic bars with topic descriptions → full question navigator) as the canonical review template for any future results-style page (e.g., Question Bank session summaries).

---

## I. Responsive Rules

No mobile/tablet screenshots were supplied; the following are **newly established** rules using the breakpoints in §D, built from the desktop evidence plus standard responsive practice. Flagged as decisions requiring confirmation once real mobile builds exist.

- **Sidebar:** collapses to a bottom tab bar (Question Bank, Mock Tests, Leaderboard/More) on `bp.mobile`; on `bp.tablet` it may collapse to icon-only with a toggle/drawer. Subscription panel (§G.5) moves into the drawer/profile menu on mobile rather than disappearing.
- **Card grids:** 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile), reflowing without changing card internal proportions.
- **Practice/solving screen:** two-column (desktop/tablet-landscape) → stacked, passage first, question second (tablet-portrait/mobile). Passage becomes collapsible (expand/collapse) on mobile if it exceeds ~40% of viewport height, so answer options remain reachable without excessive scrolling.
- **Auth split-screen:** hides the illustrative right-hand panel below `bp.tablet`, form becomes full-width, single column.
- **Typography:** `type.display` and `type.h1` step down one size tier below `bp.tablet` to avoid overflow/wrapping issues; body/reading sizes stay constant for readability.
- **Touch targets:** all interactive elements **MUST** be at least 44×44px on `bp.mobile`/`bp.tablet` (buttons already specify 48px height on mobile, §G.1).
- **Overflow:** any wide content (e.g., analytics charts, the question navigator grid) scrolls horizontally within its own container rather than breaking page layout, with a visible scroll affordance.

---

## J. Interaction States

| State | Rule |
|---|---|
| Default | As specified per component in §G. |
| Hover | Subtle only: background tint shift (≈6–8% darken/lighten) or 1px border color shift to `color.ink.900`; buttons may lift with a 1–2px translateY. No scale/bounce. |
| Focus (keyboard) | 2px `color.red.600` ring, 2px offset, visible on all interactive elements including nav pills and filter chips — **MUST NOT** be suppressed. |
| Active (press) | Slight darken of fill (~10%) and remove hover lift, 100ms. |
| Selected | Per §G.2 (interactive chip/filled red) and §G.7 (answer option). |
| Disabled | 40% opacity, no hover/focus feedback, `not-allowed` cursor. |
| Loading | Skeleton blocks using `color.neutral.100` with a slow (1.5s) opacity pulse for cards/lists; buttons show an inline spinner replacing label text, same button size (no layout shift). |
| Error | Status Badge/red-tint treatment (§G.3) + explicit, specific message in the interface's voice (see §N). Never color-only. |
| Success | Green-tint Status Badge or a brief toast; for form saves, a toast confirms in the same vocabulary as the action ("Changes saved," matching a "Save Changes" button). |
| Empty | Custom vector illustration (§G.9) + one short sentence explaining the state + one clear action if applicable (e.g., "No mock tests yet" + "Start your first test"). Never shown on the active solving screen. |
| Locked/Premium | Reuse `color.ink.700` dark surface + Accent (red) action, consistent with §G.5's subscription panel and the existing dark pricing tier — this pairing is the product's one deliberate "premium gate" visual language and **MUST** stay consistent everywhere it appears (sidebar, pricing page, any future locked feature). |

---

## K. Accessibility

- **Contrast:** All text/background pairs **MUST** meet WCAG AA (4.5:1 body text, 3:1 large text/UI). `color.ink.900` on `color.white`/`color.neutral.50` and white on `color.red.600`/`color.ink.900` both pass at typical sizes; verify any new tint pairing (e.g., badge text on tint background) against its specific background before shipping.
- **Color-independent state communication:** every status/semantic use **MUST** pair color with a text label or icon (already true for difficulty/correctness tags — keep this as a hard rule, not an accident, for all future status indicators).
- **Keyboard focus:** every interactive element **MUST** have the visible focus ring defined in §J. No `outline: none` without a replacement.
- **Touch targets:** minimum 44×44px, per §I.
- **Semantic controls:** buttons are real `<button>`/equivalent interactive elements, not styled `<div>`s; form inputs have associated labels (the existing label-above-field pattern already supports this).
- **Reading density:** passage/question text uses `type.body-reading`'s wider line-height specifically to reduce fatigue over long timed sessions.
- **No WCAG compliance is claimed as already achieved** — these are implementation requirements going forward, not a certification of the current product.

---

## L. Motion and Transitions

- **Duration/easing:** 150ms for small state changes (hover, focus, chip toggle), 200–250ms `ease-out` for larger reveals (modal open, panel expand/collapse, explanation expand).
- **Interaction feedback only:** motion responds to what the user just did (select an answer, open a modal, expand an explanation, submit a test) — it does not run on page load as decoration. No staggered fade-up entrances on cards/sections.
- **One orchestrated moment is allowed** on marketing/landing pages (e.g., a single hero reveal) — not repeated per-section.
- **Reduced motion:** all transitions **MUST** respect `prefers-reduced-motion` by falling back to instant state changes (opacity/position snap instead of animating).
- **Prohibited:** bouncing, elastic easing, continuous/looping animation, confetti or celebratory effects on routine actions (reserve any celebratory moment, if ever used, for a genuinely rare milestone, not every correct answer).

---

## M. Page Composition

- Every authenticated app page (Question Bank, Mock Tests, Leaderboard, Analytics, Vocabulary, Settings) follows the same shell: sidebar + page header (`type.h1` + one-line description) + top-level stat badges where relevant (§G.8) + content area built from `Flat` cards (§G.4) and Status Badges (§G.3) as needed.
- The active solving screen (§H) is the one deliberate exception to the shell — it removes the sidebar and header entirely in favor of a minimal top bar (timer, bookmark, difficulty tag, exit control).
- Marketing pages follow the nav-bar + centered-content template (§F); auth pages follow the split-screen template (§F). Do not invent a third top-level page template without a documented reason.
- New pages **MUST** be assembled from the components and tokens already defined here. A new page requiring a genuinely new component **SHOULD** have that component specified (even briefly) before implementation, not improvised inline.

---

## N. Anti-Patterns

Agents **MUST NOT**:

1. Fill a button, border, icon, or background red "because it's the brand color" outside the rules in §G.1–§G.2.
2. Use a solid filled pill for a non-interactive status indicator (use the tinted Status Badge instead, §G.3).
3. Add a drop shadow to a static in-page card (`Flat` tier is shadow-free by definition, §D).
4. Reintroduce the heavy 2px black card border — refine to the standardized 1px neutral border.
5. Add decorative gradients as a default surface or button treatment.
6. Add vector illustration, promotional banners, or subscription upsells to the active solving screen.
7. Stack more than 4–5 colors into a single analytics chart, or build an analytics page as a wall of 8+ KPI cards.
8. Add a new uppercase "eyebrow" label purely for decoration above content that isn't actually a grouped section.
9. Bold/color a single word within a headline or sentence for emphasis.
10. Use middle-dot-joined meta strings ("A · B · C"), spaced-em-dash labels ("WORD — fragment"), monospace fonts for small data labels, or an appended "→" on buttons/links — none of these exist in justprepy's current identity and none should be introduced.
11. Animate on page load as decoration (staggered card fade-ins, etc.) — motion responds to user action only (§L).
12. Turn the leaderboard into a multi-color, badge-heavy, gamified interface (§G.11).
13. Use generic stock-style illustration or clip-art icon packs that don't match the token palette (§G.9).
14. Introduce a new card/button skin outside the two elevation tiers and four button variants defined in this document.

---

## O. AI Frontend Implementation Instructions

- **Creating a new page:** start from the matching template in §M (app shell / solving screen / marketing / auth). Build content using existing components (§G) and tokens (§D) before considering a new component.
- **Modifying existing UI:** check whether the target element already has a defined spec in §G. If yes, bring it into conformance rather than reinterpreting it. If the current implementation conflicts with this document (e.g., still uses the old heavy black border or a red "Save" button), treat this document as correct and update the implementation.
- **Reusing tokens/components:** always reference the token/component names in this document (`color.red.600`, `Flat` card, `Accent` button, etc.) rather than hardcoding raw values, so future changes propagate from one place.
- **Selecting a button variant:** default to **Primary (Ink)** unless the action is one of the specific brand-forward cases listed in §G.1 for **Accent (Red)** — when unsure, choose Ink.
- **Introducing a new variant:** only when no existing variant reasonably fits, and only within the token system in §D (no new one-off colors, radii, or shadow values). Document the new variant's rule here if it will be reused.
- **Handling unspecified cases:** derive from the nearest documented pattern of the same type (e.g., a new settings sub-page uses the Settings card pattern, §G.4/§F); do not default to a generic unrelated UI-kit pattern.
- **Preventing visual regressions:** before marking a task complete, diff the implemented spacing/color/radius/typography against §D–§G for the components touched.
- **Self-review:** check new work against §N (Anti-Patterns) explicitly — if any item in that list is present, revise before completing the task.

---

## P. Design Conformance Checklist

Before marking any frontend task complete, verify:

- [ ] Only tokens from §D are used (no hardcoded hex/px values outside the defined scale).
- [ ] Button variant matches §G.1's usage rule (Ink default, Red reserved for brand-forward actions, max one Accent button per screen).
- [ ] Status indicators use tinted Status Badges, not solid filled pills (§G.3).
- [ ] Cards use the correct elevation tier — `Flat` for in-page content, `Raised` only for true overlays (§D).
- [ ] Typography uses the defined scale and `type.body-reading` for passages/questions/explanations (§D, §E, §H).
- [ ] Uppercase labels are used only for functional section grouping, not decoration (§E, §N.8).
- [ ] Spacing follows the 4px-based scale; no arbitrary gaps (§D).
- [ ] The active solving screen has zero sidebar, zero illustration, zero promotional content (§H, §N.6).
- [ ] Question/answer images preserve aspect ratio and stay within their container at all breakpoints (§H).
- [ ] Responsive behavior reflows per §I at mobile/tablet/desktop (no overflow, correct stacking, 44px+ touch targets).
- [ ] All interactive elements have a visible keyboard focus ring and meet contrast requirements (§K).
- [ ] Hover/focus/active/selected/disabled/loading/error/success/empty states are implemented per §J, not left undefined.
- [ ] Motion is restrained, interaction-triggered only, and respects reduced-motion (§L).
- [ ] No anti-pattern from §N is present in the new or modified UI.
- [ ] The result reads as justprepy's existing bold, high-contrast identity — not a generic SaaS template.
