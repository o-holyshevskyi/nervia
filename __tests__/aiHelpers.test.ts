import {
  cleanJsonString,
  parseRetryAfterSeconds,
  isRateLimitError,
  isNoGroupResponse,
} from '../src/lib/aiHelpers';

// ──────────────────────────────────────────────
// cleanJsonString
// ──────────────────────────────────────────────
describe('cleanJsonString', () => {
  test('strips ```json … ``` fences', () => {
    const input = '```json\n{"key":"value"}\n```';
    expect(cleanJsonString(input)).toBe('{"key":"value"}');
  });

  test('strips plain ``` fences', () => {
    const input = '```\n{"key":"value"}\n```';
    expect(cleanJsonString(input)).toBe('{"key":"value"}');
  });

  test('trims leading/trailing whitespace', () => {
    expect(cleanJsonString('  {"a":1}  ')).toBe('{"a":1}');
  });

  test('leaves clean JSON untouched', () => {
    const json = '{"key":"value"}';
    expect(cleanJsonString(json)).toBe(json);
  });

  test('returns empty string for empty input', () => {
    expect(cleanJsonString('')).toBe('');
  });
});

// ──────────────────────────────────────────────
// parseRetryAfterSeconds
// ──────────────────────────────────────────────
describe('parseRetryAfterSeconds', () => {
  test('parses "retry in Xs" pattern (integer)', () => {
    expect(parseRetryAfterSeconds('Please retry in 36s.')).toBe(36);
  });

  test('parses "retry in X.Ys" pattern (float, rounds up)', () => {
    expect(parseRetryAfterSeconds('Please retry in 36.6229s.')).toBe(37);
  });

  test('parses retryDelay JSON field', () => {
    const msg = `{"retryDelay":"20s"}`;
    expect(parseRetryAfterSeconds(msg)).toBe(20);
  });

  test('returns minimum of 1 for sub-second values', () => {
    expect(parseRetryAfterSeconds('retry in 0.1s')).toBe(1);
  });

  test('returns undefined when no pattern matches', () => {
    expect(parseRetryAfterSeconds('something went wrong')).toBeUndefined();
  });

  test('is case-insensitive on "retry in"', () => {
    expect(parseRetryAfterSeconds('RETRY IN 5s')).toBe(5);
  });
});

// ──────────────────────────────────────────────
// isRateLimitError
// ──────────────────────────────────────────────
describe('isRateLimitError', () => {
  test('returns null for a generic error', () => {
    expect(isRateLimitError(new Error('Internal server error'))).toBeNull();
  });

  test('detects "429" in the message', () => {
    const err = new Error('Request failed with status 429');
    expect(isRateLimitError(err)).not.toBeNull();
  });

  test('detects "Too Many Requests" (case-insensitive)', () => {
    const err = new Error('too many requests');
    expect(isRateLimitError(err)).not.toBeNull();
  });

  test('detects "quota" in the message', () => {
    const err = new Error('quota exceeded');
    expect(isRateLimitError(err)).not.toBeNull();
  });

  test('detects "rate limit" in the message', () => {
    const err = new Error('rate limit hit');
    expect(isRateLimitError(err)).not.toBeNull();
  });

  test('includes retryAfterSeconds when parseable', () => {
    const err = new Error('429 Too Many Requests. Please retry in 30s.');
    const result = isRateLimitError(err);
    expect(result).not.toBeNull();
    expect(result?.retryAfterSeconds).toBe(30);
  });

  test('retryAfterSeconds is undefined when not parseable', () => {
    const err = new Error('429 Too Many Requests');
    const result = isRateLimitError(err);
    expect(result?.retryAfterSeconds).toBeUndefined();
  });

  test('handles non-Error objects (string thrown)', () => {
    expect(isRateLimitError('429')).not.toBeNull();
  });

  test('handles null/undefined gracefully', () => {
    expect(isRateLimitError(null)).toBeNull();
    expect(isRateLimitError(undefined)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// isNoGroupResponse
// ──────────────────────────────────────────────
describe('isNoGroupResponse', () => {
  // Sentinel / falsy values → should return true (node stays ungrouped)
  test.each([
    [undefined, 'undefined'],
    [null as unknown as string, 'null'],
    ['', 'empty string'],
    ['   ', 'whitespace-only string'],
    ['none', '"none"'],
    ['None', '"None" (mixed case)'],
    ['no group', '"no group"'],
    ['No Group', '"No Group" (mixed case)'],
    ['n/a', '"n/a"'],
    ['N/A', '"N/A"'],
    ['uncategorized', '"uncategorized"'],
    ['Uncategorized', '"Uncategorized"'],
    ['general', '"general"'],
    ['General', '"General"'],
  ])('returns true for %s', (value, _label) => {
    expect(isNoGroupResponse(value as string | undefined)).toBe(true);
  });

  // Real category names → should return false (node gets assigned a group)
  test.each([
    ['Design'],
    ['Developer Tools'],
    ['Productivity'],
    ['AI & ML'],
    ['Learning'],
    ['Finance'],
    ['Social'],
  ])('returns false for a real category name "%s"', (name) => {
    expect(isNoGroupResponse(name)).toBe(false);
  });
});
