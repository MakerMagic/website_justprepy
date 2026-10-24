# Design System — Implementation Rules

## Source of truth

**Authoritative visual specification:** `docs/design.md` (supplied by the project owner).

This file is an implementation wrapper for Codex. It does not define the visual identity.

The owner-supplied specification is present at `docs/design.md`. Runtime tokens in
`src/design/tokens.css` implement its palette, typography and spacing foundations.

Read `docs/design.md` before applying specialized design workflows.

## Authority boundaries

| Concern                                                     | Authority                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| Visual identity, typography, palette, spacing, visual style | `docs/design.md`                                               |
| Design implementation and consistency rules                 | This document                                                  |
| Component ownership and interaction architecture            | `FRONTEND.md`                                                  |
| Product behavior and requirements                           | `PROJECT_SCOPE.md`                                             |
| Accessibility/security constraints                          | `FRONTEND.md` and `SECURITY.md`                                |
| Implemented runtime tokens/components                       | Actual application code, aligned with the design specification |

Figma and third-party design skills are reference/workflow tools, not replacements for the project's authoritative specification.

## Implementation rules

- Use existing project tokens and components before introducing new visual values or variants.
- Keep reusable design tokens centralized in the established design location.
- Avoid hardcoded, repeated visual values when an applicable token exists.
- Preserve consistent component states: default, hover, focus, selected, disabled, loading, error, and feedback where relevant.
- New reusable components must follow the established component API and styling conventions.
- Feature-specific visual behavior stays in the owning feature; generic primitives must not encode exam business logic.
- Changes to shared tokens/components require checking affected screens.
- Maintain responsive behavior without introducing unsupported visual redesigns.

## When the visual specification is incomplete

1. Check `docs/design.md`, existing tokens/components, and relevant implemented screens.
2. Reuse established patterns where a compatible precedent exists.
3. If no precedent exists, avoid introducing a new visual identity or unrelated aesthetic decisions.
4. Use only minimal, accessible, reversible styling needed for the assigned task.
5. Flag any visual decision that requires product-owner approval.
6. Do not present provisional styling as an adopted design-system standard.

Do not manufacture a complete design system from a vague prompt when the authoritative design is missing.

## Educational interface constraints

The question-solving experience must remain readable and usable with:

- Long questions and multiline options.
- Inline/display mathematics.
- Graphs, diagrams, and images.
- Variable option counts.
- Keyboard navigation and visible selection/feedback.
- Desktop and mobile layouts.

Math, question content, and answer-option behavior are governed by `CONTENT_CONTRACT.md` and `FRONTEND.md`; this document governs only visual consistency and implementation.

## Design QA

For UI changes, verify:

- Conformance with the available visual specification.
- Reuse of established tokens/components.
- Consistency across relevant component states.
- Readability and interaction at mobile and desktop sizes.
- Visible keyboard focus and sufficient non-color feedback.
- Absence of clipping/overflow for mathematical and long-form content.
- No unintended changes to unrelated shared components.

Use visual inspection or browser-based checks where tooling is available. Do not claim visual verification without actually performing it.

## Updating the system

- Visual decisions change in `docs/design.md` only through an authorized design change.
- Update this wrapper only when design-implementation conventions change.
- Keep runtime tokens/components synchronized with approved visual decisions.
- Do not duplicate the full visual specification here.

## Compact promotions and contextual disclosure

- Sidebar promotions use a muted brand-tinted surface (including an explicitly requested soft gradient), a small factual badge,
  a short title and one full-width ink CTA. Reuse the UI font, 12px supporting
  text, 13px semibold CTA, existing control/card radius tokens and 44px action height.
  Use owner-approved copy; do not invent prices or benefits.
- Rail mode exposes one labelled compact control; expanded promotional content
  must be inert and hidden from accessibility while collapsed. Keep the profile
  trigger's vertical position stable during expansion.
- Contextual disclosure may morph from the measured trigger rectangle to the
  anchored panel, with four ordered reveal groups: profile/header, Settings, Subscription, then Sign out and helper text. Reverse the stagger on exit; avoid overshoot. Use
  `--motion-disclosure` and `--ease-disclosure`; keep anchor coordinates separate
  from animated transforms. Closing must reverse naturally, remain noninteractive
  during exit, and preserve focus restoration. Skip scripted motion when reduced
  motion is requested. These account-specific transitions must not alter other popovers.
