# Security Requirements

## Trust boundaries

- Treat browser input, uploaded content, external data, and pipeline releases as untrusted until validated.
- Client-side checks improve UX; server-side validation and authorization are mandatory.
- Never rely on hidden UI, route visibility, or client-provided ownership fields for access control.
- Authentication provider, session mechanism, and permission model are not yet established. Do not invent them.

## Authentication and authorization

When identity features are implemented:

- Use a supported, established authentication approach; do not build custom password/session cryptography without justification.
- Authenticate protected operations on the server.
- Authorize access to each user-owned resource, including attempts, saved questions, progress, and profile data.
- Enforce administrative/content-publication privileges server-side.
- Do not assume that a valid session grants access to every record.
- Validate ownership for direct-object requests, not only collection queries.

## Correct answers and exam integrity

- Keep unpublished answers, answer keys, and privileged grading information on the server.
- Do not deliver correct answers or restricted explanations in initial HTML, hydration data, public endpoints, or client bundles.
- Server-side assessment determines correctness and records authoritative results.
- Release feedback/explanations only when the applicable practice/mock-test policy permits it.
- Do not accept client-supplied scores or correctness as authoritative.
- Protect mock-test state transitions against duplicate/unauthorized submissions.

## Educational content and assets

- Validate imported question data against the approved content contract before publication.
- Sanitize or strictly validate rendered rich content and MathML; do not allow arbitrary executable markup.
- Do not expose internal asset storage credentials or unpublished resources through public URLs.
- Validate file types, sizes, and references before accepting files/assets.
- Use controlled storage/delivery mechanisms for any future user uploads.
- Avoid executing code or scripts embedded in source materials or untrusted skill/plugin content.

## Secrets and configuration

- Never commit real credentials, tokens, database passwords, or private environment files.
- Keep server credentials out of client bundles and public environment variables.
- Use environment-provided secrets and fail safely when required configuration is absent.
- Store example variable names only in committed example files.
- Do not log secrets, session tokens, or full authentication payloads.
- Rotate credentials if they are accidentally exposed.

## User data and privacy

The audience may include students under 18.

- Collect and retain only data necessary for confirmed product requirements.
- Do not expose another student's attempts, progress, saved questions, or personal information.
- Restrict access to sensitive records and operational exports.
- Avoid logging unnecessary personal data or raw answer histories.
- Do not use real student data in test fixtures.
- Confirm applicable legal, consent, retention, and deletion requirements before implementing relevant data collection or external sharing.
- Do not invent legal compliance guarantees.

## APIs and dependencies

- Validate request payloads, identifiers, limits, and query parameters.
- Use safe database parameterization through the selected data-access layer.
- Handle authorization failures without leaking protected resource details.
- Apply appropriate abuse protection to authentication, submissions, and expensive endpoints when implemented.
- Review third-party packages, skills, scripts, and remote integrations before granting filesystem, network, or credential access.
- Prefer maintained dependencies and minimal permissions.
- Consider CSRF, session, cookie, and origin protections according to the actual authentication/transport design.

## Security verification

Security-sensitive changes require relevant tests for:

- Unauthorized and cross-user access.
- Privileged-answer exposure.
- Invalid or malicious input.
- Duplicate/unauthorized state changes.
- Unsafe rich-content rendering.
- Secret or sensitive-data leakage.

Document unresolved security decisions before deploying the affected functionality.