# Educational Content Contract

## Authority and status

The existing educational data pipeline owns preparation and validation of question content. The website consumes its website-ready output; it MUST NOT infer correct answers, repair academic content, or recreate parsing/matching logic.

This document defines the required **logical guarantees**, not a finalized JSON/wire schema. Actual property names, schema version, and serialization must be confirmed against representative pipeline output before ingestion is implemented.

## Published question contract

Each published, gradable question must provide the following logical information:

| Element | Requirement |
|---|---|
| Question identity | Stable unique ID independent of display order |
| Published revision | Identifies the exact content/answer version |
| Prompt | Ordered, renderable question content |
| Answer options | Ordered collection with stable identifiers within the revision |
| Correct answer | Unambiguous reference to the correct option(s), available only to authorized grading logic |
| Classification | Category/subcategory references according to the published taxonomy |
| Explanation | Revision-linked explanation, subject to availability and release rules |
| Assets | Resolvable references for any embedded visual resources |
| Publication identity | Traceable release/source association for import and audit |

Question identity and published revision are distinct. Changing grading-relevant content MUST NOT silently overwrite a version referenced by recorded attempts.

## Rich content

Questions and answer options may contain:

- Text with inline mathematics.
- Display mathematics.
- Ordered/unordered lists.
- Images, graphs, diagrams, or other validated visual assets.
- Mixed sequences of these elements.

Requirements:

- Preserve content-block ordering and nesting.
- Preserve inline versus display mathematical intent.
- Keep text and mathematics as semantic content, not pre-rendered image substitutes.
- Answer options may contain the same rich content types as prompts.
- Do not assume exactly four options, fixed option length, or text-only options.
- Do not rely on option position or display label as answer identity.
- If option order is shuffled, preserve stable option identity and grading correctness.

The serialized block types and nesting constraints remain to be finalized from actual pipeline output.

## Mathematics

The current intended delivery path prepares LaTeX as native MathML before website rendering.

- Render validated MathML as mathematics; do not replace it with screenshots or equation images.
- Preserve mathematical meaning and the original inline/display distinction.
- Do not treat arbitrary source HTML/MathML as trusted.
- Reject or isolate unsupported/malformed markup according to the validated publication contract.
- Do not silently alter mathematical expressions to make invalid content display.
- Original LaTeX may be retained if supplied by the pipeline; its exact storage/transport role is not yet finalized.

## Assets

Each asset reference must resolve unambiguously to the intended resource.

- Preserve associations between assets, question revisions, and content positions.
- An asset may appear inside a prompt, option, or explanation.
- Use explicit references rather than guessing assets from filenames or array positions.
- Asset delivery must preserve intended legibility and aspect ratio.
- Publication validation must detect missing/unresolvable referenced assets.
- Source/provenance metadata must be retained where supplied; never fabricate provenance.

Storage provider, URL format, asset metadata fields, and supported media formats require confirmation.

## Answers and explanations

- Correct-answer references must resolve to valid option identities for the published revision.
- The grading model must be explicit; do not assume all future question types are single-answer MCQ.
- Explanations must correspond to the same published revision as the question and answer.
- The contract must distinguish an unavailable explanation from an empty explanation.
- Explanations are not automatically public: practice and mock-test release policies may differ.
- Do not expose privileged answer data through normal question-delivery payloads.

If a question cannot be graded or rendered reliably, it must not be silently published as a valid gradable question.

## Required, optional, and null semantics

- Stable identity, revision, renderable prompt, and an unambiguous grading contract are required for published gradable questions.
- Answer options are required for multiple-choice questions; count is variable.
- Assets are optional when none are referenced.
- Subcategory presence follows the approved taxonomy; do not synthesize missing classification.
- An explanation may be unavailable before publication readiness; its requiredness depends on the explicit publication policy.
- Required fields must not be represented by null, blank strings, or invented defaults.
- The eventual wire schema must explicitly define optional, omitted, null, and empty-collection semantics. Consumers MUST NOT assume these are interchangeable.

## Integration and validation

Before accepting a release, validate:

1. Supported contract version and release identity.
2. Unique question identities and coherent revisions.
3. Content ordering and supported block types.
4. Option identities and valid correct-answer references.
5. Category/subcategory references.
6. Explanation-to-question revision linkage.
7. Asset availability and supported safe rendering.
8. Required-field and nullability rules.

Publishing must be repeatable without creating duplicate questions or corrupting existing revisions. Reject incomplete/invalid releases rather than silently correcting academic content.

## Not yet established

The following require actual pipeline examples or explicit decisions:

- Exact schema/property names and serialization.
- Contract version identifier and publication manifest format.
- Full block-type catalog and nested-content rules.
- Supported question/grading types beyond known answer-option questions.
- Final explanation availability/publication policy.
- Taxonomy identifier format.
- Asset storage/manifest structure.
- Exact provenance metadata and release lifecycle.

Do not invent these during feature implementation. Record the decision when evidence becomes available, then update this document and the versioned machine-readable contract together.