# Frontend Rules

## Scope

This document governs frontend structure, component ownership, data boundaries, client state, and educational-content rendering.

The proposed framework baseline is Next.js App Router with React and TypeScript. Confirm the actual repository setup before applying framework-specific conventions.

Visual decisions belong to `DESIGN_SYSTEM.md` and the future authoritative `docs/design.md`.

## Page and component ownership

- Route/page files compose screens and connect them to application services; they do not own grading or persistence logic.
- Feature-specific components belong to their owning feature module.
- Shared components are appropriate only when multiple features need a genuinely generic primitive or layout.
- Do not move a component to shared UI merely because it may be reused someday.
- Keep rendering logic independent from question source files and ingestion details.
- Marketing and authenticated product experiences should use distinct layout boundaries.

If Next.js App Router is used, keep route groups and server/client component boundaries explicit. Do not create separate route groups until their screens are implemented.

## Server and client responsibilities

**Server responsibilities:**

- Load authorized persisted data.
- Apply access checks.
- Produce question payloads safe for the current activity state.
- Execute mutations, grading, and persistence through server services.
- Enforce result/explanation release rules.

**Client responsibilities:**

- Current selection and unsubmitted interaction.
- Focus, open panels, temporary UI feedback.
- Responsive interaction and navigation state.
- Local timer display reconciled with server-authoritative timing.
- Request initiation and presentation of server results.

Use local component state first. Use URL state for shareable navigation/filter state where appropriate. Introduce shared/global client state only when actual cross-component requirements justify it.

Persistent user data is not authoritative in browser state.

## Data access

- Prefer server-side data retrieval where supported by the adopted framework.
- Client components request mutations/refresh through defined application endpoints/actions.
- Do not introduce an HTTP request to the application's own API unnecessarily when server code can call an authorized service directly.
- Do not embed privileged correct-answer data in initial page props, HTML, hydration payloads, or client bundles.
- Use explicit loading, error, empty, unavailable, and retry states.
- Handle stale revisions and missing/deleted question references without crashing the entire experience.

## Educational question rendering

Question rendering must support:

- Plain text and mixed text/math.
- Inline and display mathematics.
- Ordered/unordered lists.
- Images, graphs, and diagrams.
- Images/mathematics inside answer options.
- Long/multiline options.
- Variable numbers of answer options.

Recommended separation of responsibilities:

| Responsibility | Component concept |
|---|---|
| Question composition | Question renderer |
| Structured text/math/media blocks | Rich-content renderer |
| Native mathematical presentation | Math-content renderer |
| Educational visual resources | Asset renderer |
| Option content | Presentational answer-option component |
| Selection/submission feedback | Activity-specific interaction component |
| Solution presentation | Explanation component |
| Movement between questions | Question navigation |

Do not create all these components prematurely. Introduce them as the first real question interface requires them.

### Math and content safety

- Render validated native MathML while preserving inline/display context.
- Do not replace formulas with images.
- Published content retains the native-MathML delivery contract. The practice view also accepts authored, delimited LaTeX and structured math/image parts: its shared `PracticeContentView` converts LaTeX to native MathML through bounded, untrusted KaTeX rendering. Only generated MathML is inserted; arbitrary source HTML is never injected. This view adapter does not change pipeline/publication schemas.
- Do not blindly inject educational markup as trusted HTML.
- Unsupported content must produce a controlled failure/fallback, not altered mathematical meaning.
- Preserve content block order and asset references defined by `CONTENT_CONTRACT.md`.

## Interaction and accessibility

- Support keyboard navigation, visible focus, and semantic controls.
- Answer selection must expose selected/disabled/result states accessibly.
- Do not rely on color alone for correct/incorrect feedback.
- Images require meaningful alternatives when the source provides them; missing essential accessibility information must be surfaced, not invented.
- Long content and formulas must not be clipped or rendered unreadably.
- Mobile layouts must preserve question context, answer usability, and navigation.
- Loading/feedback states must prevent accidental duplicate final submissions.

Practice and Mock Tests may have different feedback policies; UI must follow the server-authorized activity state.

## Reuse and validation

- Reuse design-system components/tokens before creating variants.
- Keep feature-specific behavior out of generic UI primitives.
- Cover rich-content rendering with representative fixtures and regression tests.
- Test desktop/mobile behavior and keyboard interaction for question-related UI changes.
- Do not let visual design tooling or third-party skills override documented product/interaction rules.
