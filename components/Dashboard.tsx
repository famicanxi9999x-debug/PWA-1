
import React, { useEffect, useState } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';
import { suggestDailyPlan } from '../services/geminiService';
import { AnimatedFolder, Project } from './ui/3d-folder';
import { CheckCircle, BrainCircuit, Activity, Smile, Meh, Frown, Plus, Edit3 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { userName, tasks, setView, stats, toggleTask, dashboardFolders, addDashboardFolder, updateDashboardFolder } = useApp();
  const [suggestion, setSuggestion] = useState<string>('Initializing Workspace...');
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  
  // Folder Management State
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const incompleteTasks = tasks.filter(t => !t.completed);
  const oneThing = incompleteTasks.find(t => t.priority === 'high') || incompleteTasks[0];

  useEffect(() => {
    // Simulate AI Loading on mount
    const fetchPlan = async () => {
        if(incompleteTasks.length > 0) {
            const plan = await suggestDailyPlan(incompleteTasks.map(t => t.title), "Morning");
            setSuggestion(plan);
        } else {
            setSuggestion("You're all caught up! Create a new folder to organize your space.");
        }
    };
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigation = (project: Project) => {
      if (project.action) {
          setView(project.action as AppView);
      }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if(newFolderName.trim()) {
          addDashboardFolder(newFolderName);
          setNewFolderName('');
          setShowAddFolder(false);
      }
  };

  const startEditingFolder = (id: string, currentName: string) => {
      setEditingFolderId(id);
      setEditFolderName(currentName);
  };

  const saveFolderEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if(editingFolderId && editFolderName.trim()) {
          updateDashboardFolder(editingFolderId, editFolderName);
          setEditingFolderId(null);
          setEditFolderName('');
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in text-white py-4">
      
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
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Mood</span>
            <div className="flex gap-3">
                 <button onClick={() => setMood('happy')} className={`transition-all hover:scale-125 ${mood === 'happy' ? 'text-green-400 scale-125' : 'text-white/20 hover:text-green-400'}`}><Smile size={20}/></button>
                 <button onClick={() => setMood('neutral')} className={`transition-all hover:scale-125 ${mood === 'neutral' ? 'text-yellow-400 scale-125' : 'text-white/20 hover:text-yellow-400'}`}><Meh size={20}/></button>
                 <button onClick={() => setMood('sad')} className={`transition-all hover:scale-125 ${mood === 'sad' ? 'text-red-400 scale-125' : 'text-white/20 hover:text-red-400'}`}><Frown size={20}/></button>
            </div>
        </div>
      </div>

      {/* 3D Folder Navigation Hub */}
      <div className="flex flex-wrap items-start justify-center gap-8 md:gap-12 py-8 min-h-[400px]">
          {dashboardFolders.map((folder) => (
              <div key={folder.id} className="relative group/folder">
                  <AnimatedFolder 
                      title={folder.title} 
                      projects={folder.items} 
                      onProjectSelect={handleNavigation} 
                  />
                  {/* Edit Trigger */}
                  <button 
                    onClick={() => startEditingFolder(folder.id, folder.title)}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover/folder:opacity-100 transition-opacity hover:bg-black text-white/70 hover:text-white"
                  >
                      <Edit3 size={14} />
                  </button>
              </div>
          ))}

          {/* Add New Folder Button */}
          <button 
            onClick={() => setShowAddFolder(true)}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all w-[280px] h-[320px] group text-white/30 hover:text-indigo-400"
          >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus size={32} />
              </div>
              <span className="font-medium">Add Hub Folder</span>
          </button>
      </div>

      {/* Active Context Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          
          {/* Quick Focus Widget */}
          <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/[0.07] transition-all duration-500 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <BrainCircuit size={20} className="text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Top Priority</h3>
                    <p className="text-xs text-white/40">The most impactful task right now</p>
                </div>
             </div>

             {oneThing ? (
                 <div className="relative z-10">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
                        <button onClick={() => toggleTask(oneThing.id)} className="mt-1 text-white/30 hover:text-green-400 transition-colors">
                            <div className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-green-400 hover:bg-green-400/20 transition-all"></div>
                        </button>
                        <div className="flex-1">
                             <h2 className="text-xl font-medium text-white leading-tight mb-1">{oneThing.title}</h2>
                             <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                                 {oneThing.context || 'General'}
                             </span>
                        </div>
                    </div>
                 </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-6 text-white/40 z-10 relative">
                    <CheckCircle size={32} className="mb-2 text-green-500/50" />
                    <p>All high priority tasks clear!</p>
                </div>
             )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/[0.07] transition-all relative overflow-hidden">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <Activity size={20} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Daily Pulse</h3>
                    <p className="text-xs text-white/40">Your productivity heartbeat</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                     <span className="text-3xl font-bold text-white">{stats.focusMinutesToday}</span>
                     <span className="text-xs text-white/40 block mt-1 uppercase tracking-wider">Focus Minutes</span>
                 </div>
                 <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                     <span className="text-3xl font-bold text-white">{incompleteTasks.length}</span>
                     <span className="text-xs text-white/40 block mt-1 uppercase tracking-wider">Tasks Left</span>
                 </div>
             </div>
          </div>
      </div>

      {/* Add Folder Modal */}
      {showAddFolder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
              <form onSubmit={handleCreateFolder} className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-sm animate-slide-up shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Create New Hub</h3>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none mb-6"
                    placeholder="Folder Name (e.g., Work)"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button type="button" onClick={() => setShowAddFolder(false)} className="flex-1 py-2 text-white/50 hover:text-white">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Create</button>
                  </div>
              </form>
          </div>
      )}

      {/* Rename Folder Modal */}
      {editingFolderId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
              <form onSubmit={saveFolderEdit} className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-sm animate-slide-up shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Rename Folder</h3>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none mb-6"
                    value={editFolderName}
                    onChange={e => setEditFolderName(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button type="button" onClick={() => setEditingFolderId(null)} className="flex-1 py-2 text-white/50 hover:text-white">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save</button>
                  </div>
              </form>
          </div>
      )}

    </div>
  );
};
