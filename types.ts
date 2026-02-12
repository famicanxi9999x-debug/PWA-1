
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  FOCUS = 'FOCUS',
  NOTES = 'NOTES',
  PROJECTS = 'PROJECTS',
  REVIEW = 'REVIEW',
  SCHEDULE = 'SCHEDULE',
  REPORTS = 'REPORTS',
}

export type Theme = 'light' | 'dark';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  context?: 'work' | 'personal' | 'learning';
  priority?: 'high' | 'medium' | 'low';
  subtasks?: Task[];
  dueDate?: Date;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  type: 'system' | 'user'; // 'system' folders cannot be deleted (e.g., Inbox)
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  linkedTaskIds?: string[];
}

export interface Goal {
  id: string;
  title: string;
  type: 'life' | 'quarterly' | 'weekly';
  progress: number; // 0-100
}

export interface UserStats {
  exp: number;
  level: number;
  streak: number;
  focusMinutesToday: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'work' | 'class' | 'personal';
  description?: string;
}

export interface FocusSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface FocusSession {
  id: string;
  duration: number; // minutes
  completedAt: Date;
  type: 'focus' | 'shortBreak' | 'longBreak';
}

export interface DashboardItem {
  id: string;
  title: string;
  image: string;
  action: string; // Maps to AppView
}

export interface DashboardFolder {
  id: string;
  title: string;
  items: DashboardItem[];
}
