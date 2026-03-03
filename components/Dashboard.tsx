
import React, { useEffect, useState } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';
import { suggestDailyPlan } from '../services/geminiService';
import { GlowCard } from './ui/spotlight-card';
import { Activity, Smile, Meh, Frown, Target, Calendar, FileText, TrendingUp, Clock, BookOpen, CheckSquare, Circle, Check } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { userName, tasks, events, notes, setView, stats, updateTask } = useApp();
    const [suggestion, setSuggestion] = useState<string>('Initializing Workspace...');
    const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);

    const incompleteTasks = tasks.filter(t => !t.completed);
    const todayTasks = incompleteTasks.slice(0, 5);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

    useEffect(() => {
        const fetchPlan = async () => {
            if (incompleteTasks.length > 0) {
                const plan = await suggestDailyPlan(incompleteTasks.map(t => t.title), greeting);
                setSuggestion(plan);
            } else {
                setSuggestion("You're all caught up! Great job organizing your space.");
            }
        };
        fetchPlan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-5 md:space-y-8 animate-fade-in text-white pt-2 pb-4">

            {/* Welcome Header — Compact on mobile */}
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:pb-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <span className="hidden md:inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-3">
                            Workspace Hub
                        </span>
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                            Good {greeting}, {userName}👋
                        </h1>
                        <p className="text-white/50 text-sm md:text-base max-w-xl leading-relaxed mt-1 line-clamp-2 md:line-clamp-none">
                            {suggestion}
                        </p>
                    </div>

                    {/* Inline Mood — compact */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Mood</span>
                        <div className="flex gap-2">
                            <button onClick={() => setMood('happy')} className={`transition-all active:scale-90 ${mood === 'happy' ? 'text-green-400 scale-125' : 'text-white/30 hover:text-green-400'}`}><Smile size={18} /></button>
                            <button onClick={() => setMood('neutral')} className={`transition-all active:scale-90 ${mood === 'neutral' ? 'text-yellow-400 scale-125' : 'text-white/30 hover:text-yellow-400'}`}><Meh size={18} /></button>
                            <button onClick={() => setMood('sad')} className={`transition-all active:scale-90 ${mood === 'sad' ? 'text-red-400 scale-125' : 'text-white/30 hover:text-red-400'}`}><Frown size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TODAY'S TASKS (TickTick-style — mobile priority) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Today's Focus</h2>
                    </div>
                    <button onClick={() => setView(AppView.PROJECTS)} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                        View all →
                    </button>
                </div>

                <div className="space-y-2">
                    {todayTasks.length === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <Check size={18} className="text-green-400" />
                            <span className="text-sm text-white/50">All caught up! Great work. 🎉</span>
                        </div>
                    ) : (
                        todayTasks.map(task => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/[0.07] hover:bg-white/10 active:scale-[0.99] transition-all"
                            >
                                <button
                                    onClick={() => updateTask(task.id, { completed: true })}
                                    className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 hover:border-indigo-400 transition-colors active:bg-indigo-500/30"
                                >
                                    <Circle size={10} className="text-white/20" />
                                </button>
                                <span className="flex-1 text-sm text-white/80 truncate">{task.title}</span>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-400' :
                                        task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Widgets Hub — adaptive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

                {/* 1. Focus & Tasks */}
                <div className="cursor-pointer" onClick={() => setView(AppView.PROJECTS)}>
                    <GlowCard glowColor="cyan" customSize width="100%" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col gap-3 p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#162024] flex items-center justify-center border border-[#1E2D36]">
                                    <Target className="text-[#4FD1C5]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Focus & Tasks</h3>
                                    <p className="text-xs text-white/40">{incompleteTasks.length} pending</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {incompleteTasks.slice(0, 10).map(task => (
                                    <div key={task.id} className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                ))}
                                {incompleteTasks.length === 0 && <p className="text-xs text-white/30 text-center py-4">All caught up! 🎉</p>}
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 2. Upcoming Schedule */}
                <div className="cursor-pointer" onClick={() => setView(AppView.SCHEDULE)}>
                    <GlowCard glowColor="purple" customSize width="100%" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col gap-3 p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1D212F] flex items-center justify-center border border-[#2A314A]">
                                    <Calendar className="text-[#818CF8]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Schedule</h3>
                                    <p className="text-xs text-white/40">{events.length} events</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {events.slice(0, 10).map(event => (
                                    <div key={event.id} className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 flex items-center gap-2">
                                        <Clock size={10} className="text-white/30 shrink-0" />
                                        <span className="truncate">{event.title}</span>
                                        <span className="ml-auto text-[10px] text-white/30 shrink-0">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                                {events.length === 0 && <p className="text-xs text-white/30 text-center py-4">No events scheduled.</p>}
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 3. Recent Notes */}
                <div className="cursor-pointer" onClick={() => setView(AppView.NOTES)}>
                    <GlowCard glowColor="blue" customSize width="100%" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col gap-3 p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1E2532] flex items-center justify-center border border-[#2A3F5C]">
                                    <BookOpen className="text-[#60A5FA]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Recent Notes</h3>
                                    <p className="text-xs text-white/40">{notes.length} notes</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {notes.slice(0, 10).map(note => (
                                    <div key={note.id} className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 flex items-center gap-2">
                                        <FileText size={10} className="text-white/30 shrink-0" />
                                        <span className="truncate">{note.title || "Untitled Note"}</span>
                                    </div>
                                ))}
                                {notes.length === 0 && <p className="text-xs text-white/30 text-center py-4">No notes created yet.</p>}
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 4. Flow & Activity */}
                <div className="cursor-pointer" onClick={() => setView(AppView.REPORTS)}>
                    <GlowCard glowColor="green" customSize width="100%" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col gap-3 p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#172521] flex items-center justify-center border border-[#203D33]">
                                    <Activity className="text-[#6EE7B7]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Flow & Activity</h3>
                                    <p className="text-xs text-white/40">Level {stats.level} · {stats.exp} XP</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-xs text-white/50 flex items-center gap-1.5"><CheckSquare size={11} /> Focus Today</span>
                                    <span className="text-xs font-bold text-green-400">{stats.focusMinutesToday}m</span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-xs text-white/50 flex items-center gap-1.5"><TrendingUp size={11} /> Streak</span>
                                    <span className="text-xs font-bold text-emerald-400">{stats.streak} days</span>
                                </div>
                                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                        <span>XP</span>
                                        <span>{stats.exp}/{stats.level * 500}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1D24] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#6EE7B7] rounded-full" style={{ width: `${Math.min((stats.exp / (stats.level * 500)) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                </div>
            </div>
        </div>
    );
};
