
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Note, Goal, UserStats, AppView, CalendarEvent, FocusSettings, Folder, Theme, FocusSession, DashboardFolder, DashboardItem } from './types';
import { createNote, updateNoteAPI, deleteNoteAPI, listNotes, createTask, updateTaskAPI, deleteTaskAPI, listTasks, createFolderAPI, updateFolderAPI, deleteFolderAPI, listFolders } from './services/supabaseService';
import { supabase } from './lib/supabase';

interface AppState {
  view: AppView;
  setView: (view: AppView) => void;
  tasks: Task[];
  notes: Note[];
  folders: Folder[];
  goals: Goal[];
  stats: UserStats;
  events: CalendarEvent[];
  focusSettings: FocusSettings;
  focusHistory: FocusSession[];
  dashboardFolders: DashboardFolder[];

  // Theme
  theme: Theme;
  toggleTheme: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;

  // User Data
  isLoggedIn: boolean;
  isAuthLoading: boolean; // Tells the UI if we are still verifying the session
  showLoginPage: boolean; // Controls visibility of the full-screen AuthPage
  setShowLoginPage: (show: boolean) => void;
  login: () => void;
  logout: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (url: string) => void;

  // Task Actions
  addTask: (title: string, priority?: 'high' | 'medium' | 'low', context?: 'work' | 'personal' | 'learning', dueDate?: Date) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addSubtasks: (parentId: string, subtaskTitles: string[]) => void;

  // Note & Folder Actions
  addNote: (title: string, content: string, tags?: string[], folderId?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string, parentId?: string, color?: string, icon?: string) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  // Nested Folder State
  expandedFolders: string[];
  toggleFolderExpansion: (id: string) => void;

  // Dashboard Folder Actions
  addDashboardFolder: (title: string) => void;
  updateDashboardFolder: (id: string, title: string) => void;
  deleteDashboardFolder: (id: string) => void;

  // Other Actions
  addExp: (amount: number) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  shiftFutureEvents: (minutes: number) => void;
  updateFocusSettings: (settings: FocusSettings) => void;
  addFocusSession: (duration: number, type: 'focus' | 'shortBreak' | 'longBreak') => void;

  // State
  contextFilter: string;
  setContextFilter: (ctx: string) => void;

  // UI State
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Complete Project Proposal', completed: false, priority: 'high', context: 'work' },
  { id: '2', title: 'Read 30 pages of "Deep Work"', completed: false, priority: 'medium', context: 'learning' },
];

const INITIAL_FOLDERS: Folder[] = [
  { id: 'inbox', name: 'Inbox', type: 'system', icon: 'inbox' },
  { id: 'projects', name: 'Projects', type: 'user', icon: 'folder' },
  { id: 'journal', name: 'Journal', type: 'user', icon: 'book' },
  { id: 'ideas', name: 'Ideas', type: 'user', icon: 'lightbulb' },
];

const DEFAULT_DASHBOARD_ITEMS: DashboardItem[] = [
  { id: 'def1', title: 'Tasks', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=200&auto=format&fit=crop', action: AppView.PROJECTS },
  { id: 'def2', title: 'Notes', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=200&auto=format&fit=crop', action: AppView.NOTES },
  { id: 'def3', title: 'Calendar', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=200&auto=format&fit=crop', action: AppView.SCHEDULE },
];

// Helper to create date relative to today for demo purposes
const createDate = (dayOffset: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Deep Work Session', start: createDate(0, 9, 0), end: createDate(0, 11, 0), type: 'work' },
];

const INITIAL_FOCUS_SETTINGS: FocusSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

const DEFAULT_AVATAR = "https://pbs.twimg.com/media/G6dpHzVbkAERJI3?format=png&name=360x360";

const STORAGE_KEYS = {
  IS_LOGGED_IN: 'flowstate_is_logged_in',
  TASKS: 'flowstate_tasks',
  NOTES: 'flowstate_notes',
  FOLDERS: 'flowstate_folders',
  GOALS: 'flowstate_goals',
  STATS: 'flowstate_stats',
  EVENTS: 'flowstate_events',
  SETTINGS: 'flowstate_settings',
  THEME: 'flowstate_theme',
  AVATAR: 'flowstate_avatar',
  USERNAME: 'flowstate_username',
  FOCUS_HISTORY: 'flowstate_focus_history',
  DASHBOARD_FOLDERS: 'flowstate_dashboard_folders',
  EXPANDED_FOLDERS: 'flowstate_expanded_folders',
  HIGH_CONTRAST: 'flowstate_high_contrast',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);

  // --- LOAD STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user?.user_metadata?.full_name) {
        setUserNameState(session.user.user_metadata.full_name);
      }
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user?.user_metadata?.full_name) {
        setUserNameState(session.user.user_metadata.full_name);
      }
      if (_event === 'SIGNED_OUT') {
        setNotes([]);
        setTasks(INITIAL_TASKS);
      }
      setIsAuthLoading(false);

      // Clean up the URL hash if it contains OAuth tokens
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [showLoginPage, setShowLoginPage] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved).map((t: any) => ({
        ...t, dueDate: t.dueDate ? new Date(t.dueDate) : undefined
      })) : INITIAL_TASKS;
    } catch { return INITIAL_TASKS; }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved).map((n: any) => ({
        ...n, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt)
      })) : [];
    } catch { return []; }
  });

  useEffect(() => {
    let active = true;
    if (isLoggedIn && !isAuthLoading) {
      const loadData = async () => {
        try {
          const dbNotes = await listNotes();
          const dbTasks = await listTasks();
          let dbFolders = await listFolders();

          // Seed default system folders if user has no folders at all
          if (dbFolders.length === 0) {
            await Promise.all(INITIAL_FOLDERS.map(f => createFolderAPI(f)));
            dbFolders = await listFolders();
          }

          if (active) {
            setNotes(dbNotes);
            setTasks(dbTasks);
            setFolders(dbFolders);
          }
        } catch (err) {
          console.error("Failed to fetch from Supabase:", err);
        }
      };
      loadData();
    }
    return () => { active = false; };
  }, [isLoggedIn, isAuthLoading]);

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch { return INITIAL_FOLDERS; }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved).map((g: any) => ({
        ...g,
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined
      })) : [];
    } catch { return []; }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      return saved ? JSON.parse(saved) : { exp: 0, level: 1, streak: 0, focusMinutesToday: 0 };
    } catch { return { exp: 0, level: 1, streak: 0, focusMinutesToday: 0 }; }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved).map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })) : INITIAL_EVENTS;
    } catch { return INITIAL_EVENTS; }
  });

  const [focusSettings, setFocusSettings] = useState<FocusSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_FOCUS_SETTINGS;
    } catch { return INITIAL_FOCUS_SETTINGS; }
  });

  const [focusHistory, setFocusHistory] = useState<FocusSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [dashboardFolders, setDashboardFolders] = useState<DashboardFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DASHBOARD_FOLDERS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch { return 'dark'; }
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, JSON.stringify(newHighContrast));
  };

  const [userAvatar, setUserAvatarState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AVATAR) || DEFAULT_AVATAR;
    } catch { return DEFAULT_AVATAR; }
  });

  // Persist Events to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);


  const [userName, setUserNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USERNAME) || "Alex";
    } catch { return "Alex"; }
  });

  const [expandedFolders, setExpandedFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPANDED_FOLDERS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [contextFilter, setContextFilter] = useState('all');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // --- PERSISTENCE ---
  // Auth persistence is handled automatically by Supabase client
  // Using LocalStorage for fast offline load, synced with Supabase when logged in
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(focusSettings)); }, [focusSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FOCUS_HISTORY, JSON.stringify(focusHistory)); }, [focusHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DASHBOARD_FOLDERS, JSON.stringify(dashboardFolders)); }, [dashboardFolders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EXPANDED_FOLDERS, JSON.stringify(expandedFolders)); }, [expandedFolders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AVATAR, userAvatar); }, [userAvatar]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERNAME, userName); }, [userName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

  // --- ACTIONS ---

  const login = () => {
    setIsLoggedIn(true);
    setShowLoginPage(false); // Close the login page upon success
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setView(AppView.DASHBOARD);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setUserAvatar = (url: string) => {
    setUserAvatarState(url);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
  };

  const addTask = async (title: string, priority: 'high' | 'medium' | 'low' = 'medium', context: 'work' | 'personal' | 'learning' = 'work', dueDate?: Date) => {
    const id = crypto.randomUUID();
    const newTask: Task = {
      id,
      title,
      completed: false,
      priority,
      context,
      dueDate
    };
    setTasks(prev => [newTask, ...prev]);
    if (isLoggedIn) await createTask(newTask).catch(console.error);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (isLoggedIn) await updateTaskAPI(id, updates).catch(console.error);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = !task.completed;
    if (newStatus) addExp(50);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));
    if (isLoggedIn) await updateTaskAPI(id, { completed: newStatus }).catch(console.error);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (isLoggedIn) await deleteTaskAPI(id).catch(console.error);
  };

  const addSubtasks = async (parentId: string, subtaskTitles: string[]) => {
    const task = tasks.find(t => t.id === parentId);
    if (!task) return;

    const newSubtasks: Task[] = subtaskTitles.map((title, idx) => ({
      id: `${parentId}_sub_${idx}`,
      title,
      completed: false
    }));

    setTasks(prev => prev.map(t => t.id === parentId ? { ...t, subtasks: newSubtasks } : t));
    if (isLoggedIn) await updateTaskAPI(parentId, { subtasks: newSubtasks }).catch(console.error);
  };

  // NOTE ACTIONS
  const addNote = async (title: string, content: string, tags: string[] = [], folderId: string = 'inbox') => {
    const id = crypto.randomUUID();
    const newNote: Note = {
      id,
      title,
      content,
      tags,
      folderId,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    if (isLoggedIn) await createNote(newNote).catch(console.error);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
    if (isLoggedIn) await updateNoteAPI(id, updates).catch(console.error);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isLoggedIn) await deleteNoteAPI(id).catch(console.error);
  };


  const addFolder = async (name: string, parentId?: string, color?: string, icon?: string) => {
    const id = Date.now().toString();
    const newFolder: Folder = {
      id,
      name,
      type: 'user',
      parentId,
      color,
      icon
    };
    setFolders(prev => [...prev, newFolder]);
    if (isLoggedIn) await createFolderAPI(newFolder).catch(console.error);
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (isLoggedIn) await updateFolderAPI(id, updates).catch(console.error);
  };

  const deleteFolder = async (id: string) => {
    // Delete folder and all its children
    const deleteRecursive = (folderId: string): string[] => {
      const childIds = folders.filter(f => f.parentId === folderId).map(f => f.id);
      const allIds = [folderId, ...childIds.flatMap(deleteRecursive)];
      return allIds;
    };

    const idsToDelete = deleteRecursive(id);
    setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    setExpandedFolders(prev => prev.filter(fId => !idsToDelete.includes(fId))); // Clean up expansion state
    // Move notes in deleted folders to Inbox
    setNotes(prev => prev.map(n => idsToDelete.includes(n.folderId) ? { ...n, folderId: 'inbox' } : n));

    if (isLoggedIn) {
      // Since we enabled ON DELETE CASCADE in Supabase, deleting the parent shouldn't be strictly necessary 
      // to recurse if the parent_id was set up as a FK. But our schema has `parent_id TEXT`.
      // So we delete explicitly.
      for (const fId of idsToDelete) {
        await deleteFolderAPI(fId).catch(console.error);
      }
      // Also update notes in the backend to point to inbox
      const affectedNotes = notes.filter(n => idsToDelete.includes(n.folderId));
      for (const n of affectedNotes) {
        await updateNoteAPI(n.id, { folderId: 'inbox' }).catch(console.error);
      }
    }
  };

  const toggleFolderExpansion = (id: string) => {
    setExpandedFolders(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // DASHBOARD ACTIONS
  const addDashboardFolder = (title: string) => {
    const newFolder: DashboardFolder = {
      id: Date.now().toString(),
      title,
      items: DEFAULT_DASHBOARD_ITEMS
    };
    setDashboardFolders(prev => [...prev, newFolder]);
  };

  const updateDashboardFolder = (id: string, title: string) => {
    setDashboardFolders(prev => prev.map(f => f.id === id ? { ...f, title } : f));
  };

  const deleteDashboardFolder = (id: string) => {
    setDashboardFolders(prev => prev.filter(f => f.id !== id));
  };

  const addExp = (amount: number) => {
    setStats(prev => ({ ...prev, exp: prev.exp + amount }));
  };

  const addEvent = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event =>
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };


  const shiftFutureEvents = (minutes: number) => {
    const now = new Date();
    setEvents(prev => prev.map(event => {
      const eventStart = new Date(event.start);
      // Only shift events that are in the future AND on the same day (to avoid messing up whole calendar)
      if (eventStart > now && eventStart.getDate() === now.getDate()) {
        const newStart = new Date(eventStart.getTime() + minutes * 60000);
        const newEnd = new Date(new Date(event.end).getTime() + minutes * 60000);
        return { ...event, start: newStart, end: newEnd };
      }
      return event;
    }));
  };

  const updateFocusSettings = (settings: FocusSettings) => {
    setFocusSettings(settings);
  };

  const addFocusSession = (duration: number, type: 'focus' | 'shortBreak' | 'longBreak') => {
    const session: FocusSession = {
      id: Date.now().toString(),
      duration,
      type,
      completedAt: new Date()
    };
    setFocusHistory(prev => [session, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      view, setView, tasks, notes, folders, goals, stats, events, focusSettings, focusHistory, dashboardFolders,
      theme, toggleTheme, highContrast, toggleHighContrast, isLoggedIn, isAuthLoading, showLoginPage, setShowLoginPage, login, logout,
      addTask, updateTask, toggleTask, deleteTask, addSubtasks,
      addNote, updateNote, deleteNote, addFolder, updateFolder, deleteFolder,
      expandedFolders, toggleFolderExpansion,
      addDashboardFolder, updateDashboardFolder, deleteDashboardFolder,
      addExp, addEvent, updateEvent, deleteEvent, shiftFutureEvents,
      updateFocusSettings, addFocusSession, userName, setUserName, userAvatar, setUserAvatar, contextFilter, setContextFilter,
      isCommandPaletteOpen, setCommandPaletteOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
