# Design System — Implementation Rules

## Source of truth

**Authoritative visual specification:** `docs/design.md` (to be supplied by the project owner).

This file is an implementation wrapper for Codex. It does not define the visual identity.

At the time of the initial documentation foundation, the authoritative `design.md` has not been provided. Do not infer its colors, typography, spacing, effects, or component aesthetics.

When `docs/design.md` becomes available, read it for UI/design implementation tasks.

## Authority boundaries

| Concern | Authority |
|---|---|
| Visual identity, typography, palette, spacing, visual style | `docs/design.md` |
| Design implementation and consistency rules | This document |
| Component ownership and interaction architecture | `FRONTEND.md` |
| Product behavior and requirements | `PROJECT_SCOPE.md` |
| Accessibility/security constraints | `FRONTEND.md` and `SECURITY.md` |
| Implemented runtime tokens/components | Actual application code, aligned with the design specification |

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