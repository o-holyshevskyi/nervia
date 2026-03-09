export interface ParsedNotionNote {
    title: string;
    content: string;
    links: string[]; // Звичайні лінки, аналог wikilinks
    tags: string[];
}

export async function parseNotionFile(filename: string, content: string): Promise<ParsedNotionNote> {
    // 1. Спочатку просто надійно відрізаємо розширення .md (якщо воно є)
    let cleanTitle = filename.replace(/\.md$/i, '');

    // 2. Відрізаємо "сміття" (хеш Notion).
    // Регулярка шукає:
    // [-\s=_]+      => один або більше розділювачів (пробіл, тире, підкреслення, знак дорівнює)
    // [a-zA-Z0-9]{25,45} => від 25 до 45 будь-яких букв та цифр (хеш)
    // $             => строго в кінці рядка
    cleanTitle = cleanTitle.replace(/[-\s=_]+[a-zA-Z0-9]{25,45}$/i, '');

    // 3. Шукаємо лінки Notion у контенті: [Назва](Назва%20ХЕШ.md)
    const links: string[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];
        
        // Якщо це внутрішній лінк (не веде на зовнішній сайт)
        if (!linkUrl.startsWith('http') && !linkUrl.startsWith('mailto:')) {
            // Очищаємо текст лінка за такою ж логікою, щоб гарантовано прибрати хеші
            const cleanLinkTitle = linkText.replace(/[-\s=_]+[a-zA-Z0-9]{25,45}$/i, '');
            links.push(cleanLinkTitle.trim());
        }
    }

    console.log('Call -> parseNotionFile() | original filename:', filename);
    console.log('Call -> parseNotionFile() | cleanTitle:', cleanTitle.trim());
    console.log('Call -> parseNotionFile() | found clean links:', links);

    return {
        title: cleanTitle.trim(),
        content: content,
        links: [...new Set(links)], // Прибираємо дублікати лінків всередині однієї нотатки
        tags: [] 
    };
}