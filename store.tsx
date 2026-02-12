
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Note, Goal, UserStats, AppView, CalendarEvent, FocusSettings, Folder, Theme, FocusSession, DashboardFolder, DashboardItem } from './types';

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
  
  // User Data
  isLoggedIn: boolean;
  showLoginPage: boolean; // Controls visibility of the full-screen AuthPage
  setShowLoginPage: (show: boolean) => void;
  login: () => void;
  logout: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (url: string) => void;
  
  // Task Actions
  addTask: (title: string, priority?: 'high'|'medium'|'low', context?: 'work' | 'personal' | 'learning', dueDate?: Date) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addSubtasks: (parentId: string, subtaskTitles: string[]) => void;
  
  // Note & Folder Actions
  addNote: (title: string, content: string, tags?: string[], folderId?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  
  // Dashboard Folder Actions
  addDashboardFolder: (title: string) => void;
  updateDashboardFolder: (id: string, title: string) => void;
  deleteDashboardFolder: (id: string) => void;
  
  // Other Actions
  addExp: (amount: number) => void;
  addEvent: (event: CalendarEvent) => void;
  shiftFutureEvents: (minutes: number) => void;
  updateFocusSettings: (settings: FocusSettings) => void;
  addFocusSession: (duration: number, type: 'focus' | 'shortBreak' | 'longBreak') => void;
  
  // State
  contextFilter: string;
  setContextFilter: (ctx: string) => void;
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
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- LOAD STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
      try {
          return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
      } catch { return false; }
  });

  const [showLoginPage, setShowLoginPage] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch { return INITIAL_TASKS; }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch { return INITIAL_FOLDERS; }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      return saved ? JSON.parse(saved) : { exp: 1250, level: 3, streak: 5, focusMinutesToday: 45 };
    } catch { return { exp: 1250, level: 3, streak: 5, focusMinutesToday: 45 }; }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
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
  
  const [userAvatar, setUserAvatarState] = useState<string>(() => {
      try {
          return localStorage.getItem(STORAGE_KEYS.AVATAR) || DEFAULT_AVATAR;
      } catch { return DEFAULT_AVATAR; }
  });

  const [userName, setUserNameState] = useState<string>(() => {
      try {
          return localStorage.getItem(STORAGE_KEYS.USERNAME) || "Alex";
      } catch { return "Alex"; }
  });

  const [contextFilter, setContextFilter] = useState('all');

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn)); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(focusSettings)); }, [focusSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FOCUS_HISTORY, JSON.stringify(focusHistory)); }, [focusHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DASHBOARD_FOLDERS, JSON.stringify(dashboardFolders)); }, [dashboardFolders]);
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
  
  const logout = () => {
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

  const addTask = (title: string, priority: 'high'|'medium'|'low' = 'medium', context: 'work' | 'personal' | 'learning' = 'work', dueDate?: Date) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority,
      context,
      dueDate
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = !t.completed;
        if (newStatus) addExp(50);
        return { ...t, completed: newStatus };
      }
      if (t.subtasks) {
         const updatedSub = t.subtasks.map(s => s.id === id ? {...s, completed: !s.completed} : s);
         return {...t, subtasks: updatedSub};
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addSubtasks = (parentId: string, subtaskTitles: string[]) => {
    setTasks(prev => prev.map(t => {
      if (t.id === parentId) {
        const newSubtasks: Task[] = subtaskTitles.map((title, idx) => ({
          id: `${parentId}_sub_${idx}`,
          title,
          completed: false
        }));
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    }));
  };

  // NOTE ACTIONS
  const addNote = (title: string, content: string, tags: string[] = [], folderId: string = 'inbox') => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      tags,
      folderId,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addFolder = (name: string) => {
    const newFolder: Folder = {
        id: Date.now().toString(),
        name,
        type: 'user'
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const deleteFolder = (id: string) => {
      setFolders(prev => prev.filter(f => f.id !== id));
      // Move notes in deleted folder to Inbox
      setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: 'inbox' } : n));
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
      theme, toggleTheme, isLoggedIn, showLoginPage, setShowLoginPage, login, logout,
      addTask, toggleTask, deleteTask, addSubtasks, 
      addNote, updateNote, deleteNote, addFolder, deleteFolder,
      addDashboardFolder, updateDashboardFolder, deleteDashboardFolder,
      addExp, addEvent, shiftFutureEvents, 
      updateFocusSettings, addFocusSession, userName, setUserName, userAvatar, setUserAvatar, contextFilter, setContextFilter
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
