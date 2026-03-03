
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RefreshCw, Volume2, Maximize2, Minimize2, CheckCircle, Headphones, Settings, X, Save, History, Timer, Minimize } from 'lucide-react';
import { useApp } from '../store';

export const FocusHub: React.FC = () => {
    const { tasks, toggleTask, addExp, focusSettings, updateFocusSettings, addFocusSession, focusHistory } = useApp();

    // Initialize timer with global settings
    const [timeLeft, setTimeLeft] = useState(focusSettings.focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sessionType, setSessionType] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');

    // Local state for editing settings
    const [editSettings, setEditSettings] = useState(focusSettings);

    const toggleSound = (soundType: string) => {
        if (activeSound === soundType) {
            setActiveSound(null);
        } else {
            setActiveSound(soundType);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCompleteSession = useCallback(() => {
        setIsActive(false);

        // Save to history
        let duration = 0;
        if (sessionType === 'focus') duration = focusSettings.focusDuration;
        if (sessionType === 'shortBreak') duration = focusSettings.shortBreakDuration;
        if (sessionType === 'longBreak') duration = focusSettings.longBreakDuration;

        addFocusSession(duration, sessionType);

        if (sessionType === 'focus') {
            addExp(100);
            // Default switch to short break after focus
            setSessionType('shortBreak');
            setTimeLeft(focusSettings.shortBreakDuration * 60);
            alert("Focus Session Complete! 100 XP gained. Time for a break?");
        } else {
            setSessionType('focus');
            setTimeLeft(focusSettings.focusDuration * 60);
            alert("Break over! Ready to focus?");
        }

        if (activeSound) setActiveSound(null);
    }, [addExp, activeSound, sessionType, focusSettings, addFocusSession]);

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleCompleteSession();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, handleCompleteSession]);

    const switchSession = (type: 'focus' | 'shortBreak' | 'longBreak') => {
        setIsActive(false);
        setSessionType(type);
        if (type === 'focus') setTimeLeft(focusSettings.focusDuration * 60);
        if (type === 'shortBreak') setTimeLeft(focusSettings.shortBreakDuration * 60);
        if (type === 'longBreak') setTimeLeft(focusSettings.longBreakDuration * 60);
    };

    const saveSettings = () => {
        updateFocusSettings(editSettings);
        setShowSettings(false);
        // Reset current timer if it matches the edited type
        if (sessionType === 'focus') setTimeLeft(editSettings.focusDuration * 60);
        if (sessionType === 'shortBreak') setTimeLeft(editSettings.shortBreakDuration * 60);
        if (sessionType === 'longBreak') setTimeLeft(editSettings.longBreakDuration * 60);
        setIsActive(false);
    };

    const activeTask = tasks.find(t => !t.completed && t.priority === 'high');
    const totalDuration = sessionType === 'focus' ? focusSettings.focusDuration * 60
        : sessionType === 'shortBreak' ? focusSettings.shortBreakDuration * 60
            : focusSettings.longBreakDuration * 60;
    const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

    // Mobile fullscreen mode — auto-triggers when timer starts
    const handleStartTimer = () => {
        setIsActive(true);
        if (window.innerWidth < 768) {
            setIsMobileFullscreen(true);
        }
    };

    // Mobile Fullscreen Timer Overlay
    if (isMobileFullscreen) {
        return (
            <div className="fixed inset-0 z-[200] bg-[#0a0a0f] flex flex-col items-center justify-center gap-8" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}>

                {/* Glow blur behind clock */}
                <div className={`absolute w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors ${sessionType === 'focus' ? 'bg-indigo-500' : 'bg-green-400'
                    } ${isActive ? 'animate-pulse' : ''}`} />

                {/* Session type pill */}
                <div className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${sessionType === 'focus' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}>
                    {sessionType === 'focus' ? '🎯 Focus' : sessionType === 'shortBreak' ? '☕ Short Break' : '🛌 Long Break'}
                </div>

                {/* Clock */}
                <div className="relative">
                    <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff10" strokeWidth="3" />
                        <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke={sessionType === 'focus' ? '#818CF8' : '#6EE7B7'}
                            strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-bold tracking-tight tabular-nums text-white">{formatTime(timeLeft)}</span>
                        <span className="text-sm text-white/40 mt-1">{isActive ? 'Stay in flow...' : 'Ready'}</span>
                    </div>
                </div>

                {/* Active task */}
                {activeTask && sessionType === 'focus' && (
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 max-w-[80vw]">
                        <p className="text-xs text-white/40 text-center mb-1">Current task</p>
                        <p className="text-sm text-white font-medium text-center truncate">{activeTask.title}</p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => { setIsActive(false); const d = sessionType === 'focus' ? focusSettings.focusDuration : sessionType === 'shortBreak' ? focusSettings.shortBreakDuration : focusSettings.longBreakDuration; setTimeLeft(d * 60); }}
                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
                    >
                        <RefreshCw size={22} />
                    </button>
                    <button
                        onClick={() => setIsActive(p => !p)}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-2xl ${isActive ? 'bg-amber-500 shadow-amber-500/30' : 'bg-indigo-500 shadow-indigo-500/40'
                            }`}
                    >
                        {isActive ? <Pause size={32} fill="white" className="text-white" /> : <Play size={32} fill="white" className="text-white ml-1" />}
                    </button>
                    <button
                        onClick={() => setIsMobileFullscreen(false)}
                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
                    >
                        <Minimize size={22} />
                    </button>
                </div>

                {/* Session pickers */}
                <div className="flex gap-2">
                    {(['focus', 'shortBreak', 'longBreak'] as const).map(t => (
                        <button key={t} onClick={() => switchSession(t)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${sessionType === t ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white'
                            }`}>
                            {t === 'focus' ? 'Focus' : t === 'shortBreak' ? 'Short' : 'Long'}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col transition-all duration-700 ${isZenMode ? 'fixed inset-0 z-50 bg-[#0f0f1a] text-white p-12' : 'p-6 max-w-4xl mx-auto bg-transparent'}`}>

            {/* Top Controls */}
            <div className={`flex justify-between items-center ${isZenMode ? 'absolute top-6 right-6 left-6' : ''}`}>
                {!isZenMode && <h2 className="text-xl font-semibold text-white">Time Hub</h2>}
                <div className={`flex gap-3 ${isZenMode ? 'ml-auto' : ''}`}>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-full transition-colors hover:bg-white/10 text-white/60 hover:text-white border border-white/10 ${showHistory ? 'bg-white/10 text-white' : ''}`}
                        title="History"
                    >
                        <History size={20} />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`p-2 rounded-full transition-colors hover:bg-white/10 text-white/60 hover:text-white border border-white/10`}
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={`p-2 rounded-full transition-colors hover:bg-white/10 text-white/60 hover:text-white border border-white/10`}
                    >
                        {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative">

                {/* History Overlay Panel */}
                {showHistory && (
                    <div className="absolute top-0 right-0 h-full w-80 bg-[#111113] rounded-md border border-[#2A2D35] shadow-md z-20 animate-fade-in p-6 overflow-y-auto custom-scrollbar">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <History size={18} className="text-indigo-400" /> Recent Sessions
                        </h3>
                        {focusHistory.length === 0 ? (
                            <p className="text-white/40 text-sm">No sessions completed yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {focusHistory.slice(0, 10).map((session, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${session.type === 'focus' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-green-500/20 text-green-400'}`}>
                                                <Timer size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white capitalize">{session.type}</p>
                                                <p className="text-xs text-white/40">{new Date(session.completedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-white/80">{session.duration}m</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Timer Display */}
                <div className="text-center relative">
                    <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-transparent'}`}></div>
                    <div className="relative z-10 flex justify-center gap-4 mb-8">
                        <button onClick={() => switchSession('focus')} className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-md transition-colors ${sessionType === 'focus' ? 'bg-[#1E2532] text-[#818CF8] border border-[#2A3F5C]' : 'text-white/40 hover:text-white'}`}>Focus</button>
                        <button onClick={() => switchSession('shortBreak')} className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-md transition-colors ${sessionType === 'shortBreak' ? 'bg-[#1C2C28] text-[#6EE7B7] border border-[#203D33]' : 'text-white/40 hover:text-white'}`}>Short Break</button>
                        <button onClick={() => switchSession('longBreak')} className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-md transition-colors ${sessionType === 'longBreak' ? 'bg-[#1F2937] text-white/90 border border-[#374151]' : 'text-white/40 hover:text-white'}`}>Long Break</button>
                    </div>

                    <h1 className={`font-medium tracking-tight tabular-nums text-white/90 ${isZenMode ? 'text-[12rem] leading-none' : 'text-8xl'}`}>
                        {formatTime(timeLeft)}
                    </h1>
                    <p className={`mt-4 text-lg text-white/50`}>
                        {isActive ? (sessionType === 'focus' ? 'Stay in Flow' : 'Recharge') : 'Ready to Start?'}
                    </p>
                </div>

                {/* Current Task Context - Only show during focus */}
                {activeTask && sessionType === 'focus' && (
                    <div className={`text-center max-w-lg text-white/80`}>
                        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Current Objective</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-medium">{activeTask.title}</span>
                            <button onClick={() => toggleTask(activeTask.id)} className="opacity-50 hover:opacity-100 hover:text-green-400 transition-opacity">
                                <CheckCircle size={24} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => isActive ? setIsActive(false) : handleStartTimer()}
                        className={`w-16 h-16 rounded-md flex items-center justify-center transition-all transform hover:scale-105 ${isActive ? 'bg-[#2D2A26] text-[#FBBF24] border border-[#453A2A]' : 'bg-[#1E2532] text-white border border-[#2A3F5C] shadow-sm'}`}
                    >
                        {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={() => {
                            setIsActive(false);
                            if (sessionType === 'focus') setTimeLeft(focusSettings.focusDuration * 60);
                            else if (sessionType === 'shortBreak') setTimeLeft(focusSettings.shortBreakDuration * 60);
                            else setTimeLeft(focusSettings.longBreakDuration * 60);
                        }}
                        className={`p-4 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10`}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111113] rounded-md shadow-lg p-6 w-full max-w-sm m-4 text-white animate-slide-up border border-[#2A2D35]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Timer Settings</h3>
                            <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-1">Focus Duration (min)</label>
                                <input
                                    type="number"
                                    value={editSettings.focusDuration}
                                    onChange={(e) => setEditSettings({ ...editSettings, focusDuration: parseInt(e.target.value) || 1 })}
                                    className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-1">Short Break (min)</label>
                                <input
                                    type="number"
                                    value={editSettings.shortBreakDuration}
                                    onChange={(e) => setEditSettings({ ...editSettings, shortBreakDuration: parseInt(e.target.value) || 1 })}
                                    className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-1">Long Break (min)</label>
                                <input
                                    type="number"
                                    value={editSettings.longBreakDuration}
                                    onChange={(e) => setEditSettings({ ...editSettings, longBreakDuration: parseInt(e.target.value) || 1 })}
                                    className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={saveSettings}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
