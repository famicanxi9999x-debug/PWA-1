
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';
import { Home, Zap, Book, CheckSquare, Moon, Command, Calendar, ChevronRight, Search, Settings, X, LogIn, LogOut, User, Edit3, BarChart2, Layers, Compass } from 'lucide-react';
import ExpandOnHover from './ui/expand-cards';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { view, setView, addNote, addTask, userAvatar, setUserAvatar, userName, setUserName, logout, isLoggedIn, setShowLoginPage } = useApp();
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qcInput, setQcInput] = useState('');
  const [qcType, setQcType] = useState<'task' | 'note'>('task');

  // Command+K Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowQuickCapture(prev => !prev);
        }
        if (e.key === 'Escape') {
            setShowQuickCapture(false);
            setShowSettings(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcInput.trim()) return;

    if (qcType === 'task') {
        addTask(qcInput);
    } else {
        addNote('Quick Capture', qcInput);
    }
    setQcInput('');
    setShowQuickCapture(false);
  };

  const menuGroups = [
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
            { target: AppView.NOTES, icon: Book, label: "Brain", subtitle: "Notes" },
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
    <div className="flex flex-col md:flex-row h-screen text-slate-100 overflow-hidden font-sans">
      {/* GLOBAL BACKGROUND - Applied here to ensure coverage */}
      <div className="fixed inset-0 bg-[linear-gradient(135deg,#0f0f1a_0%,#1a1a2e_50%,#16213e_100%)] -z-50"></div>
      
      {/* DESKTOP SIDEBAR - CONTROL CENTER STYLE */}
      <nav className="hidden md:flex w-[260px] h-full flex-col bg-[#0f0f1e]/80 backdrop-blur-xl border-r border-white/5 relative z-20 p-5 gap-2">
        
        {/* Header */}
        <div className="px-2 pb-6 mb-2 flex items-center gap-3">
           {isLoggedIn ? (
               <>
                   <img src={userAvatar} alt="User" className="w-9 h-9 rounded-full border border-white/10 object-cover" />
                   <div>
                       <h2 className="text-sm font-bold tracking-tight text-white">{userName}</h2>
                       <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">Pro</p>
                   </div>
               </>
           ) : (
               <>
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <User size={16} className="text-white/40" />
                    </div>
                    <div>
                        <button onClick={() => setShowLoginPage(true)} className="text-sm font-bold tracking-tight text-white hover:text-indigo-400 transition-colors text-left block">
                            Guest
                        </button>
                    </div>
               </>
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

        {/* Footer / Controls */}
        <div className="pt-4 mt-2 border-t border-white/5 space-y-3">
            <button 
                onClick={() => setShowQuickCapture(true)}
                className="w-full py-2.5 px-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-between hover:bg-indigo-600/20 transition-all group"
            >
                <span className="flex items-center gap-2"><Search size={14} className="group-hover:text-white"/> Quick Capture</span>
                <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-200">⌘K</span>
            </button>
            
            <div className="flex items-center justify-between px-1">
                 <div className="text-[10px] text-white/20 font-medium">FlowState v1.1</div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0f0f1a]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50 pb-safe">
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
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isActive 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]' 
                            : 'text-white/40'
                        }
                     `}>
                         <item.icon size={20} strokeWidth={2} />
                     </div>
                 </button>
             )
        })}
        {/* Mobile Quick Capture FAB */}
        <button 
            onClick={() => setShowQuickCapture(true)}
            className="absolute bottom-6 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-xl shadow-indigo-500/20 md:hidden"
        >
            <Command size={20} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto scroll-smooth">
         <div className="max-w-7xl mx-auto min-h-full p-6 md:p-10">
            {children}
         </div>
      </main>

      {/* Quick Capture Modal */}
      {showQuickCapture && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden animate-slide-up mx-4 border border-white/10 ring-1 ring-white/5">
                <form onSubmit={handleQuickCapture}>
                    <div className="flex items-center border-b border-white/5 px-4 py-3 bg-white/5">
                        <select 
                            value={qcType} 
                            onChange={(e) => setQcType(e.target.value as any)}
                            className="bg-transparent text-sm font-medium text-white/80 focus:outline-none cursor-pointer"
                        >
                            <option value="task" className="bg-[#1a1a2e]">Create Task</option>
                            <option value="note" className="bg-[#1a1a2e]">Save Note</option>
                        </select>
                    </div>
                    <div className="p-2">
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full text-lg p-4 focus:outline-none placeholder:text-white/20 text-white bg-transparent"
                            placeholder={qcType === 'task' ? "What needs to be done?" : "What's on your mind?"}
                            value={qcInput}
                            onChange={(e) => setQcInput(e.target.value)}
                        />
                    </div>
                    <div className="bg-white/5 px-4 py-2 flex justify-between items-center text-xs text-white/40">
                        <span>Press Enter to save</span>
                        <div className="flex gap-2">
                            <span className="bg-white/10 border border-white/5 px-1.5 rounded shadow-sm">Esc</span> to close
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-2xl bg-[#1a1a2e] rounded-3xl shadow-2xl overflow-hidden animate-slide-up mx-4 border border-white/10 ring-1 ring-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#1a1a2e] z-20">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Settings size={20} className="text-indigo-400" /> Account Settings
                      </h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-8 space-y-8">
                      
                      {/* Name Edit Section */}
                      <div>
                          <label className="block text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Display Name</label>
                          <div className="flex items-center gap-3">
                              <input 
                                type="text" 
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-white/20"
                                placeholder="Enter your name"
                              />
                          </div>
                      </div>

                      {/* Avatar Selection Section */}
                      <div>
                          <label className="block text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Choose Your Avatar</label>
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <ExpandOnHover onSelect={setUserAvatar} selectedUrl={userAvatar} />
                          </div>
                      </div>

                      {/* Login/Logout Section */}
                      <div className="pt-6 border-t border-white/5">
                          {isLoggedIn ? (
                              <div className="flex items-center justify-between bg-red-900/10 p-6 rounded-2xl border border-red-500/10">
                                  <div>
                                      <h3 className="font-semibold text-white mb-1">Session Management</h3>
                                      <p className="text-sm text-white/50">Log out of your current session.</p>
                                  </div>
                                  <button 
                                    onClick={logout}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600/20 text-red-400 font-semibold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg hover:shadow-red-900/20 border border-red-500/30"
                                  >
                                      <LogOut size={18} /> Sign Out
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-white/5">
                                  <div>
                                      <h3 className="font-semibold text-white mb-1">Sync Your Data</h3>
                                      <p className="text-sm text-white/50">Create an account to save progress.</p>
                                  </div>
                                  <button 
                                    onClick={() => setShowLoginPage(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-white/20 transform hover:-translate-y-0.5"
                                  >
                                      <LogIn size={18} /> Log In
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
