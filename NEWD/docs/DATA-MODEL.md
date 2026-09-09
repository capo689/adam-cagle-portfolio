# Data Model

## Public content

### `content_items`

Canonical project, role, organization, answer, and capability records. Includes slug, type, title, summary, structured facets, publication state, source version, and canonical route.

### `content_chunks`

RAG chunks linked to `content_items`, with plain text, full-text-search vector, embedding, metadata, evidence links, and content version.

### `recorded_responses`

Approved prerecorded presentations and answers: title, transcript, media object path, duration, triggering intents, related content IDs, and fallback answer.

## Visitor intelligence

### `visitor_sessions`

Anonymous UUID, provided name, start/end timestamps, voice mode, consent version, status, and generated summary. No account is required for a visitor.

### `consent_events`

Append-only record of the exact consent version, voice choice, transcript/page-tracking choice, timestamp, and revocation.

### `conversation_messages`

Session ID, role, text, timestamp, model/provider metadata, cited content IDs, latency fields, and prerecorded-response ID when used.

### `page_events`

Session ID, route, canonical content ID, event type, timestamp, dwell time, and navigation source (`voice`, `click`, `system`).

### `tool_events`

Session ID, message ID, allow-listed tool name, validated arguments, result IDs, timestamp, and success state.

### `session_exports`

Session ID, generated Markdown, generation timestamp, content hash, and optional private Storage object path.

## Administration

### `admin_members`

Supabase Auth user ID, role, active state, and audit timestamps. Authorization checks this table server-side; it never trusts editable user profile metadata.

### `admin_audit_events`

Admin user ID, action, target record, timestamp, and limited change metadata for exports, deletions, and retention changes.

## Access policy

- Public content can be read anonymously only when `status = published`.
- Visitor data is written through validated server endpoints, not directly from an anonymous browser client.
- Visitor sessions cannot read other visitor sessions.
- Admin records and visitor intelligence require an authenticated active admin membership.
- Storage buckets for transcripts and recorded private presentations are private and use short-lived signed URLs.
- Every exposed table uses RLS and receives only the explicit Data API grants it needs.
