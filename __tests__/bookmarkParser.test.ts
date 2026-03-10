/**
 * @jest-environment jsdom
 */
import { parseBookmarksHtml, ParsedBookmark } from '../src/lib/bookmarkParser';

// Minimal Netscape Bookmark File format used by Chrome, Firefox, etc.
function makeHtml(inner: string): string {
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${inner}
</DL><p>`;
}

describe('parseBookmarksHtml', () => {
  // ──────────────────────────────────────────────
  // Basic parsing
  // ──────────────────────────────────────────────

  test('parses a single bookmark with http url', () => {
    const html = makeHtml(`<DT><A HREF="http://example.com">Example</A>`);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Example');
    expect(result[0].url).toBe('http://example.com');
  });

  test('parses a single bookmark with https url', () => {
    const html = makeHtml(`<DT><A HREF="https://example.com">Example Secure</A>`);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com');
  });

  test('filters out non-http links (e.g. javascript:, chrome:// etc.)', () => {
    const html = makeHtml(`
      <DT><A HREF="javascript:void(0)">JS Link</A>
      <DT><A HREF="chrome://settings">Chrome Settings</A>
      <DT><A HREF="https://valid.com">Valid</A>
    `);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://valid.com');
  });

  test('uses "Untitled" as fallback title when link text is empty', () => {
    const html = makeHtml(`<DT><A HREF="https://example.com"></A>`);
    const result = parseBookmarksHtml(html);
    expect(result[0].title).toBe('Untitled');
  });

  test('returns empty array when there are no bookmarks', () => {
    const result = parseBookmarksHtml('<html><body></body></html>');
    expect(result).toEqual([]);
  });

  test('returns empty array for empty string input', () => {
    const result = parseBookmarksHtml('');
    expect(result).toEqual([]);
  });

  // ──────────────────────────────────────────────
  // Folder / tag extraction
  // ──────────────────────────────────────────────

  test('extracts folder name as a tag', () => {
    const html = makeHtml(`
      <DT><H3>Dev Tools</H3>
      <DL><p>
        <DT><A HREF="https://github.com">GitHub</A>
      </DL><p>
    `);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('Dev Tools');
  });

  test('extracts nested folder names as multiple tags', () => {
    const html = makeHtml(`
      <DT><H3>Work</H3>
      <DL><p>
        <DT><H3>Dev Tools</H3>
        <DL><p>
          <DT><A HREF="https://github.com">GitHub</A>
        </DL><p>
      </DL><p>
    `);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('Dev Tools');
    expect(result[0].tags).toContain('Work');
  });

  test('assigns empty tags array to top-level bookmarks with no folder', () => {
    const html = makeHtml(`<DT><A HREF="https://example.com">Example</A>`);
    const result = parseBookmarksHtml(html);
    expect(result[0].tags).toEqual([]);
  });

  // ──────────────────────────────────────────────
  // Multiple bookmarks
  // ──────────────────────────────────────────────

  test('parses multiple bookmarks in sequence', () => {
    const html = makeHtml(`
      <DT><A HREF="https://a.com">A</A>
      <DT><A HREF="https://b.com">B</A>
      <DT><A HREF="https://c.com">C</A>
    `);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(3);
    const urls = result.map((b: ParsedBookmark) => b.url);
    expect(urls).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
  });

  test('parses bookmarks across multiple folders', () => {
    const html = makeHtml(`
      <DT><H3>Folder A</H3>
      <DL><p>
        <DT><A HREF="https://a.com">A</A>
      </DL><p>
      <DT><H3>Folder B</H3>
      <DL><p>
        <DT><A HREF="https://b.com">B</A>
      </DL><p>
    `);
    const result = parseBookmarksHtml(html);
    expect(result).toHaveLength(2);
    expect(result[0].tags).toContain('Folder A');
    expect(result[1].tags).toContain('Folder B');
  });

  // ──────────────────────────────────────────────
  // Return type shape
  // ──────────────────────────────────────────────

  test('returned objects have title, url, and tags fields', () => {
    const html = makeHtml(`<DT><A HREF="https://example.com">Example</A>`);
    const [bookmark] = parseBookmarksHtml(html);
    expect(bookmark).toHaveProperty('title');
    expect(bookmark).toHaveProperty('url');
    expect(bookmark).toHaveProperty('tags');
    expect(Array.isArray(bookmark.tags)).toBe(true);
  });
});
