
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
  dependencies?: string[]; // Array of task IDs this task depends on
  tags?: string[];
  estimatedTime?: number; // In minutes
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number; // Every X days/weeks/months
    endDate?: Date;
    daysOfWeek?: number[]; // For weekly: 0-6 (Sunday-Saturday)
  };
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string; // Folder color for visual organization
  parentId?: string; // For nested folders
  type: 'system' | 'user'; // 'system' folders cannot be deleted (e.g., Inbox)
}

export interface Note {
  id: string;
  title: string;
  content: string;
  contentType?: 'plaintext' | 'html'; // For backward compatibility
  tags: string[];
  folderId: string;
  coverImage?: string;
  icon?: string;
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
  color?: string;
  priority?: 'high' | 'medium' | 'low';
  allDay?: boolean;
  location?: string;
  recurrence?: 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  reminder?: number; // minutes before event: 0, 5, 10, 15, 30, 60, 120, 1440
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
