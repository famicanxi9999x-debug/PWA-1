import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import { Search, FileText, CheckSquare, Calendar, Folder, X } from 'lucide-react';
import { AppView, Task, Note } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type SearchResult =
    | { type: 'note', item: Note }
    | { type: 'task', item: Task }
    | { type: 'navigation', title: string, view: AppView, icon: React.ReactNode };

export const CommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, setCommandPaletteOpen, notes, tasks, setView } = useApp();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Default routes if query is empty
    const navigationOptions: SearchResult[] = [
        { type: 'navigation', title: 'Dashboard', view: AppView.DASHBOARD, icon: <Folder size={16} /> },
        { type: 'navigation', title: 'Notes Database', view: AppView.NOTES, icon: <FileText size={16} /> },
        { type: 'navigation', title: 'Task & Projects', view: AppView.PROJECTS, icon: <CheckSquare size={16} /> },
        { type: 'navigation', title: 'Schedule', view: AppView.SCHEDULE, icon: <Calendar size={16} /> },
    ];

    const generateResults = (): SearchResult[] => {
        if (!query.trim()) {
            return navigationOptions;
        }

        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        // Search Notes
        notes.forEach(note => {
            if (note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery) ||
                note.tags.some(t => t.toLowerCase().includes(lowerQuery))) {
                results.push({ type: 'note', item: note });
            }
        });

        // Search Tasks
        tasks.forEach(task => {
            if (task.title.toLowerCase().includes(lowerQuery)) {
                results.push({ type: 'task', item: task });
            }
        });

        return results.slice(0, 10); // Limit results for performance
    };

    const results = generateResults();

    useEffect(() => {
        if (isCommandPaletteOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isCommandPaletteOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isCommandPaletteOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                setCommandPaletteOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, results, selectedIndex]);

    const handleSelect = (result: SearchResult) => {
        setCommandPaletteOpen(false);
        if (result.type === 'navigation') {
            setView(result.view);
        } else if (result.type === 'note') {
            setView(AppView.NOTES);
            // In a real app we'd dispatch an event to open this specific Note ID.
        } else if (result.type === 'task') {
            setView(AppView.PROJECTS);
            // In a real app we'd dispatch an event to open this specific Task ID.
        }
    };

    if (!isCommandPaletteOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setCommandPaletteOpen(false)}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-2xl bg-[#111113] rounded-md shadow-md border border-[#2A2D35] overflow-hidden flex flex-col"
                >
                    {/* Input Area */}
                    <div className="flex items-center px-4 py-4 border-b border-[#2A2D35] bg-transparent">
                        <Search size={20} className="text-white/40 mr-3" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search for task, note..."
                            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-white/30"
                        />
                        <button onClick={() => setCommandPaletteOpen(false)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors ml-2">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                        {results.length === 0 ? (
                            <div className="px-4 py-8 text-center text-white/40">
                                No results found for "{query}"
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {results.map((result, idx) => {
                                    const isSelected = idx === selectedIndex;

                                    let icon = <FileText size={16} />;
                                    let title = '';
                                    let subtitle = '';

                                    if (result.type === 'navigation') {
                                        icon = <>{result.icon}</>;
                                        title = result.title;
                                        subtitle = 'Navigation';
                                    } else if (result.type === 'note') {
                                        icon = result.item.icon ? <span className="text-base leading-none">{result.item.icon}</span> : <FileText size={16} className="text-blue-400" />;
                                        title = result.item.title || "Untitled Note";
                                        subtitle = 'Note';
                                    } else if (result.type === 'task') {
                                        icon = <CheckSquare size={16} className={result.item.completed ? "text-emerald-400" : "text-amber-400"} />;
                                        title = result.item.title;
                                        subtitle = `Task • ${result.item.context || 'work'}`;
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(result)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-left",
                                                isSelected ? "bg-[#1E2532] shadow-[inset_0_0_0_1px_#2A3F5C]" : "hover:bg-white/5"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-md bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                                                {icon}
                                            </div>
                                            <div className="flex flex-col flex-1 truncate">
                                                <span className={cn("text-sm font-medium truncate transition-colors", isSelected ? "text-white" : "text-white/90")}>
                                                    {title}
                                                </span>
                                                <span className="text-xs text-white/40">{subtitle}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="shrink-0 text-[10px] text-white/80 font-bold bg-[#2A3F5C] px-2 py-1 rounded">
                                                    ENTER
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer / Hints */}
                    <div className="px-4 py-3 border-t border-[#2A2D35] bg-transparent flex items-center gap-4 text-[11px] text-white/40">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 font-mono">↑</kbd>
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 font-mono">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 font-mono">Enter</kbd>
                            to select
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 font-mono">Esc</kbd>
                            to close
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
