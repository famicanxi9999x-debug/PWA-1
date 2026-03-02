// Import utilities for notes and workspace data

/**
 * Parse markdown frontmatter and content
 */
export const parseMarkdownWithFrontmatter = (markdown: string): {
    metadata: any;
    content: string;
} => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);

    if (match) {
        const [, frontmatter, content] = match;
        const metadata: any = {};

        frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();

                if (key.trim() === 'tags') {
                    metadata.tags = value.split(',').map(t => t.trim());
                } else {
                    metadata[key.trim()] = value;
                }
            }
        });

        return { metadata, content };
    }

    return { metadata: {}, content: markdown };
};

/**
 * Convert Markdown to HTML
 */
export const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Lists
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    const processedLines: string[] = [];

    lines.forEach(line => {
        const ulMatch = line.match(/^[\*\-] (.+)$/);
        const olMatch = line.match(/^\d+\. (.+)$/);

        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            processedLines.push(`<li>${ulMatch[1]}</li>`);
        } else if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            processedLines.push(`<li>${olMatch[1]}</li>`);
        } else {
            if (inList) {
                processedLines.push(`</${listType}>`);
                inList = false;
                listType = '';
            }
            processedLines.push(line);
        }
    });

    if (inList) {
        processedLines.push(`</${listType}>`);
    }

    html = processedLines.join('\n');

    // Paragraphs
    html = html.replace(/^(?!<[hou]|<pre|<blockquote)(.+)$/gim, '<p>$1</p>');

    // Clean up
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');
    html = html.replace(/<p><\/p>/g, '');

    return html;
};

/**
 * Import a single markdown file as a note
 */
export const importMarkdownNote = (filename: string, content: string) => {
    const { metadata, content: markdownContent } = parseMarkdownWithFrontmatter(content);

    // Extract title from metadata or filename
    let title = metadata.title || filename.replace(/\.md$/, '').replace(/_/g, ' ');

    // Remove leading # from content if title already exists
    let cleanContent = markdownContent.replace(/^# .*\n\n/, '');

    // Convert to HTML
    const htmlContent = markdownToHtml(cleanContent);

    return {
        title,
        content: htmlContent,
        contentType: 'html' as const,
        tags: metadata.tags || [],
        createdAt: metadata.created ? new Date(metadata.created) : new Date(),
        updatedAt: metadata.updated ? new Date(metadata.updated) : new Date(),
    };
};

/**
 * Import workspace backup JSON
 */
export const importWorkspaceBackup = (jsonContent: string): any => {
    try {
        const backup = JSON.parse(jsonContent);

        if (!backup.data) {
            throw new Error('Invalid backup format');
        }

        return backup.data;
    } catch (error) {
        console.error('Failed to import workspace backup:', error);
        throw new Error('Invalid backup file');
    }
};

/**
 * Read file content from File object
 */
export const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
