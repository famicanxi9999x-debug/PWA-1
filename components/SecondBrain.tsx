
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { 
    Search, Plus, Hash, Mic, Loader2, Folder, 
    Star, Inbox, MoreHorizontal, FileText, LayoutGrid, List,
    ChevronRight, ArrowLeft, Trash2, Wand2, Calendar, Clock
} from 'lucide-react';
import { analyzeNoteContent, parseVoiceInput } from '../services/geminiService';

export const SecondBrain: React.FC = () => {
  const { notes, folders, addNote, updateNote, deleteNote, addFolder, deleteFolder, addTask } = useApp();
  
  // Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string>('inbox');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);

  // Editor State
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  
  // Interaction State
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // -- DERIVED DATA --
  const selectedNote = notes.find(n => n.id === selectedNoteId);
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();
  
  const filteredNotes = notes.filter(n => {
      let matchesContext = true;

      if (activeTag) {
          matchesContext = n.tags.includes(activeTag);
      } else if (showFavoriteOnly) {
          matchesContext = n.isFavorite;
      } else {
          matchesContext = n.folderId === activeFolderId || (!n.folderId && activeFolderId === 'inbox');
      }

      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesContext && matchesSearch;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // Sort by recent

  // -- EFFECTS --
  useEffect(() => {
      if (selectedNote) {
          setEditorTitle(selectedNote.title);
          setEditorContent(selectedNote.content);
      }
  }, [selectedNoteId, selectedNote]);

  // -- HANDLERS --

  const handleCreateNote = () => {
      addNote("Untitled", "", [], activeFolderId === 'inbox' ? 'inbox' : activeFolderId);
  };

  const handleEditorBlur = () => {
      if (selectedNoteId) {
           updateNote(selectedNoteId, { title: editorTitle, content: editorContent });
      }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if(newFolderName.trim()) {
          addFolder(newFolderName);
          setNewFolderName('');
          setIsAddingFolder(false);
      }
  };

  const handleVoiceCapture = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported.");
        return;
    }
    if (isRecording) return;
    setIsRecording(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'vi-VN'; 
    recognition.onresult = async (event: any) => {
        // Explicitly convert to string to avoid 'unknown' type errors
        const transcript = String(event.results?.[0]?.[0]?.transcript || "");
        setIsRecording(false);
        setIsProcessing(true);
        const result = await parseVoiceInput(transcript);
        if (result.type === 'TASK') {
            addTask(result.title, 'medium');
            alert(`✅ Added Task: ${result.title}`);
        } else {
            // Ensure content is a string
            const content = result.details || transcript;
            addNote(result.title, String(content), result.tags, 'inbox');
            alert(`📝 Added Note: ${result.title}`);
        }
        setIsProcessing(false);
    };
    recognition.onerror = () => { setIsRecording(false); setIsProcessing(false); };
    recognition.start();
  };

  const handleAIAnalyze = async () => {
      if(!editorContent) return;
      setIsProcessing(true);
      const analysis = await analyzeNoteContent(editorContent);
      if(selectedNoteId) {
          updateNote(selectedNoteId, { tags: analysis.tags });
      }
      setIsProcessing(false);
  };

  // Helper to switch contexts
  const selectFolder = (id: string) => {
      setActiveFolderId(id);
      setShowFavoriteOnly(false);
      setActiveTag(null);
      setSelectedNoteId(null);
  };

  const selectFavorites = () => {
      setShowFavoriteOnly(true);
      setActiveTag(null);
      setSelectedNoteId(null);
  };

  const selectTag = (tag: string) => {
      setActiveTag(tag);
      setShowFavoriteOnly(false);
      setSelectedNoteId(null);
  };

  return (
    <div className="h-full flex overflow-hidden bg-transparent text-white font-sans rounded-2xl border border-white/5 shadow-2xl">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <div className={`${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} bg-black/20 backdrop-blur-md border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
          {/* Header */}
          <div className="h-14 flex items-center px-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-white/90 font-semibold">
                  <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">N</div>
                  <span>Notes</span>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
              {/* Primary Links */}
              <div className="px-3 space-y-1">
                  <SidebarItem 
                      icon={Search} 
                      label="Quick Find" 
                      onClick={() => document.getElementById('note-search')?.focus()} 
                  />
                  <SidebarItem 
                      icon={Star} 
                      label="Favorites" 
                      isActive={showFavoriteOnly && !activeTag}
                      onClick={selectFavorites} 
                  />
                  <SidebarItem 
                      icon={Inbox} 
                      label="Inbox" 
                      isActive={!showFavoriteOnly && !activeTag && activeFolderId === 'inbox'}
                      onClick={() => selectFolder('inbox')}
                  />
              </div>

              {/* Folders */}
              <div className="px-3">
                  <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-white/40 uppercase tracking-wider group hover:text-white/70 transition-colors">
                      <span>Folders</span>
                      <button onClick={() => setIsAddingFolder(true)} className="hover:bg-white/10 rounded p-0.5 transition-colors"><Plus size={14}/></button>
                  </div>
                  
                  {isAddingFolder && (
                      <form onSubmit={handleCreateFolder} className="px-2 mb-2">
                          <input 
                              autoFocus
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder:text-white/20"
                              placeholder="Folder name..."
                              value={newFolderName}
                              onChange={e => setNewFolderName(e.target.value)}
                              onBlur={() => setIsAddingFolder(false)}
                          />
                      </form>
                  )}

                  <div className="space-y-0.5">
                      {folders.filter(f => f.type === 'user').map(folder => (
                          <SidebarItem 
                              key={folder.id}
                              icon={Folder} 
                              label={folder.name} 
                              isActive={!showFavoriteOnly && !activeTag && activeFolderId === folder.id}
                              onClick={() => selectFolder(folder.id)}
                              onDelete={() => { if(confirm(`Delete ${folder.name}? Notes will move to Inbox.`)) deleteFolder(folder.id); }}
                          />
                      ))}
                  </div>
              </div>

              {/* Tags */}
              <div className="px-3">
                   <div className="px-2 mb-2 text-xs font-bold text-white/40 uppercase tracking-wider">
                      Tags
                   </div>
                   <div className="space-y-0.5">
                       {allTags.length === 0 && <p className="px-2 text-xs text-white/30 italic">No tags yet</p>}
                       {allTags.map(tag => (
                           <SidebarItem 
                                key={tag}
                                icon={Hash}
                                label={tag}
                                isActive={activeTag === tag}
                                onClick={() => selectTag(tag)}
                           />
                       ))}
                   </div>
              </div>
          </div>
          
          {/* New Note Button */}
          <div className="p-3 border-t border-white/5 bg-black/20">
               <button 
                  onClick={handleCreateNote}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 hover:text-indigo-400 text-white/70 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
               >
                  <Plus size={16} /> New Note
               </button>
          </div>
      </div>

      {/* 2. MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          
          {/* Top Toolbar (Sticky) */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 bg-black/10 backdrop-blur-md z-10">
             <div className="flex items-center gap-3">
                 <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white transition-colors">
                     <LayoutGrid size={20} />
                 </button>
                 
                 {/* Breadcrumbs */}
                 <div className="hidden md:flex items-center gap-2 text-sm text-white/40">
                    <span className="hover:text-white cursor-pointer transition-colors">
                        {activeTag ? `#${activeTag}` : (showFavoriteOnly ? 'Favorites' : folders.find(f => f.id === activeFolderId)?.name)}
                    </span>
                    {selectedNote && (
                        <>
                            <span className="text-white/20">/</span>
                            <span className="font-medium text-white/90 truncate max-w-[200px]">{selectedNote.title || "Untitled"}</span>
                        </>
                    )}
                 </div>
             </div>

             <div className="flex items-center gap-2">
                 <div className="relative group">
                     <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-indigo-400 transition-colors" />
                     <input 
                        id="note-search"
                        type="text" 
                        placeholder="Search..."
                        className="pl-9 pr-3 py-1.5 bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10 focus:bg-white/10 focus:border-indigo-500 rounded-full text-sm focus:outline-none w-40 transition-all focus:w-64 text-white placeholder:text-white/30"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>
                 
                 <div className="w-px h-6 bg-white/10 mx-1"></div>

                 <button 
                    onClick={handleVoiceCapture}
                    disabled={isProcessing}
                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isRecording ? 'text-red-400 bg-red-900/20' : 'text-white/50'}`}
                    title="Voice Note"
                 >
                    {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <Mic size={18} />}
                 </button>

                 {!selectedNoteId && (
                    <button 
                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                        className="p-2 rounded-full text-white/50 hover:bg-white/10 transition-colors"
                    >
                        {viewMode === 'list' ? <LayoutGrid size={18} /> : <List size={18} />}
                    </button>
                 )}
             </div>
          </div>

          {/* MAIN CONTENT CONTAINER */}
          <div className="flex-1 overflow-hidden relative bg-transparent">
              
              {/* VIEW: NOTE LIST */}
              {(!selectedNoteId) ? (
                  <div className="absolute inset-0 overflow-y-auto p-6 md:p-10 bg-transparent">
                      <div className="max-w-6xl mx-auto">
                        {filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center mt-32 text-white/30">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <FileText size={40} className="opacity-40" />
                                </div>
                                <p className="text-lg font-medium text-white/60">No notes here yet.</p>
                                <p className="text-sm mb-6">Capture your thoughts to get started.</p>
                                <button onClick={handleCreateNote} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-indigo-900/50">
                                    Create Note
                                </button>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                                {filteredNotes.map(note => (
                                    <div 
                                      key={note.id}
                                      onClick={() => setSelectedNoteId(note.id)}
                                      className={`
                                          group bg-white/5 backdrop-blur-sm rounded-xl cursor-pointer border border-white/5 shadow-sm hover:shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-200
                                          ${viewMode === 'grid' ? 'p-5 flex flex-col h-64' : 'p-4 flex items-center gap-6'}
                                      `}
                                    >
                                        <div className={`flex-1 overflow-hidden ${viewMode === 'grid' ? '' : 'flex items-center gap-4'}`}>
                                            {viewMode === 'grid' ? (
                                                <>
                                                    <h3 className="font-bold text-white mb-2 truncate text-lg">{note.title || "Untitled"}</h3>
                                                    <p className="text-sm text-white/50 line-clamp-6 leading-relaxed">{note.content || "Empty note..."}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-white truncate text-base">{note.title || "Untitled"}</h3>
                                                        <p className="text-sm text-white/40 truncate">{note.content || "No preview available"}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Card Footer */}
                                        <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mt-4 pt-4 border-t border-white/5' : 'gap-4'}`}>
                                            <div className="flex items-center gap-2 text-xs text-white/30">
                                                <Clock size={12} />
                                                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isFavorite: !note.isFavorite }); }}
                                                  className={`p-1.5 rounded hover:bg-white/10 ${note.isFavorite ? 'text-yellow-400' : 'text-white/40'}`}
                                                >
                                                    <Star size={16} fill={note.isFavorite ? "currentColor" : "none"} />
                                                </button>
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); if(confirm('Delete note?')) deleteNote(note.id); }}
                                                  className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>
                  </div>
              ) : (
                  // VIEW: EDITOR (Unified Page Look)
                  <div className="absolute inset-0 overflow-y-auto bg-transparent animate-fade-in flex flex-col items-center">
                      
                      {/* Editor Controls Overlay (Top Right) */}
                      <div className="absolute top-4 right-6 flex items-center gap-2 z-20">
                           <button 
                             onClick={() => updateNote(selectedNote!.id, { isFavorite: !selectedNote!.isFavorite })}
                             className={`p-2 rounded-full transition-colors ${selectedNote!.isFavorite ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/40 hover:text-white'}`}
                           >
                               <Star size={18} fill={selectedNote!.isFavorite ? "currentColor" : "none"} />
                           </button>
                           <button onClick={() => { if(confirm('Delete note?')) { deleteNote(selectedNoteId!); setSelectedNoteId(null); } }} className="p-2 rounded-full bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors">
                               <Trash2 size={18} />
                           </button>
                           <button onClick={() => setSelectedNoteId(null)} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium text-white/70 transition-colors">
                               <ArrowLeft size={16} /> Back
                           </button>
                      </div>

                      <div className="w-full max-w-3xl px-8 py-12 min-h-screen flex flex-col">
                          
                          {/* Banner / Cover Area */}
                          <div className="h-40 w-full mb-8 rounded-xl bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-blue-900/30 flex items-center justify-center opacity-60 group relative overflow-hidden border border-white/5">
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <button className="bg-black/50 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm text-white/80 hover:text-white border border-white/10">
                                        Change Cover
                                    </button>
                               </div>
                          </div>

                          {/* Title Input */}
                          <input 
                              type="text" 
                              className="w-full text-5xl font-bold text-white placeholder:text-white/20 focus:outline-none bg-transparent mb-6 leading-tight"
                              placeholder="Untitled"
                              value={editorTitle}
                              onChange={e => setEditorTitle(e.target.value)}
                              onBlur={handleEditorBlur}
                          />
                          
                          {/* Meta Row */}
                          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm border-b border-white/5 pb-6">
                              <div className="flex items-center gap-2 text-white/60">
                                  <Folder size={16} className="text-white/40" />
                                  <div className="relative group">
                                     <span className="cursor-pointer hover:text-white transition-colors">
                                        {folders.find(f => f.id === selectedNote!.folderId)?.name || 'Inbox'}
                                     </span>
                                     <select 
                                        className="absolute inset-0 opacity-0 cursor-pointer bg-black"
                                        value={selectedNote!.folderId}
                                        onChange={(e) => updateNote(selectedNoteId!, { folderId: e.target.value })}
                                     >
                                          <option value="inbox" className="bg-gray-900">Inbox</option>
                                          {folders.filter(f => f.type === 'user').map(f => <option key={f.id} value={f.id} className="bg-gray-900">{f.name}</option>)}
                                     </select>
                                  </div>
                              </div>
                              <div className="w-px h-4 bg-white/10"></div>
                              <div className="flex items-center gap-2 text-white/60">
                                  <Calendar size={16} className="text-white/40" />
                                  <span>{new Date(selectedNote!.updatedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="w-px h-4 bg-white/10"></div>
                              <div className="flex items-center gap-2">
                                  {selectedNote!.tags.map(tag => (
                                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-white/80 text-xs font-medium border border-white/5">
                                          <Hash size={10} /> {tag}
                                      </span>
                                  ))}
                                  <button onClick={handleAIAnalyze} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium ml-1">
                                     + AI Tag
                                  </button>
                              </div>
                          </div>

                          {/* Content Editor */}
                          <textarea 
                              className="w-full flex-1 resize-none focus:outline-none text-lg text-white/90 leading-relaxed placeholder:text-white/20 font-serif bg-transparent"
                              placeholder="Start writing..."
                              value={editorContent}
                              onChange={e => setEditorContent(e.target.value)}
                              onBlur={handleEditorBlur}
                              spellCheck={false}
                          />
                      </div>

                      {/* Floating AI Button */}
                      <button 
                        onClick={handleAIAnalyze}
                        disabled={isProcessing}
                        className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-[#1a1a2e] border border-indigo-500/30 text-indigo-400 rounded-full shadow-lg hover:shadow-indigo-500/20 hover:scale-105 transition-all z-30 group hover:bg-[#20203a]"
                      >
                          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} className="group-hover:rotate-12 transition-transform"/>}
                          <span className="font-semibold">AI Assistant</span>
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, isActive, onClick, onDelete }: any) => (
    <div 
        onClick={onClick}
        className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all text-sm font-medium ${isActive ? 'bg-white/10 text-indigo-400 shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
    >
        <div className="flex items-center gap-3 truncate">
            <Icon size={18} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
            <span className="truncate">{label}</span>
        </div>
        {onDelete && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 rounded hover:bg-white/5"
            >
                <MoreHorizontal size={14} />
            </button>
        )}
    </div>
);
