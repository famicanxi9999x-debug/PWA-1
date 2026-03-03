import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';
import { Home, Zap, Book, CheckSquare, Moon, Command, Calendar, ChevronRight, Search, Settings, X, LogIn, LogOut, User, Edit3, BarChart2, Layers, Compass, Loader2, Bell, Database } from 'lucide-react';
import ExpandOnHover from './ui/expand-cards';
import { aiCall } from '../lib/aiClient';
import { supabase } from '../lib/supabase';
import { SupabaseTest } from './SupabaseTest';
import { CommandPalette } from './ui/CommandPalette';

interface NavigationItem {
    target: AppView;
    icon: React.ElementType;
    label: string;
    subtitle: string;
}

interface MenuGroup {
    label: string;
    items: NavigationItem[];
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { view, setView, addNote, addTask, userAvatar, setUserAvatar, userName, setUserName, logout, isLoggedIn, setShowLoginPage, setCommandPaletteOpen, highContrast, toggleHighContrast } = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [isTestingSupabase, setIsTestingSupabase] = useState(false);
    const [showSupabaseTest, setShowSupabaseTest] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // PWA Install Prompt Listener
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const handleInstallApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Default premium gradient avatar for guests
    const defaultAvatarUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop";

    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Command+K Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
            if (e.key === 'Escape') {
                setShowSettings(false);
                setShowProfileMenu(false); // Close profile menu on escape
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const menuGroups: MenuGroup[] = [
        {
            label: "Main",
            items: [
                { target: AppView.DASHBOARD, icon: Home, label: "Hub", subtitle: "Start here" },
                { target: AppView.FOCUS, icon: Zap, label: "Time", subtitle: "Timer" },
                { target: AppView.SCHEDULE, icon: Calendar, label: "Schedule", subtitle: "Calendar" },
            ]
        },
        {
            label: "Deep Work",
            items: [
                { target: AppView.PROJECTS, icon: CheckSquare, label: "Projects", subtitle: "Tasks" },
                { target: AppView.NOTES, icon: Book, label: "Notes", subtitle: "Knowledge Base" },
            ]
        },
        {
            label: "Insight",
            items: [
                { target: AppView.REPORTS, icon: BarChart2, label: "Reports", subtitle: "Stats" },
                { target: AppView.REVIEW, icon: Moon, label: "Review", subtitle: "Shutdown" },
            ]
        }
    ];

    return (
        <div className="flex flex-col md:flex-row h-screen text-slate-100 overflow-hidden font-sans relative pt-[env(safe-area-inset-top)]">
            {isOffline && (
                <div className="absolute top-0 left-0 right-0 z-[100] bg-amber-600/90 text-white text-xs font-medium py-1.5 px-4 text-center backdrop-blur-sm shadow-md border-b border-amber-500/50 flex items-center justify-center gap-2 animate-slide-down">
                    <Zap size={14} className="fill-amber-200 text-amber-200" />
                    You are offline. Displaying cached data. Changes may not sync until reconnected.
                </div>
            )}
            {/* GLOBAL BACKGROUND - Applied here to ensure coverage */}
            <div className="fixed inset-0 bg-[#111113] -z-50"></div>

            {/* DESKTOP SIDEBAR - CONTROL CENTER STYLE */}
            <nav className="hidden md:flex w-[260px] h-full flex-col bg-[#111113] border-r border-[#2A2D35] relative z-20 p-5 gap-2">

                {/* Header / Profile Button */}
                <div className="px-2 pb-6 mb-2 relative" ref={profileMenuRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-full flex items-center justify-between gap-3 p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={userAvatar || defaultAvatarUrl}
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full border-2 border-white/10 object-cover shadow-sm group-hover:border-indigo-500/50 transition-colors"
                            />
                            <div className="text-left">
                                <h2 className="text-sm font-bold tracking-tight text-white group-hover:text-white/80 transition-colors">
                                    {userName || "Guest"}
                                </h2>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#4FD1C5] flex items-center gap-1 mt-0.5">
                                    PRO PLAN <span className="text-[10px] rendering-intent-picture text-white/90">💎</span>
                                </p>
                            </div>
                        </div>
                        <Settings size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                    </button>

                    {/* Profile Popover Menu */}
                    {showProfileMenu && (
                        <div className="absolute top-16 left-0 w-[320px] bg-[#111113] border border-[#2A2D35] rounded-md shadow-md p-5 z-50 animate-fade-in flex flex-col gap-6">

                            {/* Display Name Edit */}
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2A3F5C] transition-colors placeholder:text-white/20"
                                    placeholder="Enter your name"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            {/* Avatar Selection */}
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Choose Avatar</label>
                                <div className="bg-black/20 rounded-md border border-white/5 p-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                    <ExpandOnHover onSelect={setUserAvatar} selectedUrl={userAvatar} />
                                </div>
                            </div>

                            {/* Preferences Area */}
                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleHighContrast(); }}
                                    className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-sm font-semibold transition-colors
                                        ${highContrast ? 'bg-white/10 text-white' : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} />
                                        High Contrast Mode
                                    </div>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${highContrast ? 'bg-indigo-500' : 'bg-white/20'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${highContrast ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Testing / Debug Area */}
                            {import.meta.env.DEV && (
                                <div className="pt-4 border-t border-white/10 space-y-2">
                                    <button
                                        onClick={async () => {
                                            if (isTestingAI) return;
                                            setIsTestingAI(true);
                                            try {
                                                const result = await aiCall("auto_tag", { text: "learning javascript and productivity" });
                                                console.log("AI Test Result:", result);
                                                alert("Success! AI Tags: " + JSON.stringify(result.tags || result));
                                            } catch (err: any) {
                                                console.error("AI Test Error:", err);
                                                alert("Error: " + err.message);
                                            } finally {
                                                setIsTestingAI(false);
                                            }
                                        }}
                                        disabled={isTestingAI}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 text-sm font-semibold rounded-md hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {isTestingAI ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                        {isTestingAI ? "Testing..." : "Test AI Worker"}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!('Notification' in window)) {
                                                alert('This browser does not support desktop notification');
                                                return;
                                            }
                                            const permission = await Notification.requestPermission();
                                            if (permission === 'granted') {
                                                alert('Push Notifications Enabled! Fameo will now send you gentle reminders.');
                                            } else {
                                                alert('Notifications blocked. You can change this in your browser settings.');
                                            }
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-semibold rounded-md hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Bell size={16} /> {/* Placeholder icon, prefer Bell if available */}
                                        Enable Notifications
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowSupabaseTest(true);
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-sm font-semibold rounded-md hover:bg-emerald-500/20 transition-colors"
                                    >
                                        <Database size={16} />
                                        Supabase Dev Tools
                                    </button>
                                </div>
                            )}

                            {/* Session Management */}
                            <div className="pt-4 border-t border-white/10">
                                {isLoggedIn ? (
                                    <button
                                        onClick={() => { logout(); setShowProfileMenu(false); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 text-sm font-semibold rounded-md hover:bg-red-500/20 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setShowLoginPage(true); setShowProfileMenu(false); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-[#2A3F5C] text-white/80 text-sm font-semibold rounded-md hover:bg-white/10 transition-colors"
                                    >
                                        <User size={16} /> Sign In
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items Grouped */}
                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar -mr-2 pr-2">
                    {menuGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">{group.label}</h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = view === item.target;
                                    return (
                                        <button
                                            key={item.label}
                                            onClick={() => setView(item.target)}
                                            className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full text-left
                                        ${isActive
                                                    ? 'bg-white/10 text-white shadow-sm'
                                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                }
                                    `}
                                        >
                                            <item.icon size={18} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Install App Prompt */}
                {deferredPrompt && (
                    <div className="px-4 mt-2 animate-fade-in">
                        <button
                            onClick={handleInstallApp}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#172521] border border-[#203D33] text-[#6EE7B7] font-medium rounded-lg shadow-sm hover:border-[#2D5447] hover:bg-[#1C2C28] transition-all group"
                        >
                            <Compass size={16} className="group-hover:animate-spin" />
                            Install App
                        </button>
                    </div>
                )}

                {/* Footer / Controls */}
                <div className="pt-4 mt-2 border-t border-white/5 space-y-3">
                    <button
                        onClick={() => setCommandPaletteOpen(true)}
                        className="w-full py-2.5 px-4 bg-[#1E2532] border border-[#2A3F5C] rounded-lg text-xs font-bold text-[#60A5FA] flex items-center justify-between hover:bg-[#252E3E] transition-all group shadow-sm"
                    >
                        <span className="flex items-center gap-2"><Search size={14} className="group-hover:text-white" /> Search</span>
                        <span className="text-[9px] bg-[#16181D] border border-[#2A2D35] px-1.5 py-0.5 rounded text-[#60A5FA]">⌘K</span>
                    </button>

                    <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] text-white/20 font-medium">Fameo v1.2</div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-white/30 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                            title="Settings"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(5rem+env(safe-area-inset-bottom))] bg-[#111113]/95 backdrop-blur-xl border-t border-[#2A2D35] flex items-start justify-around px-2 z-50 pt-2 pb-[env(safe-area-inset-bottom)]">
                {[AppView.DASHBOARD, AppView.SCHEDULE, AppView.FOCUS, AppView.NOTES].map((target) => {
                    const item = menuGroups.flatMap(g => g.items).find(i => i.target === target);
                    if (!item) return null;
                    const isActive = view === item.target;
                    return (
                        <button
                            key={item.label}
                            onClick={() => setView(item.target)}
                            className="flex flex-col items-center gap-1 p-2 w-full"
                        >
                            <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                        ${isActive
                                    ? 'bg-[#1E2532] text-[#60A5FA] border border-[#2A3F5C]'
                                    : 'text-white/40'
                                }
                     `}>
                                <item.icon size={20} strokeWidth={2} />
                            </div>
                        </button>
                    )
                })}
                {/* Mobile FAB */}
                <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 w-12 h-12 bg-[#1E2532] border border-[#2A3F5C] rounded-lg flex items-center justify-center text-[#60A5FA] shadow-lg md:hidden hover:bg-[#252E3E]"
                >
                    <Search size={20} />
                </button>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto scroll-smooth pb-[calc(theme(spacing.24)+env(safe-area-inset-bottom))] md:pb-0">
                <div className={`h-full ${view === AppView.NOTES ? '' : 'max-w-7xl mx-auto p-4 md:p-10'}`}>
                    {children}
                </div>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-2xl bg-[#111113] rounded-md shadow-md overflow-hidden animate-slide-up mx-4 border border-[#2A2D35] max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between p-6 border-b border-[#2A2D35] sticky top-0 bg-[#111113] z-20">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings size={20} className="text-white/40" /> Account Settings
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="text-white/50 text-center py-10">
                                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Workspace settings are currently migrated to the profile menu.</p>
                                <p className="text-sm mt-2">More advanced settings coming soon.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Supabase Dev Tools Modal */}
            {showSupabaseTest && (
                <SupabaseTest onClose={() => setShowSupabaseTest(false)} />
            )}

            {/* Global Command Palette */}
            <CommandPalette />
        </div>
    );
};
