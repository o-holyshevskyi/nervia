/**
 * Pure helper functions shared by AI API routes.
 * Keeping these extracted enables unit testing without Next.js runtime.
 */

/** Strip markdown code-fences that LLMs sometimes wrap JSON in. */
export function cleanJsonString(str: string): string {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

/**
 * Parse a "retry after N seconds" value from a rate-limit error message.
 * Handles patterns such as:
 *   "Please retry in 36.6229s."
 *   `"retryDelay":"36s"`
 */
export function parseRetryAfterSeconds(message: string): number | undefined {
  const m1 = message.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (m1?.[1]) return Math.max(1, Math.ceil(Number(m1[1])));
  const m2 = message.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (m2?.[1]) return Math.max(1, Number(m2[1]));
  return undefined;
}

/**
 * Detect whether an error is a 429 / rate-limit error.
 * Returns `null` when not a rate-limit error, or an object (possibly
 * containing `retryAfterSeconds`) when it is.
 */
export function isRateLimitError(err: unknown): { retryAfterSeconds?: number } | null {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const looksLike429 = /(^|\b)429(\b|$)/.test(message) || /too many requests/i.test(message);
  const looksLikeQuota = /quota/i.test(message) || /rate limit/i.test(message);
  if (!looksLike429 && !looksLikeQuota) return null;
  return { retryAfterSeconds: parseRetryAfterSeconds(message) };
}

/**
 * Return true when the AI responded with a "no group" sentinel value,
 * meaning the node should remain ungrouped (group_id = null).
 */
export function isNoGroupResponse(groupName: string | undefined): boolean {
  if (groupName == null || typeof groupName !== 'string') return true;
  const t = groupName.trim().toLowerCase();
  return !t || t === 'none' || t === 'no group' || t === 'n/a' || t === 'uncategorized' || t === 'general';
}
