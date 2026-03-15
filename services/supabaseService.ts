import { supabase } from '../lib/supabase';
import { Note, Task } from '../types';
import { addPendingAction, PendingAction } from '../lib/offlineQueue';

const handleAuthError = async () => {
    const { data: userRow } = await supabase.auth.getUser();
    if (!userRow.user) throw new Error("User not authenticated");
    return userRow.user;
};

// Wrapper for offline mutation handling
const tryOfflineSync = async <T,>(
    action: Omit<PendingAction, 'id' | 'timestamp' | 'headers' | 'url'> & { endpoint: string, recordId?: string },
    apiCall: () => Promise<T>,
    fallbackResult: T
): Promise<T> => {
    try {
        if (!navigator.onLine) {
            throw new Error('Failed to fetch'); // Force offline flow if browser knows we're offline
        }
        return await apiCall();
    } catch (error: any) {
        // Check if error is a network error (Supabase fetch failures usually throw TypeError or have specific messages)
        const isNetworkError = !navigator.onLine || 
           error.message === 'Failed to fetch' || 
           error.message?.includes('Network request failed');

        if (isNetworkError) {
            console.warn('Network offline. Saving action to IndexedDB for Background Sync.');
            await addPendingAction(action);
            
            try {
                const registration = await navigator.serviceWorker.ready;
                // @ts-ignore - sync API is not yet fully typed in standard TS lib
                if (registration.sync) {
                    // @ts-ignore
                    await registration.sync.register('sync-data');
                    console.log('Background Sync registered for: sync-data');
                }
            } catch (err) {
                console.warn('Background sync registration failed (may not be supported). Data saved in queue.', err);
            }

            // Notify UI
            window.dispatchEvent(new CustomEvent('offline-sync-toast'));
            
            return fallbackResult; // Return optimistic data so the local UI can proceed
        }
        throw error;
    }
};

// --- NOTES ---

export const mapDBToNote = (dbNote: any): Note => ({
    id: dbNote.id,
    title: dbNote.title || '',
    content: typeof dbNote.content === 'string' ? dbNote.content : dbNote.content?.text || '',
    tags: dbNote.tags || [],
    folderId: dbNote.folder_id || 'inbox',
    coverImage: dbNote.cover_url,
    icon: dbNote.emoji,
    isFavorite: false,
    createdAt: new Date(dbNote.created_at),
    updatedAt: new Date(dbNote.updated_at),
});

export const mapNoteToDB = (localNote: Partial<Note>): any => {
    const payload: any = {};
    if (localNote.id !== undefined) payload.id = localNote.id;
    if (localNote.title !== undefined) payload.title = localNote.title;
    if (localNote.content !== undefined) payload.content = { text: localNote.content };
    if (localNote.tags !== undefined) payload.tags = localNote.tags;
    if (localNote.folderId !== undefined) payload.folder_id = localNote.folderId;
    if (localNote.coverImage !== undefined) payload.cover_url = localNote.coverImage;
    if (localNote.icon !== undefined) payload.emoji = localNote.icon;
    return payload;
};

export const createNote = async (noteData: Partial<Note>) => {
    const user = await handleAuthError();
    const payload = mapNoteToDB(noteData);
    
    return tryOfflineSync(
        { endpoint: 'notes', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('notes')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToNote(data);
        },
        mapDBToNote({ ...payload, id: noteData.id || crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    );
};

export const updateNoteAPI = async (id: string, updates: Partial<Note>) => {
    const payload = mapNoteToDB(updates);
    
    return tryOfflineSync(
        { endpoint: 'notes', method: 'PATCH', payload, recordId: id },
        async () => {
            const { data, error } = await supabase
                .from('notes')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDBToNote(data);
        },
        mapDBToNote({ ...payload, id, updated_at: new Date().toISOString() }) // Partial fallback
    );
};

export const deleteNoteAPI = async (id: string) => {
    return tryOfflineSync(
        { endpoint: 'notes', method: 'DELETE', recordId: id },
        async () => {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
        },
        undefined
    );
};

export const listNotes = async (): Promise<Note[]> => {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToNote);
};

// --- TASKS ---

export const mapDBToTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title || '',
    completed: dbTask.status === 'done',
    context: dbTask.recurrence?.context || 'work',
    priority: dbTask.recurrence?.priority || 'medium',
    dueDate: dbTask.due_at ? new Date(dbTask.due_at) : undefined,
    subtasks: dbTask.recurrence?.subtasks || [],
    dependencies: dbTask.recurrence?.dependencies || [],
    tags: dbTask.recurrence?.tags || [],
    estimatedTime: dbTask.recurrence?.estimatedTime,
});

export const mapTaskToDB = (localTask: Partial<Task>): any => {
    const payload: any = {};
    if (localTask.id !== undefined) payload.id = localTask.id;
    if (localTask.title !== undefined) payload.title = localTask.title;
    if (localTask.completed !== undefined) payload.status = localTask.completed ? 'done' : 'todo';
    if (localTask.dueDate !== undefined) payload.due_at = localTask.dueDate?.toISOString();

    // Store extra properties in JSONB recurrence field recursively to avoid schema changes for every new UI feature
    if (localTask.context !== undefined || localTask.priority !== undefined || localTask.subtasks !== undefined || localTask.dependencies !== undefined || localTask.tags !== undefined || localTask.estimatedTime !== undefined) {
        payload.recurrence = {
            context: localTask.context,
            priority: localTask.priority,
            subtasks: localTask.subtasks,
            dependencies: localTask.dependencies,
            tags: localTask.tags,
            estimatedTime: localTask.estimatedTime
        };
    }
    return payload;
};

export const createTask = async (taskData: Partial<Task>) => {
    const user = await handleAuthError();
    const payload = mapTaskToDB(taskData);
    
    return tryOfflineSync(
        { endpoint: 'tasks', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToTask(data);
        },
        mapDBToTask({ ...payload, id: taskData.id || crypto.randomUUID(), created_at: new Date().toISOString() })
    );
};

export const updateTaskAPI = async (id: string, updates: Partial<Task>) => {
    const payload = mapTaskToDB(updates);

    return tryOfflineSync(
        { endpoint: 'tasks', method: 'PATCH', payload, recordId: id },
        async () => {
            // Merge recurrence JSONB if it exists, since we store custom props there. Postgres JSONB update would replace the field otherwise.
            // However, to keep it simple locally, we'll overwrite it or rely on the store.tsx calling `updateTaskAPI` with full Task objects if needed.
            const { data, error } = await supabase
                .from('tasks')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDBToTask(data);
        },
        mapDBToTask({ ...payload, id })
    );
};

export const deleteTaskAPI = async (id: string) => {
    return tryOfflineSync(
        { endpoint: 'tasks', method: 'DELETE', recordId: id },
        async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        },
        undefined
    );
};

export const listTasks = async (): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToTask);
};

// --- STORAGE ---

export const uploadAsset = async (file: File): Promise<string> => {
    const user = await handleAuthError();
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

    return data.publicUrl;
};

// --- FOLDERS ---

export const mapDBToFolder = (dbFolder: any): import('../types').Folder => ({
    id: dbFolder.id,
    name: dbFolder.name || '',
    parentId: dbFolder.parent_id,
    type: dbFolder.type || 'user',
    color: dbFolder.color,
    icon: dbFolder.icon,
});

export const mapFolderToDB = (localFolder: Partial<import('../types').Folder>): any => {
    const payload: any = {};
    if (localFolder.id !== undefined) payload.id = localFolder.id;
    if (localFolder.name !== undefined) payload.name = localFolder.name;
    if (localFolder.parentId !== undefined) payload.parent_id = localFolder.parentId;
    if (localFolder.type !== undefined) payload.type = localFolder.type;
    if (localFolder.color !== undefined) payload.color = localFolder.color;
    if (localFolder.icon !== undefined) payload.icon = localFolder.icon;
    return payload;
};

export const createFolderAPI = async (folderData: Partial<import('../types').Folder>) => {
    const user = await handleAuthError();
    const payload = mapFolderToDB(folderData);
    
    return tryOfflineSync(
        { endpoint: 'folders', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('folders')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToFolder(data);
        },
        mapDBToFolder({ ...payload, id: folderData.id || Date.now().toString() })
    );
};

export const updateFolderAPI = async (id: string, updates: Partial<import('../types').Folder>) => {
    const payload = mapFolderToDB(updates);
    
    return tryOfflineSync(
        { endpoint: 'folders', method: 'PATCH', payload, recordId: id },
        async () => {
            const { data, error } = await supabase
                .from('folders')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDBToFolder(data);
        },
        mapDBToFolder({ ...payload, id })
    );
};

export const deleteFolderAPI = async (id: string) => {
    return tryOfflineSync(
        { endpoint: 'folders', method: 'DELETE', recordId: id },
        async () => {
            const { error } = await supabase.from('folders').delete().eq('id', id);
            if (error) throw error;
        },
        undefined
    );
};

export const listFolders = async (): Promise<import('../types').Folder[]> => {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapDBToFolder);
};

// --- EVENTS ---

export const mapDBToEvent = (dbEvent: any): import('../types').CalendarEvent => ({
    id: dbEvent.id,
    title: dbEvent.title || '',
    start: new Date(dbEvent.start_time),
    end: new Date(dbEvent.end_time),
    type: dbEvent.type || 'personal',
    description: dbEvent.description,
    color: dbEvent.color,
    priority: dbEvent.priority,
    allDay: dbEvent.all_day,
    location: dbEvent.location,
    recurrence: dbEvent.recurrence,
    reminder: dbEvent.reminder
});

export const mapEventToDB = (localEvent: Partial<import('../types').CalendarEvent>): any => {
    const payload: any = {};
    if (localEvent.id !== undefined) payload.id = localEvent.id;
    if (localEvent.title !== undefined) payload.title = localEvent.title;
    if (localEvent.start !== undefined) payload.start_time = localEvent.start.toISOString();
    if (localEvent.end !== undefined) payload.end_time = localEvent.end.toISOString();
    if (localEvent.type !== undefined) payload.type = localEvent.type;
    if (localEvent.description !== undefined) payload.description = localEvent.description;
    if (localEvent.color !== undefined) payload.color = localEvent.color;
    if (localEvent.priority !== undefined) payload.priority = localEvent.priority;
    if (localEvent.allDay !== undefined) payload.all_day = localEvent.allDay;
    if (localEvent.location !== undefined) payload.location = localEvent.location;
    if (localEvent.recurrence !== undefined) payload.recurrence = localEvent.recurrence;
    if (localEvent.reminder !== undefined) payload.reminder = localEvent.reminder;
    return payload;
};

export const createEventAPI = async (eventData: Partial<import('../types').CalendarEvent>) => {
    const user = await handleAuthError();
    const payload = mapEventToDB(eventData);
    
    return tryOfflineSync(
        { endpoint: 'events', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('events')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToEvent(data);
        },
        mapDBToEvent({ ...payload, id: eventData.id || crypto.randomUUID() })
    );
};

export const updateEventAPI = async (id: string, updates: Partial<import('../types').CalendarEvent>) => {
    const payload = mapEventToDB(updates);
    
    return tryOfflineSync(
        { endpoint: 'events', method: 'PATCH', payload, recordId: id },
        async () => {
            const { data, error } = await supabase
                .from('events')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDBToEvent(data);
        },
        mapDBToEvent({ ...payload, id })
    );
};

export const deleteEventAPI = async (id: string) => {
    return tryOfflineSync(
        { endpoint: 'events', method: 'DELETE', recordId: id },
        async () => {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
        },
        undefined
    );
};

export const listEvents = async (): Promise<import('../types').CalendarEvent[]> => {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapDBToEvent);
};

// --- GOALS ---

export const mapDBToGoal = (dbGoal: any): import('../types').Goal => ({
    id: dbGoal.id,
    title: dbGoal.title || '',
    type: dbGoal.type || 'life',
    progress: dbGoal.progress || 0
});

export const mapGoalToDB = (localGoal: Partial<import('../types').Goal>): any => {
    const payload: any = {};
    if (localGoal.id !== undefined) payload.id = localGoal.id;
    if (localGoal.title !== undefined) payload.title = localGoal.title;
    if (localGoal.type !== undefined) payload.type = localGoal.type;
    if (localGoal.progress !== undefined) payload.progress = localGoal.progress;
    return payload;
};

export const createGoalAPI = async (goalData: Partial<import('../types').Goal>) => {
    const user = await handleAuthError();
    const payload = mapGoalToDB(goalData);
    
    return tryOfflineSync(
        { endpoint: 'goals', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('goals')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToGoal(data);
        },
        mapDBToGoal({ ...payload, id: goalData.id || crypto.randomUUID() })
    );
};

export const updateGoalAPI = async (id: string, updates: Partial<import('../types').Goal>) => {
    const payload = mapGoalToDB(updates);
    
    return tryOfflineSync(
        { endpoint: 'goals', method: 'PATCH', payload, recordId: id },
        async () => {
            const { data, error } = await supabase
                .from('goals')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDBToGoal(data);
        },
        mapDBToGoal({ ...payload, id })
    );
};

export const deleteGoalAPI = async (id: string) => {
    return tryOfflineSync(
        { endpoint: 'goals', method: 'DELETE', recordId: id },
        async () => {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
        },
        undefined
    );
};

export const listGoals = async (): Promise<import('../types').Goal[]> => {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapDBToGoal);
};

// --- STATS ---

export const mapDBToStats = (dbStats: any): import('../types').UserStats => ({
    exp: dbStats.exp || 0,
    level: dbStats.level || 1,
    streak: dbStats.streak || 0,
    focusMinutesToday: dbStats.focus_minutes_today || 0
});

export const mapStatsToDB = (localStats: Partial<import('../types').UserStats>): any => {
    const payload: any = {};
    if (localStats.exp !== undefined) payload.exp = localStats.exp;
    if (localStats.level !== undefined) payload.level = localStats.level;
    if (localStats.streak !== undefined) payload.streak = localStats.streak;
    if (localStats.focusMinutesToday !== undefined) payload.focus_minutes_today = localStats.focusMinutesToday;
    return payload;
};

export const updateStatsAPI = async (updates: Partial<import('../types').UserStats>) => {
    const user = await handleAuthError();
    const payload = mapStatsToDB(updates);
    
    return tryOfflineSync(
        { endpoint: 'stats', method: 'PATCH', payload: { ...payload, user_id: user.id } },
        async () => {
            // Upsert based on user_id
            const { data, error } = await supabase
                .from('stats')
                .upsert({ ...payload, user_id: user.id }, { onConflict: 'user_id' })
                .select()
                .single();
            if (error) throw error;
            return mapDBToStats(data);
        },
        mapDBToStats({ ...payload })
    );
};

export const getStatsAPI = async (): Promise<import('../types').UserStats | null> => {
    const user = await handleAuthError();
    const { data, error } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle since it might not exist yet
    if (error) throw error;
    return data ? mapDBToStats(data) : null;
};

// --- FOCUS HISTORY ---

export const mapDBToFocusSession = (dbSession: any): import('../types').FocusSession => ({
    id: dbSession.id,
    duration: dbSession.duration || 0,
    type: dbSession.type || 'focus',
    completedAt: new Date(dbSession.completed_at)
});

export const mapFocusSessionToDB = (localSession: Partial<import('../types').FocusSession>): any => {
    const payload: any = {};
    if (localSession.id !== undefined) payload.id = localSession.id;
    if (localSession.duration !== undefined) payload.duration = localSession.duration;
    if (localSession.type !== undefined) payload.type = localSession.type;
    if (localSession.completedAt !== undefined) payload.completed_at = localSession.completedAt.toISOString();
    return payload;
};

export const createFocusSessionAPI = async (sessionData: Partial<import('../types').FocusSession>) => {
    const user = await handleAuthError();
    const payload = mapFocusSessionToDB(sessionData);
    
    return tryOfflineSync(
        { endpoint: 'focus_history', method: 'POST', payload: { ...payload, user_id: user.id } },
        async () => {
            const { data, error } = await supabase
                .from('focus_history')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapDBToFocusSession(data);
        },
        mapDBToFocusSession({ ...payload, id: sessionData.id || crypto.randomUUID() })
    );
};

export const listFocusHistory = async (): Promise<import('../types').FocusSession[]> => {
    const { data, error } = await supabase
        .from('focus_history')
        .select('*')
        .order('completed_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToFocusSession);
};
