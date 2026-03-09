export interface ParsedObsidianNote {
    title: string;
    content: string;
    tags: string[];
    wikilinks: string[];
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---/;
const TITLE_FM_REGEX = /^title:\s*(.+)$/m;
const TAGS_FM_REGEX = /^tags:\s*\[([^\]]*)\]/m;
const H1_REGEX = /^#\s+(.+)$/m;
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
const INLINE_TAG_REGEX = /#([a-zA-Z][\w/-]*)/g;

function parseFrontmatter(block: string): { title?: string; tags: string[] } {
    const tags: string[] = [];
    let title: string | undefined;

    const titleMatch = block.match(TITLE_FM_REGEX);
    if (titleMatch) title = titleMatch[1].trim().replace(/^["']|["']$/g, '');

    const tagsMatch = block.match(TAGS_FM_REGEX);
    if (tagsMatch) {
        const inner = tagsMatch[1];
        const parts = inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
        tags.push(...parts.filter(Boolean));
    }

    return { title, tags };
}

function extractInlineTags(body: string): string[] {
    const tags: string[] = [];
    let m: RegExpExecArray | null;
    INLINE_TAG_REGEX.lastIndex = 0;
    while ((m = INLINE_TAG_REGEX.exec(body)) !== null) {
        tags.push(m[1]);
    }
    return tags;
}

function extractWikilinks(body: string): string[] {
    const links: string[] = [];
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    WIKILINK_REGEX.lastIndex = 0;
    while ((m = WIKILINK_REGEX.exec(body)) !== null) {
        const target = m[1].trim();
        if (!seen.has(target)) {
            seen.add(target);
            links.push(target);
        }
    }
    return links;
}

export function parseObsidianMd(mdContent: string, fileName?: string): ParsedObsidianNote {
    let body = mdContent.trim();
    let fmTags: string[] = [];
    let fmTitle: string | undefined;

    const fmMatch = body.match(FRONTMATTER_REGEX);
    if (fmMatch) {
        const block = fmMatch[1];
        const parsed = parseFrontmatter(block);
        fmTitle = parsed.title;
        fmTags = parsed.tags;
        body = body.slice(fmMatch[0].length).trimStart();
    }

    const inlineTags = extractInlineTags(body);
    const tags = [...new Set([...fmTags, ...inlineTags])];

    const wikilinks = extractWikilinks(body);

    let title = fmTitle;
    if (title == null || title === '') {
        const h1Match = body.match(H1_REGEX);
        title = h1Match ? h1Match[1].trim() : '';
    }
    if (title === '' && fileName) {
        title = fileName.replace(/\.md$/i, '').trim();
    }
    if (title === '') {
        title = 'Untitled';
    }

    return {
        title,
        content: body,
        tags,
        wikilinks,
    };
}
