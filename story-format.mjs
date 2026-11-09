// A small writing format: paragraphs, headings, emphasis, links, lists, and media.
const destination = String.raw`((?:[^()\s]|\([^()\s]*\))+)`;
const imagePattern = new RegExp(String.raw`^!\[([^\]]*)\]\(${destination}\)$`);
const inlinePattern = new RegExp(
    String.raw`\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(${destination}\)|(?<!\\)\$([^$\n]+)\$|\\\((.+?)\\\)`, 'g'
);

function classify(line) {
    let match;
    if ((match = line.match(/^@details\s+(.+)$/))) {
        return { type: 'details', title: match[1] };
    }
    if ((match = line.match(/^@math\s+(.+)$/))) {
        return { type: 'math', text: match[1] };
    }
    if ((match = line.match(/^(#{2,3})\s+(.+)$/))) {
        return { type: 'heading', level: match[1].length, text: match[2] };
    }
    if ((match = line.match(imagePattern))) {
        return { type: 'image', caption: match[1], url: match[2] };
    }
    if ((match = line.match(/^@image-right\s+(\S+)(?:\s+\|\s*(.*))?$/))) {
        return { type: 'image', align: 'right', url: match[1], caption: match[2] || '' };
    }
    if ((match = line.match(/^@video-right\s+(\S+)(?:\s+\|\s*(.*))?$/))) {
        return { type: 'video', align: 'right', url: match[1], caption: match[2] || '' };
    }
    if ((match = line.match(/^@video\s+(\S+)(?:\s+\|\s*(.*))?$/))) {
        return { type: 'video', url: match[1], caption: match[2] || '' };
    }
    if ((match = line.match(/^-\s+(.+)$/))) {
        return { type: 'ul', text: match[1] };
    }
    if ((match = line.match(/^(\d+)\.\s+(.+)$/))) {
        return { type: 'ol', start: Number(match[1]), text: match[2] };
    }
    if ((match = line.match(/^>\s?(.*)$/))) {
        return { type: 'quote', text: match[1] };
    }
    return { type: 'paragraph', text: line };
}

export function parseStory(source) {
    const lines = source.replace(/\r\n?/g, '\n')
        .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
        .split('\n').map(line => line.trim());
    const blocks = [];

    for (let index = 0; index < lines.length;) {
        if (!lines[index]) {
            index++;
            continue;
        }
        const block = classify(lines[index++]);
        if (block.type === 'details') {
            const body = [];
            let depth = 1;
            while (index < lines.length && depth > 0) {
                const line = lines[index++];
                if (/^@details\s+.+$/.test(line)) depth++;
                if (line === '@enddetails') depth--;
                if (depth > 0) body.push(line);
            }
            blocks.push({ ...block, blocks: parseStory(body.join('\n')) });
            continue;
        }
        if (['paragraph', 'quote', 'ul', 'ol'].includes(block.type)) {
            const items = [block.text];
            while (index < lines.length && lines[index]) {
                const next = classify(lines[index]);
                if (next.type !== block.type) break;
                items.push(next.text);
                index++;
            }
            if (block.type === 'ul' || block.type === 'ol') {
                blocks.push({ type: block.type, start: block.start, items });
            } else {
                blocks.push({ type: block.type, text: items.join(' ') });
            }
        } else {
            blocks.push(block);
        }
    }
    return blocks;
}

function safeUrl(raw, document, media = false) {
    try {
        const url = new URL(raw, document.baseURI);
        const allowed = media ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:'];
        return allowed.includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function driveVideoPreview(url) {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'drive.google.com' || !match) {
        return null;
    }
    const preview = new URL(`https://drive.google.com/file/d/${match[1]}/preview`);
    const resourceKey = parsed.searchParams.get('resourcekey');
    if (resourceKey) preview.searchParams.set('resourcekey', resourceKey);
    return preview.href;
}

function appendInline(element, text, document) {
    let position = 0;
    // matchAll uses a fresh iterator, so inline parsing has no shared cursor.
    for (const match of text.matchAll(inlinePattern)) {
        element.append(document.createTextNode(text.slice(position, match.index)));
        const [, bold, italic, label, rawUrl, dollarMath, bracketMath] = match;
        const math = dollarMath || bracketMath;
        if (math) {
            const span = document.createElement('span');
            span.className = 'story-inline-math';
            span.textContent = `\\(${math}\\)`;
            element.append(span);
            position = match.index + match[0].length;
            continue;
        }
        const url = rawUrl ? safeUrl(rawUrl, document) : null;
        if (bold || italic || url) {
            const child = document.createElement(bold ? 'strong' : italic ? 'em' : 'a');
            child.textContent = bold || italic || label;
            if (url) {
                child.href = url;
                if (/^https?:/.test(url) && !rawUrl.startsWith('#')) {
                    child.target = '_blank';
                    child.rel = 'noopener noreferrer';
                }
            }
            element.append(child);
        } else {
            element.append(document.createTextNode(match[0]));
        }
        position = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(position)));
}

export function renderStory(blocks, document) {
    const fragment = document.createDocumentFragment();
    for (const block of blocks) {
        if (block.type === 'details') {
            const details = document.createElement('details');
            details.className = 'story-details';
            const summary = document.createElement('summary');
            appendInline(summary, block.title, document);
            const body = document.createElement('div');
            body.className = 'story-details-body';
            body.append(renderStory(block.blocks, document));
            details.append(summary, body);
            fragment.append(details);
            continue;
        }
        if (block.type === 'math') {
            const equation = document.createElement('div');
            equation.className = 'story-equation';
            equation.textContent = `\\[${block.text}\\]`;
            fragment.append(equation);
            continue;
        }
        if (block.type === 'image' || block.type === 'video') {
            const url = safeUrl(block.url, document, true);
            if (!url) continue;
            const drivePreview = block.type === 'video' ? driveVideoPreview(url) : null;
            const figure = document.createElement('figure');
            if (block.align === 'right') {
                figure.className = block.type === 'image' ? 'story-image-right' : 'story-video-right';
            }
            const media = document.createElement(block.type === 'image' ? 'img' : drivePreview ? 'iframe' : 'video');
            media.src = drivePreview || url;
            if (block.type === 'image') {
                media.alt = block.caption;
                media.loading = 'lazy';
                media.decoding = 'async';
            } else if (drivePreview) {
                media.className = 'story-video-frame';
                media.title = block.caption || 'Google Drive video';
                media.loading = 'lazy';
                media.allow = 'fullscreen';
                media.allowFullscreen = true;
            } else {
                media.controls = true;
                media.preload = 'metadata';
                media.playsInline = true;
                media.textContent = 'Your browser cannot play this video. ';
                const download = document.createElement('a');
                download.href = url;
                download.target = '_blank';
                download.rel = 'noopener noreferrer';
                download.textContent = 'Open the video';
                media.append(download);
            }
            figure.append(media);
            if (block.caption) {
                const caption = document.createElement('figcaption');
                caption.textContent = block.caption;
                figure.append(caption);
            }
            if (drivePreview) {
                const fallback = document.createElement('a');
                fallback.className = 'story-video-link';
                fallback.href = url;
                fallback.target = '_blank';
                fallback.rel = 'noopener noreferrer';
                fallback.textContent = 'Open video in Google Drive';
                figure.append(fallback);
            }
            fragment.append(figure);
            continue;
        }

        if (block.type === 'ul' || block.type === 'ol') {
            const list = document.createElement(block.type);
            if (block.type === 'ol') list.start = block.start;
            for (const text of block.items) {
                const item = document.createElement('li');
                appendInline(item, text, document);
                list.append(item);
            }
            fragment.append(list);
            continue;
        }

        const element = document.createElement(block.type === 'heading'
            ? `h${block.level + 2}` : block.type === 'quote' ? 'blockquote' : 'p');
        appendInline(element, block.text, document);
        fragment.append(element);
    }
    return fragment;
}
