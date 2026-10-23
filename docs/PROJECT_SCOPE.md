# Project Scope

## Product

**JustPrepy** is an online platform for entrance-exam preparation, initially focused on the Nazarbayev University Entrance Test (NUET). Future support for additional entrance examinations is planned.

Primary audience: students approximately 16–19 years old preparing for university admission.

The product consolidates preparation currently fragmented across PDFs, Telegram channels, and separate resources into one question-solving environment.

## Core product areas

| Area | Intended capability |
|---|---|
| Question Bank | Browse and solve questions organized by categories and subcategories |
| Mock Tests | Full practice exams and section-specific tests |
| Vocabulary | Study and practice vocabulary |
| Explanations | Review step-by-step solutions |
| Saved Questions | Save questions for later review |
| Progress & Statistics | Accuracy, solved counts, time spent, performance by topic/subtopic |
| Attempt History | Review previous attempts and results |
| Profile | Manage user-facing account information |

These describe intended product capabilities, not confirmed implemented features.

## Primary user journey

1. Enter the platform.
2. Choose Question Bank, Mock Tests, or Vocabulary.
3. Complete a question or learning activity.
4. Receive feedback according to the activity's rules.
5. Review an explanation when available and permitted.
6. Have the relevant attempt/progress persisted.
7. Continue practice, revisit saved questions, or analyze weak topics.

## Product boundaries

- **Product application:** The primary experience; optimized for focused, readable question solving.
- **Marketing website:** Separate public-facing experience for product information, pricing, FAQ, and registration.
- **Educational content preparation:** An existing external pipeline prepares and validates question content; the website consumes published output.

Mathematics and mixed text/visual questions are first-class product requirements. Desktop and mobile question-solving experiences must both be usable.

## Constraints

- A question may contain text, mathematical expressions, lists, graphs, diagrams, images, and answer options.
- Answer-option count and length are variable.
- Correct answers, explanations, topic classification, and progress must remain reliably associated with the intended question.
- Student history must remain interpretable after content updates.
- Do not assume specific NUET scoring, timing, grading, retake, or feedback policies without confirmation.
- Do not expand product scope beyond confirmed requirements merely because a common EdTech feature exists.

Subscription/pricing is a planned marketing/product consideration; actual access tiers, payment rules, and entitlements are not established.

For current implementation status, use `CURRENT_WORK.md`, not this file.