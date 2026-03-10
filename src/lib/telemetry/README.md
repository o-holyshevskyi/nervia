# Telemetry (PostHog)

- **Rule**: Only send **metadata** in event properties. Never send note content, bookmark titles, URLs, or free-text that could contain PII.
- **Allowed**: counts (`total_items`, `batch_size`, `count`), types (`source`, `endpoint`, `operation`), lengths as numbers (`title_length`), identifiers (`distinct_id` = user id, `plan` in identify only).
- **Event names and types**: See `src/lib/telemetry/events.ts`. Use `TELEMETRY_EVENTS` and the exported interfaces when capturing.
- **Optional sanitizer**: `maskEventProperties()` in `mask.ts` can strip or replace content-like keys with `{ length, type }` if you ever build props from raw user data.
