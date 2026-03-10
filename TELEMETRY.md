# PostHog Telemetry (Nervia)

## Setup

- **Client**: Initialized in `instrumentation-client.ts` (Next.js 15.3+). Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (e.g. `https://eu.i.posthog.com`).
- **Server**: Use `captureServerEvent()` or `captureAIGenerationCompleted()` from `src/lib/posthog-server.ts`. Always `await posthog.shutdown()` (or use these helpers) so events flush before the request ends. Use the same `distinct_id` as the client (user id) so server and client events merge.

## Privacy

- Only **metadata** is sent in event properties: counts, types, durations. No note content, bookmark titles, or URLs.
- See `src/lib/telemetry/README.md` and `src/lib/telemetry/events.ts` for event names and property types.

## PostHog dashboard

### Exceptions

- Enable **Exception autocapture** in PostHog project settings (if not already on). Exceptions appear as events; filter by event type in **Events** or view them in **Session Replays** when watching a session.

### Session replays

- Enable **Recordings** in project settings. Replays appear under **Session Replays**. You can configure input masking in PostHog if you need to hide form fields.

### Custom events

- In **Events** or **Insights**, filter by event name to analyze behavior, e.g.:
  - `import_started`, `import_completed`, `import_failed` — data import funnel
  - `ai_request_sent`, `ai_response_received`, `ai_generation_completed` — Neural Core usage
  - `time_machine_used`, `pathfinder_activated`, `focus_mode_toggled` — graph features
  - `upgrade_modal_viewed`, `upgrade_button_clicked` — conversion funnel
