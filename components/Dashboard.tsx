
import React, { useEffect, useState } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';
import { suggestDailyPlan } from '../services/geminiService';
import { GlowCard } from './ui/spotlight-card';
import { Activity, Smile, Meh, Frown, Target, Calendar, FileText, TrendingUp, Clock, BookOpen, CheckSquare } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { userName, tasks, events, notes, setView, stats } = useApp();
    const [suggestion, setSuggestion] = useState<string>('Initializing Workspace...');
    const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);

    const incompleteTasks = tasks.filter(t => !t.completed);

    useEffect(() => {
        const fetchPlan = async () => {
            if (incompleteTasks.length > 0) {
                const plan = await suggestDailyPlan(incompleteTasks.map(t => t.title), "Morning");
                setSuggestion(plan);
            } else {
                setSuggestion("You're all caught up! Great job organizing your space.");
            }
        };
        fetchPlan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-white py-4">

            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-6">
                <div>
                    <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-3">
                        Workspace Hub
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {userName}
                    </h1>
                    <p className="text-white/50 text-base max-w-xl leading-relaxed">
                        {suggestion}
                    </p>
                </div>

                {/* Mini Mood Tracker */}
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-md border border-white/5">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Mood</span>
                    <div className="flex gap-3">
                        <button onClick={() => setMood('happy')} className={`transition-all hover:scale-125 ${mood === 'happy' ? 'text-green-400 scale-125' : 'text-white/40 hover:text-green-400'}`}><Smile size={20} /></button>
                        <button onClick={() => setMood('neutral')} className={`transition-all hover:scale-125 ${mood === 'neutral' ? 'text-yellow-400 scale-125' : 'text-white/40 hover:text-yellow-400'}`}><Meh size={20} /></button>
                        <button onClick={() => setMood('sad')} className={`transition-all hover:scale-125 ${mood === 'sad' ? 'text-red-400 scale-125' : 'text-white/40 hover:text-red-400'}`}><Frown size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Action Widgets Hub — 2×2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* 1. Focus & Tasks */}
                <div className="cursor-pointer" onClick={() => setView(AppView.PROJECTS)}>
                    <GlowCard glowColor="cyan" customSize width="100%" height="280px" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col h-full gap-3 p-5">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-[#162024] flex items-center justify-center border border-[#1E2D36]">
                                    <Target className="text-[#4FD1C5]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Focus & Tasks</h3>
                                    <p className="text-xs text-white/40">{incompleteTasks.length} pending tasks</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                    {incompleteTasks.slice(0, 20).map(task => (
                                        <div key={task.id} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white/70 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                                            <span className="truncate">{task.title}</span>
                                        </div>
                                    ))}
                                    {incompleteTasks.length === 0 && <p className="text-xs text-white/30 text-center py-6">All caught up! 🎉</p>}
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 2. Upcoming Schedule */}
                <div className="cursor-pointer" onClick={() => setView(AppView.SCHEDULE)}>
                    <GlowCard glowColor="purple" customSize width="100%" height="280px" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col h-full gap-3 p-5">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-[#1D212F] flex items-center justify-center border border-[#2A314A]">
                                    <Calendar className="text-[#818CF8]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Upcoming Schedule</h3>
                                    <p className="text-xs text-white/40">{events.length} upcoming events</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                    {events.slice(0, 20).map(event => (
                                        <div key={event.id} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white/70 flex flex-col">
                                            <span className="truncate">{event.title}</span>
                                            <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                    {events.length === 0 && <p className="text-xs text-white/30 text-center py-6">No events scheduled.</p>}
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 3. Recent Notes */}
                <div className="cursor-pointer" onClick={() => setView(AppView.NOTES)}>
                    <GlowCard glowColor="blue" customSize width="100%" height="280px" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col h-full gap-3 p-5">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-[#1E2532] flex items-center justify-center border border-[#2A3F5C]">
                                    <BookOpen className="text-[#60A5FA]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Recent Notes</h3>
                                    <p className="text-xs text-white/40">{notes.length} total notes</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                    {notes.slice(0, 20).map(note => (
                                        <div key={note.id} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white/70 flex flex-col">
                                            <span className="truncate">{note.title || "Untitled Note"}</span>
                                            <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                                                <FileText size={10} /> {new Date(note.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                    {notes.length === 0 && <p className="text-xs text-white/30 text-center py-6">No notes created yet.</p>}
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                </div>

                {/* 4. Flow & Activity */}
                <div className="cursor-pointer" onClick={() => setView(AppView.REPORTS)}>
                    <GlowCard glowColor="green" customSize width="100%" height="280px" className="hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex flex-col h-full gap-3 p-5">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-[#172521] flex items-center justify-center border border-[#203D33]">
                                    <Activity className="text-[#6EE7B7]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Flow & Activity</h3>
                                    <p className="text-xs text-white/40">Level {stats.level} · {stats.exp} XP</p>
                                </div>
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="w-full px-4 py-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                                    <span className="text-xs text-white/50 flex items-center gap-2"><CheckSquare size={12} /> Focus Today</span>
                                    <span className="font-bold text-green-400">{stats.focusMinutesToday}m</span>
                                </div>
                                <div className="w-full px-4 py-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                                    <span className="text-xs text-white/50 flex items-center gap-2"><TrendingUp size={12} /> Current Streak</span>
                                    <span className="font-bold text-emerald-400">{stats.streak} days</span>
                                </div>
                                <div className="w-full px-4 py-3 rounded bg-white/5 border border-white/10 flex flex-col gap-2">
                                    <div className="flex justify-between text-xs text-white/50">
                                        <span>XP Progress</span>
                                        <span>{stats.exp} / {stats.level * 500}</span>
                                    </div>
                                    <div className="w-full h-1 bg-[#1A1D24] rounded-full overflow-hidden border border-[#2A2D35]">
                                        <div
                                            className="h-full bg-[#6EE7B7] rounded-full opacity-80"
                                            style={{ width: `${Math.min((stats.exp / (stats.level * 500)) * 100, 100)}%` }}
                                        />
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
