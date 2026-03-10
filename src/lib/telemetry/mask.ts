/**
 * Sanitize event properties so only metadata is sent (no note content, titles, URLs).
 * Use when building properties from user data to enforce "metadata only" rule.
 */

export function maskEventProperties<T extends Record<string, unknown>>(props: T): T {
    const out = { ...props }
    const contentKeys = ['title', 'content', 'url', 'text', 'prompt', 'query', 'message']
    for (const key of contentKeys) {
        if (key in out && typeof (out as Record<string, unknown>)[key] === 'string') {
            const s = (out as Record<string, unknown>)[key] as string
            ;(out as Record<string, unknown>)[key] = { length: s.length, type: 'string' }
        }
    }
    return out
}
