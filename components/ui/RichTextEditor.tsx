import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Undo, Redo, Image as ImageIcon,
    Link as LinkIcon, Table as TableIcon, CodeSquare,
    Wand2, SpellCheck, Languages, RefreshCw, Loader2
} from 'lucide-react';
import { aiCall } from '../../lib/aiClient';
import { uploadAsset } from '../../services/supabaseService';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    onBlur?: () => void;
    placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    onBlur,
    placeholder = 'Start writing...'
}) => {
    const [isAILoading, setIsAILoading] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We use CodeBlockLowlight instead
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4'
                }
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-400 underline hover:text-indigo-300'
                }
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full my-4'
                }
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-white/20 bg-white/5 p-2 font-bold'
                }
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-white/20 p-2'
                }
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'bg-black/40 rounded-lg p-4 my-4 overflow-x-auto'
                }
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onBlur,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] text-white/90 leading-loose prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-400 prose-blockquote:border-l-indigo-500'
            },
            handlePaste: (view, event) => {
                const items = Array.from(event.clipboardData?.items || []);
                const imageItems = items.filter(item => item.type.startsWith('image'));

                if (imageItems.length > 0) {
                    event.preventDefault();

                    imageItems.forEach(async (item) => {
                        const file = item.getAsFile();
                        if (!file) return;

                        try {
                            const url = await uploadAsset(file);
                            view.dispatch(view.state.tr.insert(view.state.selection.to, view.state.schema.nodes.image.create({ src: url })));
                        } catch (err) {
                            console.error("Image upload failed:", err);
                        }
                    });
                    return true;
                }
                return false;
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        uploadAsset(file).then(url => {
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            view.dispatch(view.state.tr.insert(coordinates?.pos || view.state.selection.to, view.state.schema.nodes.image.create({ src: url })));
                        }).catch(err => {
                            console.error("Drag drop image upload failed", err);
                        });
                        return true;
                    }
                }
                return false;
            }
        }
    });

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                try {
                    const url = await uploadAsset(file);
                    if (editor) {
                        editor.chain().focus().setImage({ src: url }).run();
                    }
                } catch (err) {
                    console.error("Image upload failed:", err);
                    alert("Failed to upload image. Please try again.");
                }
            }
        };
        input.click();
    };

    const setLink = () => {
        // Native file picker for general attachments or a URL prompt
        const useUpload = window.confirm('Click OK to upload a file from your device, or Cancel to enter a web URL manually.');

        if (useUpload) {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    const file = target.files[0];
                    try {
                        const url = await uploadAsset(file);
                        if (editor) {
                            editor.chain().focus().setLink({ href: url }).insertContent(file.name).run();
                        }
                    } catch (err) {
                        console.error("File upload failed:", err);
                        alert("Failed to upload file. Please try again.");
                    }
                }
            };
            input.click();
        } else {
            const url = window.prompt('URL:');
            if (url && editor) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        }
    };

    const insertTable = () => {
        if (editor) {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
    };

    if (!editor) {
        return null;
    }

    const handleAIAction = async (action: string) => {
        if (!editor || isAILoading) return;

        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        const contextText = text || editor.getText();

        if (!contextText) return;

        setIsAILoading(true);
        try {
            const result = await aiCall(action, { text: contextText });

            if (result && result.text) {
                editor.chain().focus().insertContent(result.text).run();
            } else if (result && typeof result === 'string') {
                editor.chain().focus().insertContent(result).run(); // fallback if string
            }
        } catch (error) {
            console.error('AI Action failed:', error);
            alert('AI Action failed. See console.');
        } finally {
            setIsAILoading(false);
        }
    };

    return (
        <div className="rich-text-editor w-full group/editor">
            {/* Toolbar - Appears sticky but very clean */}
            <div className="sticky top-0 z-10 flex flex-wrap gap-1 py-2 bg-[#16181D]/90 backdrop-blur-md border border-[#2A2D35] rounded-lg mb-8 opacity-70 hover:opacity-100 transition-opacity duration-300 px-3 shadow-sm">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                    tooltip="Bold"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                    tooltip="Italic"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    icon={Strikethrough}
                    tooltip="Strikethrough"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    icon={Code}
                    tooltip="Inline Code"
                />

                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={Heading1}
                    tooltip="Heading 1"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                    tooltip="Heading 2"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    icon={Heading3}
                    tooltip="Heading 3"
                />

                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                    tooltip="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                    tooltip="Numbered List"
                />

                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Blocks */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                    tooltip="Quote"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    icon={CodeSquare}
                    tooltip="Code Block"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    icon={Minus}
                    tooltip="Divider"
                />

                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Media & Tables */}
                <ToolbarButton
                    onClick={addImage}
                    icon={ImageIcon}
                    tooltip="Insert Image"
                />
                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    icon={LinkIcon}
                    tooltip="Add Link"
                />
                <ToolbarButton
                    onClick={insertTable}
                    isActive={editor.isActive('table')}
                    icon={TableIcon}
                    tooltip="Insert Table"
                />

                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={Undo}
                    tooltip="Undo"
                    disabled={!editor.can().undo()}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={Redo}
                    tooltip="Redo"
                    disabled={!editor.can().redo()}
                />

                <div className="w-px h-6 bg-white/20 mx-1 border-r border-indigo-500/30" />
                <div className="flex items-center gap-1 bg-indigo-500/10 rounded-lg px-1 text-indigo-300">
                    <ToolbarButton icon={RefreshCw} tooltip="Rewrite" onClick={() => handleAIAction('rewrite')} disabled={isAILoading} />
                    <ToolbarButton icon={SpellCheck} tooltip="Fix Grammar" onClick={() => handleAIAction('fix_grammar')} disabled={isAILoading} />
                    <ToolbarButton icon={Languages} tooltip="Translate" onClick={() => handleAIAction('translate')} disabled={isAILoading} />
                    <ToolbarButton icon={Wand2} tooltip="Continue Writing" onClick={() => handleAIAction('continue_writing')} disabled={isAILoading} />
                    {isAILoading && <div className="p-1 px-2 text-indigo-400"><Loader2 size={16} className="animate-spin" /></div>}
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
};

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ElementType;
    tooltip: string;
    disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    onClick,
    isActive = false,
    icon: Icon,
    tooltip,
    disabled = false
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className={`
                p-1.5 rounded-md transition-all
                ${isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <Icon size={18} />
        </button>
    );
};
