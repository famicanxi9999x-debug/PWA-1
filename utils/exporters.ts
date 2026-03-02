// Export utilities for notes and workspace data

export interface ExportOptions {
    format: 'markdown' | 'json' | 'html';
    includeMetadata?: boolean;
}

/**
 * Convert HTML content to Markdown
 */
export const htmlToMarkdown = (html: string): string => {
    let markdown = html;

    // Headers
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');

    // Bold and italic
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');

    // Links
    markdown = markdown.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)');

    // Images
    markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)".*?>/g, '![$2]($1)');
    markdown = markdown.replace(/<img src="(.*?)".*?>/g, '![]($1)');

    // Lists
    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    });
    markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
        let counter = 1;
        return content.replace(/<li>(.*?)<\/li>/g, () => {
            return `${counter++}. $1\n`;
        });
    });

    // Code blocks
    markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n\n');
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');

    // Blockquotes
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gs, (match, content) => {
        return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    });

    // Horizontal rule
    markdown = markdown.replace(/<hr\s*\/?>/g, '\n---\n\n');

    // Paragraphs
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Clean up excessive newlines
    markdown = markdown.replace(/\n\n\n+/g, '\n\n');

    return markdown.trim();
};

/**
 * Export a single note
 */
export const exportNote = (note: any, options: ExportOptions = { format: 'markdown' }): string => {
    const { format, includeMetadata = true } = options;

    if (format === 'markdown') {
        let output = '';

        if (includeMetadata) {
            output += '---\n';
            output += `title: ${note.title}\n`;
            output += `created: ${new Date(note.createdAt).toISOString()}\n`;
            output += `updated: ${new Date(note.updatedAt).toISOString()}\n`;
            if (note.tags && note.tags.length > 0) {
                output += `tags: ${note.tags.join(', ')}\n`;
            }
            output += '---\n\n';
        }

        output += `# ${note.title}\n\n`;

        // Convert HTML to markdown if needed
        const content = note.contentType === 'html'
            ? htmlToMarkdown(note.content)
            : note.content;

        output += content;

        return output;
    }

    if (format === 'json') {
        return JSON.stringify(note, null, 2);
    }

    if (format === 'html') {
        let output = `<!DOCTYPE html>\n<html>\n<head>\n`;
        output += `<meta charset="UTF-8">\n`;
        output += `<title>${note.title}</title>\n`;
        output += `<style>body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }</style>\n`;
        output += `</head>\n<body>\n`;
        output += `<h1>${note.title}</h1>\n`;

        if (includeMetadata) {
            output += `<p><small>Created: ${new Date(note.createdAt).toLocaleString()}</small></p>\n`;
            if (note.tags && note.tags.length > 0) {
                output += `<p>Tags: ${note.tags.map(tag => `<span style="background: #ddd; padding: 2px 8px; border-radius: 3px; margin-right: 5px;">${tag}</span>`).join('')}</p>\n`;
            }
            output += `<hr>\n`;
        }

        output += note.content;
        output += `\n</body>\n</html>`;

        return output;
    }

    return '';
};

/**
 * Export all notes as a ZIP-like structure (returns object with filenames and content)
 */
export const exportAllNotes = (notes: any[], format: 'markdown' | 'json' = 'markdown'): { [filename: string]: string } => {
    const files: { [filename: string]: string } = {};

    notes.forEach((note, index) => {
        const sanitizedTitle = note.title
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .substring(0, 50);

        const timestamp = new Date(note.createdAt).getTime();
        const extension = format === 'markdown' ? 'md' : 'json';
        const filename = `${timestamp}_${sanitizedTitle}.${extension}`;

        files[filename] = exportNote(note, { format, includeMetadata: true });
    });

    return files;
};

/**
 * Download a file to user's computer
 */
export const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Download multiple files as individual downloads
 */
export const downloadMultipleFiles = (files: { [filename: string]: string }) => {
    Object.entries(files).forEach(([filename, content], index) => {
        // Stagger downloads to avoid browser blocking
        setTimeout(() => {
            downloadFile(filename, content);
        }, index * 100);
    });
};

/**
 * Export workspace data (all notes, tasks, folders) as JSON backup
 */
export const exportWorkspace = (data: any): string => {
    const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
            notes: data.notes || [],
            tasks: data.tasks || [],
            folders: data.folders || [],
            goals: data.goals || [],
            events: data.events || [],
            settings: data.settings || {}
        }
    };

    return JSON.stringify(backup, null, 2);
};
