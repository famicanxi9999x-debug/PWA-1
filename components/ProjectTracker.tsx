import React, { useState } from 'react';
import { useApp } from '../store';
import { Task } from '../types';
import { Trophy, Target, TrendingUp, Star, LayoutList, KanbanSquare, Plus, CheckCircle, Circle, Trash2, Filter, Clock, Tag, Link as LinkIcon } from 'lucide-react';
import { TaskDetailModal } from './ui/TaskDetailModal';

const priorityColor = (p?: string) => {
    switch (p) {
        case 'high': return 'text-red-400 bg-red-900/20 border-red-900/30';
        case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-900/30';
        case 'low': return 'text-green-400 bg-green-900/20 border-green-900/30';
        default: return 'text-slate-400 bg-white/5';
    }
};

const TaskCard: React.FC<{ task: Task, onClick: () => void }> = ({ task, onClick }) => {
    const { toggleTask, deleteTask } = useApp();
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer bg-white/5 p-4 rounded-md border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all ${task.completed ? 'opacity-50' : ''}`}
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className="mt-0.5 text-white/30 hover:text-indigo-400 transition-colors"
                >
                    {task.completed ? <CheckCircle size={20} className="text-green-400" /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium text-white truncate ${task.completed ? 'line-through text-white/40' : ''}`}>{task.title}</h4>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {task.priority && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${priorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                        )}
                        {task.context && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60 uppercase tracking-wider">
                                {task.context}
                            </span>
                        )}

                        {task.estimatedTime && (
                            <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                                <Clock size={10} /> {task.estimatedTime}m
                            </span>
                        )}

                        {task.dependencies && task.dependencies.length > 0 && (
                            <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500/80 border border-amber-500/20">
                                <LinkIcon size={10} /> {task.dependencies.length}
                            </span>
                        )}

                        {task.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[80px]">
                                <Tag size={10} className="shrink-0" /> <span className="truncate">{tag}</span>
                            </span>
                        ))}
                        {task.tags && task.tags.length > 2 && (
                            <span className="text-[10px] text-white/30 ml-1">+{task.tags.length - 2}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-white/30 hover:text-red-400 transition-opacity rounded hover:bg-white/5"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export const ProjectTracker: React.FC = () => {
    const { stats, goals, tasks, addTask } = useApp();
    const [activeTab, setActiveTab] = useState<'tasks' | 'goals'>('tasks');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [newTaskContext, setNewTaskContext] = useState<'work' | 'personal' | 'learning'>('work');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Stats Logic
    const nextLevelExp = stats.level * 500;
    const progressPercent = Math.min((stats.exp / nextLevelExp) * 100, 100);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            addTask(newTaskTitle, newTaskPriority, newTaskContext);
            setNewTaskTitle('');
            setIsAddingTask(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto animate-fade-in">

            {/* Header Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 pb-0 gap-4">
                <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5' : 'text-white/50 hover:text-white/80'}`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('goals')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'goals' ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5' : 'text-white/50 hover:text-white/80'}`}
                    >
                        Goals & Stats
                    </button>
                </div>

                {/* Gamification Mini-Display */}
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Trophy size={16} className="text-yellow-400" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Lvl {stats.level}</span>
                        <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                {activeTab === 'tasks' ? (
                    // TASKS VIEW
                    <div className="flex flex-col h-full gap-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                                    title="List View"
                                >
                                    <LayoutList size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                                    title="Kanban Board"
                                >
                                    <KanbanSquare size={20} />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsAddingTask(!isAddingTask)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1E2532] text-white border border-[#2A3F5C] rounded-md hover:bg-[#252E3E] transition-colors shadow-sm"
                            >
                                <Plus size={18} /> New Task
                            </button>
                        </div>

                        {/* Add Task Form */}
                        {isAddingTask && (
                            <form onSubmit={handleAddTask} className="bg-white/5 p-4 rounded-md border border-white/10 animate-slide-up flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-white/40 uppercase">Task Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full mt-1 p-2 rounded-md border border-white/10 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                        placeholder="e.g., Write monthly report"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="text-xs font-bold text-white/40 uppercase">Context</label>
                                    <select
                                        className="w-full mt-1 p-2 rounded-md border border-white/10 bg-black/20 text-white"
                                        value={newTaskContext}
                                        onChange={(e: any) => setNewTaskContext(e.target.value)}
                                    >
                                        <option value="work" className="bg-gray-900">Work</option>
                                        <option value="personal" className="bg-gray-900">Personal</option>
                                        <option value="learning" className="bg-gray-900">Learning</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="text-xs font-bold text-white/40 uppercase">Priority</label>
                                    <select
                                        className="w-full mt-1 p-2 rounded-md border border-white/10 bg-black/20 text-white"
                                        value={newTaskPriority}
                                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                                    >
                                        <option value="high" className="bg-gray-900">High</option>
                                        <option value="medium" className="bg-gray-900">Medium</option>
                                        <option value="low" className="bg-gray-900">Low</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full md:w-auto px-6 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">
                                    Add
                                </button>
                            </form>
                        )}

                        {viewMode === 'list' ? (
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-20 text-white/40">No tasks yet. Create one!</div>
                                ) : (
                                    tasks.map(task => <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />)
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {['work', 'personal', 'learning'].map(ctx => (
                                    <div key={ctx} className="flex-none w-[85vw] max-w-[320px] sm:flex-1 min-w-[280px] h-[calc(100vh-280px)] min-h-[400px] flex flex-col bg-white/5 rounded-md border border-white/5 p-4 snap-center">
                                        <div className="flex items-center justify-between mb-4 shrink-0">
                                            <h3 className="font-bold text-white/60 uppercase tracking-wider text-sm">{ctx}</h3>
                                            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
                                                {tasks.filter(t => t.context === ctx && !t.completed).length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 pb-4">
                                            {tasks.filter(t => t.context === ctx).map(task => (
                                                <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // GOALS VIEW
                    <div className="flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                        {/* Level Stats */}
                        <div className="bg-[#1E2532] border border-[#2A3F5C] rounded-md p-8 text-white shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-md backdrop-blur-sm">
                                        <Trophy size={32} className="text-yellow-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">Level {stats.level}</h2>
                                        <p className="text-indigo-100">Productivity Master</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-mono font-bold">{stats.exp}</p>
                                    <p className="text-xs text-indigo-200 uppercase tracking-widest">Total EXP</p>
                                </div>
                            </div>

                            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-1000"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-xs mt-2 text-indigo-200">{Math.floor(nextLevelExp - stats.exp)} XP to next level</p>
                        </div>

                        {/* Goals Grid */}
                        <div>
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Target size={18} className="text-indigo-400" /> Active Goals
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goals.map(goal => (
                                    <div key={goal.id} className="bg-white/5 p-6 rounded-md border border-white/5 shadow-sm hover:border-white/20 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${goal.type === 'life' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                    {goal.type} Goal
                                                </span>
                                                <h4 className="text-lg font-medium text-white mt-2">{goal.title}</h4>
                                            </div>
                                            <button className="text-white/30 hover:text-yellow-400 transition-colors">
                                                <Star size={18} />
                                            </button>
                                        </div>

                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-2xl font-bold text-white">{goal.progress}%</span>
                                            <span className="text-sm text-white/40 mb-1">completed</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-2 border-dashed border-white/10 rounded-md flex items-center justify-center p-6 text-white/40 hover:border-[#2A3F5C] hover:text-white cursor-pointer transition-colors min-h-[160px]">
                                    <div className="text-center">
                                        <Target className="mx-auto mb-2 opacity-50" size={24} />
                                        <p className="text-sm font-medium">Set New Goal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Task Modal */}
            <TaskDetailModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
};