export interface ParsedBookmark {
    title: string;
    url: string;
    tags: string[];
}

export function parseBookmarksHtml(htmlString: string): ParsedBookmark[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const bookmarks: ParsedBookmark[] = [];

    const links = doc.querySelectorAll("a");

    links.forEach((link) => {
        const title = link.textContent || "Untitled";
        const url = link.getAttribute("href") || "";
        
        if (!url.startsWith("http")) return;

        const tags: string[] = [];
        let parent = link.parentElement;
        
        while (parent) {
            if (parent.tagName === "DL") {
                const folderTitle = parent.previousElementSibling?.tagName === "H3" 
                    ? parent.previousElementSibling.textContent 
                    : null;
                if (folderTitle) tags.push(folderTitle);
            }
            parent = parent.parentElement;
        }

        bookmarks.push({ title, url, tags });
    });

    return bookmarks;
}