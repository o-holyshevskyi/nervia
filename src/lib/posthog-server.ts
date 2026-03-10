/**
 * Server-side PostHog for API routes and server actions.
 * Use captureServerEvent so events are flushed before the request ends (required in serverless).
 * Server events: use same distinct_id as client (user id) so events merge in PostHog.
 */

import { PostHog } from 'posthog-node'
import { TELEMETRY_EVENTS } from '@/src/lib/telemetry/events'

/**
 * Capture an event and flush. Creates a client, captures, then shutdown so events are sent.
 * Use this in serverless so events are flushed before the request ends.
 */
export async function captureServerEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>
): Promise<void> {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key || !host) return
    const posthog = new PostHog(key, { host })
    posthog.capture({ distinctId, event, properties })
    await posthog.shutdown()
}

/** Capture ai_generation_completed after a successful AI process (metadata only). */
export async function captureAIGenerationCompleted(
    userId: string,
    mode: 'analyze_link' | 'suggest_connections',
    batch_size: number
): Promise<void> {
    await captureServerEvent(userId, TELEMETRY_EVENTS.AI_GENERATION_COMPLETED, { mode, batch_size })
}
