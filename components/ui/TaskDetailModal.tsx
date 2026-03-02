import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Tag, Link as LinkIcon, AlertCircle, Repeat, CheckSquare } from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../store';
import { cn } from '../../lib/utils';

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    const { updateTask, tasks } = useApp();

    // Local state for editing to prevent jumping
    const [title, setTitle] = useState('');
    const [context, setContext] = useState<'work' | 'personal' | 'learning'>('work');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [estimatedTime, setEstimatedTime] = useState<string>('');
    const [tagsInput, setTagsInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [dependencySearch, setDependencySearch] = useState('');
    const [dependencies, setDependencies] = useState<string[]>([]);

    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title);
            setContext(task.context || 'work');
            setPriority(task.priority || 'medium');
            setEstimatedTime(task.estimatedTime ? task.estimatedTime.toString() : '');
            setTags(task.tags || []);
            setDependencies(task.dependencies || []);
            setTagsInput('');
            setDependencySearch('');
        }
    }, [task, isOpen]);

    const handleSave = () => {
        if (!task) return;

        updateTask(task.id, {
            title,
            context,
            priority,
            estimatedTime: estimatedTime ? parseInt(estimatedTime, 10) : undefined,
            tags,
            dependencies
        });
        onClose();
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagsInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagsInput.trim())) {
                setTags([...tags, tagsInput.trim()]);
            }
            setTagsInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const toggleDependency = (depId: string) => {
        if (dependencies.includes(depId)) {
            setDependencies(dependencies.filter(id => id !== depId));
        } else {
            setDependencies([...dependencies, depId]);
        }
    };

    // Filter available tasks for dependency linking (excluding self, and preventing circular logic simply by filtering out already dependent tasks if needed, but for now just exclude self)
    const availableTasks = tasks.filter(t => t.id !== task?.id && t.title.toLowerCase().includes(dependencySearch.toLowerCase()));

    if (!isOpen || !task) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-md h-full bg-[#16162a] border-l border-white/10 shadow-2xl flex flex-col z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateTask(task.id, { completed: !task.completed })}
                                className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center border transition-colors",
                                    task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/30 text-transparent hover:border-white/50"
                                )}
                            >
                                <CheckSquare size={14} />
                            </button>
                            <h2 className="text-lg font-bold text-white">Task Details</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                        {/* Title Section */}
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title..."
                                    className="w-full bg-transparent text-xl font-bold text-white placeholder:text-white/20 border-none outline-none focus:ring-0 p-0"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={context}
                                    onChange={(e) => setContext(e.target.value as any)}
                                    className="bg-white/5 border border-white/10 text-xs font-medium text-white/70 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="work" className="bg-[#1a1a2e]">Work</option>
                                    <option value="personal" className="bg-[#1a1a2e]">Personal</option>
                                    <option value="learning" className="bg-[#1a1a2e]">Learning</option>
                                </select>

                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="bg-white/5 border border-white/10 text-xs font-medium text-white/70 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="low" className="bg-[#1a1a2e]">Low Priority</option>
                                    <option value="medium" className="bg-[#1a1a2e]">Medium Priority</option>
                                    <option value="high" className="bg-[#1a1a2e]">High Priority</option>
                                </select>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Properties Grid */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Properties</h3>

                            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                <div className="flex items-center gap-2 text-sm text-white/50">
                                    <Clock size={16} /> Est. Time (min)
                                </div>
                                <input
                                    type="number"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    placeholder="e.g. 30"
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-[120px_1fr] gap-4 items-start pt-2">
                                <div className="flex items-center gap-2 text-sm text-white/50 mt-2">
                                    <Tag size={16} /> Tags
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map(tag => (
                                            <span key={tag} className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-500/20">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={tagsInput}
                                        onChange={(e) => setTagsInput(e.target.value)}
                                        onKeyDown={addTag}
                                        placeholder="Add tag and press Enter"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Dependencies */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <LinkIcon size={16} className="text-white/50" />
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Dependencies</h3>
                            </div>

                            <p className="text-xs text-white/40">Select tasks that must be completed before this one.</p>

                            <input
                                type="text"
                                value={dependencySearch}
                                onChange={(e) => setDependencySearch(e.target.value)}
                                placeholder="Search tasks to link..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 mb-2 placeholder:text-white/20"
                            />

                            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar border border-white/5 rounded-lg p-1 bg-black/20">
                                {availableTasks.length === 0 && <div className="text-xs text-white/30 p-2 text-center">No tasks found.</div>}
                                {availableTasks.map(t => {
                                    const isLinked = dependencies.includes(t.id);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => toggleDependency(t.id)}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors",
                                                isLinked ? "bg-indigo-500/20 text-indigo-200" : "hover:bg-white/5 text-white/70"
                                            )}
                                        >
                                            <span className="truncate pr-2">{t.title}</span>
                                            {isLinked && <CheckSquare size={14} className="text-indigo-400 shrink-0" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
