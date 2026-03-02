import React, { useState } from 'react';
import { Folder as FolderType } from '../../types';
import { Folder, ChevronRight, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2, Palette } from 'lucide-react';

interface FolderTreeProps {
    folders: FolderType[];
    activeFolderId: string;
    onSelectFolder: (id: string) => void;
    onAddSubfolder: (parentId: string) => void;
    onUpdateFolder: (id: string, updates: Partial<FolderType>) => void;
    onDeleteFolder: (id: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
    folders,
    activeFolderId,
    onSelectFolder,
    onAddSubfolder,
    onUpdateFolder,
    onDeleteFolder
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['inbox']));
    const [editingFolder, setEditingFolder] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    // Build folder hierarchy
    const buildTree = (parentId: string | undefined = undefined): FolderType[] => {
        return folders
            .filter(f => f.parentId === parentId)
            .sort((a, b) => {
                // System folders first, then alphabetical
                if (a.type === 'system' && b.type !== 'system') return -1;
                if (a.type !== 'system' && b.type === 'system') return 1;
                return a.name.localeCompare(b.name);
            });
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedFolders(newExpanded);
    };

    const startEdit = (folder: FolderType) => {
        setEditingFolder(folder.id);
        setEditName(folder.name);
        setMenuOpen(null);
    };

    const saveEdit = () => {
        if (editingFolder && editName.trim()) {
            onUpdateFolder(editingFolder, { name: editName.trim() });
        }
        setEditingFolder(null);
        setEditName('');
    };

    const renderFolder = (folder: FolderType, depth: number = 0): React.ReactNode => {
        const children = buildTree(folder.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isActive = activeFolderId === folder.id;
        const isEditing = editingFolder === folder.id;

        return (
            <div key={folder.id}>
                <div
                    className={`
                        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                        ${isActive ? 'bg-indigo-600 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                    style={{ paddingLeft: `${depth * 20 + 12}px` }}
                >
                    {/* Expand/Collapse Button */}
                    {hasChildren ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(folder.id);
                            }}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    ) : (
                        <div className="w-[18px]" /> // Spacer
                    )}

                    {/* Folder Icon with Color */}
                    <div
                        className="flex-shrink-0"
                        style={{ color: folder.color || 'currentColor' }}
                        onClick={() => !isEditing && onSelectFolder(folder.id)}
                    >
                        <Folder size={16} fill={folder.color ? folder.color : 'none'} />
                    </div>

                    {/* Folder Name */}
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') {
                                    setEditingFolder(null);
                                    setEditName('');
                                }
                            }}
                            className="flex-1 bg-white/10 text-white px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="flex-1 text-sm truncate"
                            onClick={() => onSelectFolder(folder.id)}
                        >
                            {folder.name}
                        </span>
                    )}

                    {/* Actions Menu */}
                    {folder.type === 'user' && (
                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(menuOpen === folder.id ? null : folder.id);
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <MoreHorizontal size={14} />
                            </button>

                            {menuOpen === folder.id && (
                                <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg py-1 px-1 min-w-[160px] z-50 shadow-xl">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddSubfolder(folder.id);
                                            setMenuOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                    >
                                        <Plus size={14} />
                                        Add Subfolder
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(folder);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                    >
                                        <Pencil size={14} />
                                        Rename
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Future: Open color picker
                                            const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                            onUpdateFolder(folder.id, { color: randomColor });
                                            setMenuOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded text-sm text-white/80 hover:text-white transition-colors"
                                    >
                                        <Palette size={14} />
                                        Change Color
                                    </button>
                                    <div className="w-full h-px bg-white/10 my-1"></div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteFolder(folder.id);
                                            setMenuOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 rounded text-sm text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {children.map(child => renderFolder(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const rootFolders = buildTree(undefined);

    return (
        <div className="space-y-1">
            {rootFolders.map(folder => renderFolder(folder, 0))}
        </div>
    );
};
