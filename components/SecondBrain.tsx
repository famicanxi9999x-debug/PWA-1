
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useApp } from '../store';
import {
    Search, Plus, Hash, Mic, Loader2, Folder,
    Star, Inbox, MoreHorizontal, FileText, LayoutGrid, List,
    ChevronRight, ChevronDown, ArrowLeft, Trash2, Wand2, Calendar, Clock,
    Download, Upload, Smile, Image as ImageIcon
} from 'lucide-react';
import { analyzeNoteContent, parseVoiceInput } from '../services/geminiService';
const RichTextEditor = lazy(() => import('./ui/RichTextEditor').then(m => ({ default: m.RichTextEditor })));
import { exportNote, exportAllNotes, downloadFile, downloadMultipleFiles, exportWorkspace } from '../utils/exporters';
import { importMarkdownNote, importWorkspaceBackup, readFileContent } from '../utils/importers';
import { Note, Folder as FolderType } from '../types';
import { aiCall } from '../lib/aiClient';

// --- Memoized Folder Item Component ---
interface FolderItemProps {
    folder: FolderType;
    depth: number;
    isExpanded: boolean;
    hasChildren: boolean;
    isActive: boolean;
    onToggleExpand: (id: string, e: React.MouseEvent) => void;
    onSelect: (id: string) => void;
    onAddSubfolder: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    childrenNodes?: React.ReactNode;
}

const MemoizedFolderItem = React.memo(({
    folder, depth, isExpanded, hasChildren, isActive,
    onToggleExpand, onSelect, onAddSubfolder, onDelete,
    onDragOver, onDragLeave, onDrop, childrenNodes
}: FolderItemProps) => {
    return (
        <div key={folder.id}>
            <div
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                className={`flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors group relative
                    ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                `}
                onDragOver={(e) => {
                    onDragOver(e);
                    e.currentTarget.classList.add('bg-indigo-500/20');
                }}
                onDragLeave={(e) => {
                    onDragLeave(e);
                    if (!isActive) e.currentTarget.classList.remove('bg-indigo-500/20');
                }}
                onDrop={(e) => onDrop(e, folder.id)}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1" onClick={() => onSelect(folder.id)}>
                    <div
                        className="w-4 flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={(e) => {
                            if (hasChildren) {
                                onToggleExpand(folder.id, e);
                            }
                        }}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />
                        ) : (
                            <div className="w-1" /> // Spacer
                        )}
                    </div>
                    <Folder size={16} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-white/40'}`} />
                    <span className="text-sm truncate leading-none">{folder.name}</span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 bg-transparent transition-opacity">
                    <button
                        onClick={(e) => onAddSubfolder(folder.id, e)}
                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                        title="Add sub-folder"
                    >
                        <Plus size={12} />
                    </button>
                    <button
                        onClick={(e) => onDelete(folder.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded text-white/40 hover:text-red-400"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Render Children if Expanded */}
            {isExpanded && hasChildren && (
                <div className="mt-0.5">
                    {childrenNodes}
                </div>
            )}
        </div>
    );
});

export const SecondBrain: React.FC = () => {
    const {
        notes, folders, addNote, updateNote, deleteNote, addFolder, deleteFolder, addTask,
        expandedFolders, toggleFolderExpansion
    } = useApp();

    // Navigation State
    const [activeFolderId, setActiveFolderId] = useState<string>('inbox');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);

    // Editor State
    const [editorTitle, setEditorTitle] = useState('');
    const [editorContent, setEditorContent] = useState('');

    // Interaction State
    const [searchTerm, setSearchTerm] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryData, setSummaryData] = useState<{ summary: string; key_points: string[] } | null>(null);

    // -- DERIVED DATA --
    const selectedNote = notes.find(n => n.id === selectedNoteId);
    const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

    const filteredNotes = notes.filter(n => {
        let matchesContext = true;

        if (activeTag) {
            matchesContext = n.tags.includes(activeTag);
        } else if (showFavoriteOnly) {
            matchesContext = n.isFavorite;
        } else {
            matchesContext = n.folderId === activeFolderId || (!n.folderId && activeFolderId === 'inbox');
        }

        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesContext && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // Sort by recent

    // -- EFFECTS --
    useEffect(() => {
        if (selectedNote) {
            setEditorTitle(selectedNote.title);
            setEditorContent(selectedNote.content);
            // Close mobile sidebar automatically when a note is picked
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        }
    }, [selectedNoteId, selectedNote]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (sidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    // -- HANDLERS --

    const handleCreateNote = () => {
        addNote("Untitled", "", [], activeFolderId === 'inbox' ? 'inbox' : activeFolderId);
    };

    const runAutoTag = async (noteId: string, htmlContent: string) => {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            if (!plainText.trim()) return;

            const response = await aiCall("auto_tag", { text: plainText });
            if (response && Array.isArray(response.tags)) {
                updateNote(noteId, { tags: response.tags });
            }
        } catch (error) {
            console.error("AI Auto-tagging failed:", error);
        }
    };

    const handleEditorBlur = () => {
        if (selectedNoteId) {
            updateNote(selectedNoteId, { title: editorTitle, content: editorContent });
            runAutoTag(selectedNoteId, editorContent);
        }
    };

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            addFolder(newFolderName);
            setNewFolderName('');
            setIsAddingFolder(false);
        }
    };

    const handleVoiceCapture = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported.");
            return;
        }
        if (isRecording) return;
        setIsRecording(true);
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        recognition.onresult = async (event: any) => {
            // Explicitly convert to string to avoid 'unknown' type errors
            const transcript = String(event.results?.[0]?.[0]?.transcript || "");
            setIsRecording(false);
            setIsProcessing(true);
            const result = await parseVoiceInput(transcript);
            if (result.type === 'TASK') {
                addTask(result.title, 'medium');
                alert(`✅ Added Task: ${result.title}`);
            } else {
                // Ensure content is a string
                const content = result.details || transcript;
                addNote(result.title, String(content), result.tags, 'inbox');
                alert(`📝 Added Note: ${result.title}`);
            }
            setIsProcessing(false);
        };
        recognition.onerror = () => { setIsRecording(false); setIsProcessing(false); };
        recognition.start();
    };

    const handleAISummarize = async () => {
        if (!editorContent) return;
        setIsSummarizing(true);
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = editorContent;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            if (!plainText.trim()) {
                setIsSummarizing(false);
                return;
            }

            const response = await aiCall("note_summary", { text: plainText });
            if (response && response.summary) {
                setSummaryData(response);
            }
        } catch (error) {
            console.error("AI Summary failed:", error);
            alert("Failed to summarize note. Please ensure the AI service is responding.");
        }
        setIsSummarizing(false);
    };

    const handleAIAnalyze = async () => {
        if (!editorContent) return;
        setIsProcessing(true);
        const analysis = await analyzeNoteContent(editorContent);
        if (selectedNoteId) {
            updateNote(selectedNoteId, { tags: analysis.tags });
        }
        setIsProcessing(false);
    };

    // Handle Icon and Cover Image Changes
    const handleAddIcon = () => {
        const emoji = window.prompt("Enter an emoji (e.g., 🚀, 📚, ✨):", "📝");
        if (emoji && selectedNoteId) {
            updateNote(selectedNoteId, { icon: emoji });
        }
    };

    const handleAddCover = () => {
        const url = window.prompt("Enter cover image URL (e.g., Unsplash link):", "https://images.unsplash.com/photo-1534796636912-3652c74ce522?auto=format&fit=crop&q=80&w=1200");
        if (url && selectedNoteId) {
            updateNote(selectedNoteId, { coverImage: url });
        }
    };

    const handleRemoveCover = () => {
        if (selectedNoteId) {
            updateNote(selectedNoteId, { coverImage: undefined });
        }
    };

    const handleRemoveIcon = () => {
        if (selectedNoteId) {
            updateNote(selectedNoteId, { icon: undefined });
        }
    };

    // Export/Import Handlers
    const handleExportNote = (noteId: string, format: 'markdown' | 'json' | 'html' = 'markdown') => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const content = exportNote(note, { format, includeMetadata: true });
        const extension = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'html';
        const filename = `${note.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

        downloadFile(filename, content);
    };

    const handleExportAllNotes = (format: 'markdown' | 'json' = 'markdown') => {
        const files = exportAllNotes(filteredNotes, format);
        downloadMultipleFiles(files);
    };

    const handleExportWorkspace = () => {
        const workspaceData = exportWorkspace({
            notes,
            tasks: [], // Would need to get from store
            folders,
            goals: [],
            events: [],
            settings: {}
        });

        const filename = `flowstate_backup_${new Date().toISOString().split('T')[0]}.json`;
        downloadFile(filename, workspaceData);
    };

    const handleImportMarkdown = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = await readFileContent(file);
                const importedNote = importMarkdownNote(file.name, content);

                addNote(
                    importedNote.title,
                    importedNote.content,
                    importedNote.tags,
                    activeFolderId
                );
            }

            alert(`Imported ${files.length} note(s) successfully!`);
        };

        input.click();
    };

    const handleImportWorkspace = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const content = await readFileContent(file);
                const data = importWorkspaceBackup(content);

                // Import notes
                data.notes?.forEach((note: any) => {
                    addNote(note.title, note.content, note.tags, note.folderId || 'inbox');
                });

                alert('Workspace imported successfully!');
            } catch (error) {
                alert('Failed to import workspace. Please check the file format.');
            }
        };

        input.click();
    };

    // Helper to switch contexts
    const selectFolder = (id: string) => {
        setActiveFolderId(id);
        setShowFavoriteOnly(false);
        setActiveTag(null);
        setSelectedNoteId(null);
    };

    const selectFavorites = () => {
        setShowFavoriteOnly(true);
        setActiveTag(null);
        setSelectedNoteId(null);
    };

    const selectTag = (tag: string) => {
        setActiveTag(tag);
        setShowFavoriteOnly(false);
        setSelectedNoteId(null);
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, noteId: string) => {
        e.dataTransfer.setData('noteId', noteId);
    };

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    }, []);

    const handleDropToFolder = React.useCallback((e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-indigo-500/20');
        const noteId = e.dataTransfer.getData('noteId');
        if (noteId) {
            updateNote(noteId, { folderId });
        }
    }, [updateNote]);

    const handleDragLeaveWrapper = React.useCallback((e: React.DragEvent) => {
        // Classlist manipulation is handled inside the component
    }, []);

    const handleToggleExpand = React.useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFolderExpansion(id);
    }, [toggleFolderExpansion]);

    const handleSelectFolder = React.useCallback((id: string) => {
        selectFolder(id);
    }, [selectFolder]);

    const handleAddSubfolder = React.useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        addFolder("New Folder", id);
        toggleFolderExpansion(id);
    }, [addFolder, toggleFolderExpansion]);

    const handleDeleteFolder = React.useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteFolder(id);
    }, [deleteFolder]);

    // --- Recursive Folder Rendering ---
    const renderFolderTree = (parentId?: string, depth: number = 0) => {
        const children = folders.filter(f => f.type === 'user' && f.parentId === parentId);
        if (children.length === 0) return null;

        return (
            <div className="space-y-0.5">
                {children.map(folder => {
                    const isExpanded = expandedFolders.includes(folder.id);
                    const hasChildren = folders.some(f => f.parentId === folder.id);
                    const isActive = !showFavoriteOnly && !activeTag && activeFolderId === folder.id;

                    return (
                        <MemoizedFolderItem
                            key={folder.id}
                            folder={folder}
                            depth={depth}
                            isExpanded={isExpanded}
                            hasChildren={hasChildren}
                            isActive={isActive}
                            onToggleExpand={handleToggleExpand}
                            onSelect={handleSelectFolder}
                            onAddSubfolder={handleAddSubfolder}
                            onDelete={handleDeleteFolder}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeaveWrapper}
                            onDrop={handleDropToFolder}
                            childrenNodes={renderFolderTree(folder.id, depth + 1)}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-full flex overflow-hidden bg-[#16181D] text-white font-sans rounded-md border border-[#2A2D35]">

            {/* Mobile Sidebar Overlay Backdrop */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 1. SIDEBAR NAVIGATION */}
            <div className={`
                fixed md:relative top-0 bottom-0 left-0 z-[100] md:z-auto
                w-[85vw] max-w-[340px] md:w-80 h-full
                bg-black/90 md:bg-black/30 backdrop-blur-2xl md:backdrop-blur-xl 
                border-r border-white/10 flex flex-col transition-transform duration-300 ease-spring
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${!sidebarOpen ? 'md:w-0 md:opacity-0 overflow-hidden md:border-none' : 'opacity-100'}
                flex-shrink-0
            `}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                    <div className="flex items-center gap-3 text-white/90 font-bold text-lg">
                        <div className="w-8 h-8 rounded bg-[#111113] text-white/80 border border-[#2A2D35] flex items-center justify-center text-sm font-bold">N</div>
                        <span>Notes</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-hide px-4">
                    {/* Primary Links */}
                    <div className="px-2 space-y-1">
                        <SidebarItem
                            icon={Search}
                            label="Quick Find"
                            onClick={() => document.getElementById('note-search')?.focus()}
                        />
                        <SidebarItem
                            icon={Star}
                            label="Favorites"
                            isActive={showFavoriteOnly && !activeTag}
                            onClick={selectFavorites}
                        />
                        <div className="space-y-0.5 mt-2">
                            {/* Inbox gets special drop target */}
                            <div
                                onDragOver={(e) => {
                                    handleDragOver(e);
                                    e.currentTarget.classList.add('bg-indigo-500/20');
                                }}
                                onDragLeave={(e) => {
                                    if (activeFolderId !== 'inbox') e.currentTarget.classList.remove('bg-indigo-500/20');
                                }}
                                onDrop={(e) => handleDropToFolder(e, 'inbox')}
                            >
                                <SidebarItem
                                    icon={Inbox}
                                    label="Inbox"
                                    isActive={!showFavoriteOnly && !activeTag && activeFolderId === 'inbox'}
                                    onClick={() => selectFolder('inbox')}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 mb-2 mt-4 text-xs font-bold text-white/40 uppercase tracking-wider group hover:text-white/70 transition-colors">
                            <span>Folders</span>
                            <button onClick={() => setIsAddingFolder(true)} className="hover:bg-white/10 rounded p-0.5 transition-colors"><Plus size={14} /></button>
                        </div>

                        {isAddingFolder && (
                            <form onSubmit={(e) => { handleCreateFolder(e); }} className="px-2 mb-2">
                                <input
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder:text-white/20"
                                    placeholder="Folder name..."
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onBlur={() => { if (!newFolderName) setIsAddingFolder(false); }} // Don't close if they type something
                                />
                            </form>
                        )}

                        <div className="space-y-0.5">
                            {/* Render root level folders (undefined parentId) */}
                            {renderFolderTree(undefined, 0)}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="px-3">
                        <div className="px-2 mb-2 text-xs font-bold text-white/40 uppercase tracking-wider">
                            Tags
                        </div>
                        <div className="space-y-0.5">
                            {allTags.length === 0 && <p className="px-2 text-xs text-white/30 italic">No tags yet</p>}
                            {allTags.map(tag => (
                                <SidebarItem
                                    key={tag}
                                    icon={Hash}
                                    label={tag}
                                    isActive={activeTag === tag}
                                    onClick={() => selectTag(tag)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* New Note Button */}
                <div className="p-3 border-t border-white/5 bg-black/20">
                    <button
                        onClick={handleCreateNote}
                        className="w-full py-3 rounded-md bg-[#1E2532] text-white border border-[#2A3F5C] font-bold shadow-sm hover:bg-[#252E3E] transition-all flex justify-center items-center gap-2 group"
                    >
                        <Plus size={18} className="transition-transform group-hover:rotate-90" />
                        New Note
                    </button>
                </div>
            </div>

            {/* 2. MAIN AREA */}
            <div className={`flex-1 flex flex-col min-w-0 bg-transparent relative transition-all ${!sidebarOpen ? 'md:pl-0' : ''}`}>

                {/* Top Toolbar (Sticky) */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-3 md:px-6 sticky top-0 bg-black/20 backdrop-blur-xl z-10 pt-[env(safe-area-inset-top)]">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Always show Menu button on mobile, toggle button on desktop */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${sidebarOpen ? 'text-white/40 hidden md:block' : 'text-white md:text-white/40'}`}
                        >
                            <LayoutGrid size={22} />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="hidden md:flex items-center gap-2 text-base text-white/50">
                            <span className="hover:text-white cursor-pointer transition-colors">
                                {activeTag ? `#${activeTag}` : (showFavoriteOnly ? 'Favorites' : folders.find(f => f.id === activeFolderId)?.name)}
                            </span>
                            {selectedNote && (
                                <>
                                    <span className="text-white/20">/</span>
                                    <span className="font-medium text-white/90 truncate max-w-[200px]">{selectedNote.title || "Untitled"}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group flex-1 md:flex-none">
                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-indigo-400 transition-colors" />
                            <input
                                id="note-search"
                                type="text"
                                placeholder="Search notes..."
                                className="pl-9 pr-3 py-1.5 bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10 focus:bg-white/10 focus:border-indigo-500 rounded-full text-sm focus:outline-none w-full md:w-40 transition-all focus:md:w-64 text-white placeholder:text-white/30"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>

                        <button
                            onClick={handleVoiceCapture}
                            disabled={isProcessing}
                            className={`p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block ${isRecording ? 'text-red-400 bg-red-900/20' : 'text-white/50'}`}
                            title="Voice Note"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                        </button>

                        {/* Export Dropdown */}
                        <div className="relative group">
                            <button
                                className="p-2 rounded-full text-white/50 hover:bg-white/10 transition-colors"
                                title="Export"
                            >
                                <Download size={18} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg py-2 px-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[200px] z-50">
                                {selectedNoteId ? (
                                    <>
                                        <button
                                            onClick={() => handleExportNote(selectedNoteId, 'markdown')}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Export as Markdown
                                        </button>
                                        <button
                                            onClick={() => handleExportNote(selectedNoteId, 'html')}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Export as HTML
                                        </button>
                                        <button
                                            onClick={() => handleExportNote(selectedNoteId, 'json')}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Export as JSON
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleExportAllNotes('markdown')}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Export All (Markdown)
                                        </button>
                                        <button
                                            onClick={() => handleExportAllNotes('json')}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Export All (JSON)
                                        </button>
                                        <div className="w-full h-px bg-white/10 my-1"></div>
                                        <button
                                            onClick={handleExportWorkspace}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            Backup Workspace
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Import Dropdown */}
                        <div className="relative group">
                            <button
                                className="p-2 rounded-full text-white/50 hover:bg-white/10 transition-colors"
                                title="Import"
                            >
                                <Upload size={18} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg py-2 px-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[200px] z-50">
                                <button
                                    onClick={handleImportMarkdown}
                                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                >
                                    Import Markdown
                                </button>
                                <div className="w-full h-px bg-white/10 my-1"></div>
                                <button
                                    onClick={handleImportWorkspace}
                                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                >
                                    Restore Workspace
                                </button>
                            </div>
                        </div>

                        {!selectedNoteId && (
                            <button
                                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                                className="p-2 rounded-full text-white/50 hover:bg-white/10 transition-colors"
                            >
                                {viewMode === 'list' ? <LayoutGrid size={18} /> : <List size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* MAIN CONTENT CONTAINER */}
                <div className="flex-1 overflow-hidden relative bg-transparent">

                    {/* VIEW: NOTE LIST */}
                    {(!selectedNoteId) ? (
                        <div className="absolute inset-0 overflow-y-auto p-8 md:p-12 bg-transparent">
                            <div className="max-w-7xl mx-auto">
                                {filteredNotes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center mt-32 text-white/30">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <FileText size={40} className="opacity-40" />
                                        </div>
                                        <p className="text-lg font-medium text-white/60">No notes here yet.</p>
                                        <p className="text-sm mb-6">Capture your thoughts to get started.</p>
                                        <button onClick={handleCreateNote} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-indigo-900/50">
                                            Create Note
                                        </button>
                                    </div>
                                ) : (
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                                        {filteredNotes.map(note => (
                                            <div
                                                key={note.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, note.id)}
                                                onClick={() => setSelectedNoteId(note.id)}
                                                className={`
                                          group bg-white/5 backdrop-blur-sm rounded-2xl cursor-pointer border border-white/5 shadow-sm hover:shadow-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]
                                          ${viewMode === 'grid' ? 'p-6 flex flex-col min-h-[380px]' : 'p-5 flex items-start gap-6 min-h-[120px]'}
                                      `}
                                                title="Drag to move to another folder"
                                            >
                                                <div className={`flex-1 overflow-hidden ${viewMode === 'grid' ? '' : 'flex items-center gap-4 w-full'}`}>
                                                    {viewMode === 'grid' ? (
                                                        <>
                                                            <h3 className="font-bold text-white mb-3 line-clamp-2 text-xl leading-tight flex items-center gap-2">
                                                                {note.icon && <span>{note.icon}</span>}
                                                                {note.title || "Untitled"}
                                                            </h3>
                                                            <p className="text-sm text-white/60 line-clamp-10 leading-relaxed whitespace-pre-wrap">{note.content || "Empty note..."}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 rounded-md bg-[#1E2532] text-white/70 flex items-center justify-center flex-shrink-0 border border-[#2A3F5C] text-2xl">
                                                                {note.icon ? note.icon : <FileText size={24} />}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-bold text-white text-lg mb-1">{note.title || "Untitled"}</h3>
                                                                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">{note.content || "No preview available"}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Card Footer */}
                                                <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mt-5 pt-4 border-t border-white/10' : 'gap-4 ml-auto'}`}>
                                                    <div className="flex items-center gap-2 text-xs text-white/30">
                                                        <Clock size={12} />
                                                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isFavorite: !note.isFavorite }); }}
                                                            className={`p-1.5 rounded hover:bg-white/10 ${note.isFavorite ? 'text-yellow-400' : 'text-white/40'}`}
                                                        >
                                                            <Star size={16} fill={note.isFavorite ? "currentColor" : "none"} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                            className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // VIEW: EDITOR (Unified Page Look)
                        <div className="absolute inset-0 overflow-y-auto bg-transparent animate-fade-in flex flex-col items-center">

                            {/* Editor Controls Overlay (Top Right) */}
                            <div className="absolute top-4 right-6 flex items-center gap-2 z-20">
                                <button
                                    onClick={handleAISummarize}
                                    disabled={isSummarizing}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                                    title="Summarize Note"
                                >
                                    {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                    <span className="hidden sm:inline">Summarize</span>
                                </button>
                                <button
                                    onClick={() => updateNote(selectedNote!.id, { isFavorite: !selectedNote!.isFavorite })}
                                    className={`p-2 rounded-full transition-colors ${selectedNote!.isFavorite ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                    <Star size={18} fill={selectedNote!.isFavorite ? "currentColor" : "none"} />
                                </button>
                                <button onClick={() => { deleteNote(selectedNoteId!); setSelectedNoteId(null); }} className="p-2 rounded-full bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                                <button onClick={() => setSelectedNoteId(null)} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium text-white/70 transition-colors">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            </div>

                            <div className="w-full max-w-3xl px-8 py-12 min-h-screen flex flex-col">

                                {/* Banner / Cover Area */}
                                {selectedNote!.coverImage ? (
                                    <div
                                        className="h-48 w-full mb-12 rounded-md bg-cover bg-center group relative border border-white/5"
                                        style={{ backgroundImage: `url(${selectedNote!.coverImage})` }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 flex gap-2">
                                            <button onClick={handleAddCover} className="bg-black/50 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm text-white/80 hover:text-white border border-white/10">
                                                Change Cover
                                            </button>
                                            <button onClick={handleRemoveCover} className="bg-black/50 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm text-white/80 hover:text-red-400 border border-white/10">
                                                Remove Cover
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full flex gap-3 mb-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={handleAddIcon} className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-1 rounded-md hover:bg-white/5">
                                            <Smile size={16} /> Add Icon
                                        </button>
                                        <button onClick={handleAddCover} className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-1 rounded-md hover:bg-white/5">
                                            <ImageIcon size={16} /> Add Cover
                                        </button>
                                    </div>
                                )}

                                {/* Icon Display (Floating if there's a cover) */}
                                {selectedNote!.icon && (
                                    <div className={`relative group w-max ${selectedNote!.coverImage ? '-mt-24 mb-6 ml-8' : 'mb-6'}`}>
                                        <div className="text-6xl cursor-pointer" onClick={handleAddIcon}>
                                            {selectedNote!.icon}
                                        </div>
                                        <div className="absolute top-0 right-[-30px] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={handleRemoveIcon} className="text-white/30 hover:text-red-400 p-1 bg-black/50 rounded-full">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Title Input */}
                                <input
                                    type="text"
                                    className="w-full text-5xl font-bold text-white placeholder:text-white/20 focus:outline-none bg-transparent mb-6 leading-tight"
                                    placeholder="Untitled"
                                    value={editorTitle}
                                    onChange={e => setEditorTitle(e.target.value)}
                                    onBlur={handleEditorBlur}
                                />

                                {/* Meta Row */}
                                <div className="flex flex-wrap items-center gap-4 mb-8 text-sm border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Folder size={16} className="text-white/40" />
                                        <div className="relative group">
                                            <span className="cursor-pointer hover:text-white transition-colors">
                                                {folders.find(f => f.id === selectedNote!.folderId)?.name || 'Inbox'}
                                            </span>
                                            <select
                                                className="absolute inset-0 opacity-0 cursor-pointer bg-black"
                                                value={selectedNote!.folderId}
                                                onChange={(e) => updateNote(selectedNoteId!, { folderId: e.target.value })}
                                            >
                                                <option value="inbox" className="bg-gray-900">Inbox</option>
                                                {folders.filter(f => f.type === 'user').map(f => <option key={f.id} value={f.id} className="bg-gray-900">{f.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="w-px h-4 bg-white/10"></div>
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Calendar size={16} className="text-white/40" />
                                        <span>{new Date(selectedNote!.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-px h-4 bg-white/10"></div>
                                    <div className="flex items-center gap-2">
                                        {selectedNote!.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-white/80 text-xs font-medium border border-white/5">
                                                <Hash size={10} /> {tag}
                                            </span>
                                        ))}
                                        <button onClick={handleAIAnalyze} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium ml-1">
                                            + AI Tag
                                        </button>
                                    </div>
                                </div>


                                {/* Content Editor */}
                                <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[500px] text-white/50 gap-4"><Loader2 className="animate-spin text-white/30" size={32} /><p className="text-sm font-medium">Loading Editor...</p></div>}>
                                    <RichTextEditor
                                        content={editorContent}
                                        onChange={setEditorContent}
                                        onBlur={handleEditorBlur}
                                        placeholder="Start writing..."
                                    />
                                </Suspense>
                            </div>

                            {/* Floating AI Button */}
                            <button
                                onClick={handleAIAnalyze}
                                disabled={isProcessing}
                                className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-[#1D212F] border border-[#2A314A] text-[#818CF8] rounded-full shadow-lg hover:border-[#3A415A] hover:scale-105 transition-all z-30 group"
                            >
                                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />}
                                <span className="font-semibold">AI Assistant</span>
                            </button>

                            {/* Summary Modal */}
                            {summaryData && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-[#111113] border border-[#2A2D35] rounded-md shadow-md w-full max-w-2xl p-6 animate-fade-in max-h-[90vh] flex flex-col">
                                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
                                            <Wand2 className="text-indigo-400" /> AI Note Summary
                                        </h3>
                                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                            <p className="text-white/80 leading-relaxed mb-6">{summaryData.summary}</p>
                                            {summaryData.key_points && summaryData.key_points.length > 0 && (
                                                <>
                                                    <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Key Points</h4>
                                                    <ul className="list-disc list-inside text-white/70 space-y-2 mb-2">
                                                        {summaryData.key_points.map((kp, idx) => (
                                                            <li key={idx} className="leading-relaxed">{kp}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10 flex-shrink-0">
                                            <button
                                                onClick={() => setSummaryData(null)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-sm font-medium transition-colors"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const kpList = summaryData.key_points && summaryData.key_points.length > 0
                                                        ? summaryData.key_points.map(kp => `<li>${kp}</li>`).join('')
                                                        : '';
                                                    const insertHtml = `
                                                        <blockquote>
                                                            <strong>✨ AI Summary</strong><br/>
                                                            ${summaryData.summary}
                                                            ${kpList ? `<br/><ul>${kpList}</ul>` : ''}
                                                        </blockquote><p></p>
                                                    `;
                                                    setEditorContent(insertHtml + editorContent);
                                                    setSummaryData(null);
                                                    updateNote(selectedNoteId!, { content: insertHtml + editorContent });
                                                }}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/50"
                                            >
                                                Insert at Top
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, isActive, onClick, onDelete }: any) => (
    <div
        onClick={onClick}
        className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all text-sm font-medium ${isActive ? 'bg-white/10 text-indigo-400 shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
    >
        <div className="flex items-center gap-3 truncate">
            <Icon size={18} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
            <span className="truncate">{label}</span>
        </div>
        {onDelete && (
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 rounded hover:bg-white/5"
            >
                <MoreHorizontal size={14} />
            </button>
        )}
    </div>
);
