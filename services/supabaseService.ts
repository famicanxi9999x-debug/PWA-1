import { supabase } from '../lib/supabase';
import { Note, Task } from '../types';

const handleAuthError = async () => {
    const { data: userRow } = await supabase.auth.getUser();
    if (!userRow.user) throw new Error("User not authenticated");
    return userRow.user;
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
    const { data, error } = await supabase
        .from('notes')
        .insert([{ ...payload, user_id: user.id }])
        .select()
        .single();
    if (error) throw error;
    return mapDBToNote(data);
};

export const updateNoteAPI = async (id: string, updates: Partial<Note>) => {
    const payload = mapNoteToDB(updates);
    const { data, error } = await supabase
        .from('notes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return mapDBToNote(data);
};

export const deleteNoteAPI = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
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
    const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...payload, user_id: user.id }])
        .select()
        .single();
    if (error) throw error;
    return mapDBToTask(data);
};

export const updateTaskAPI = async (id: string, updates: Partial<Task>) => {
    const payload = mapTaskToDB(updates);

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
};

export const deleteTaskAPI = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
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
    const { data, error } = await supabase
        .from('folders')
        .insert([{ ...payload, user_id: user.id }])
        .select()
        .single();
    if (error) throw error;
    return mapDBToFolder(data);
};

export const updateFolderAPI = async (id: string, updates: Partial<import('../types').Folder>) => {
    const payload = mapFolderToDB(updates);
    const { data, error } = await supabase
        .from('folders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return mapDBToFolder(data);
};

export const deleteFolderAPI = async (id: string) => {
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) throw error;
};

export const listFolders = async (): Promise<import('../types').Folder[]> => {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapDBToFolder);
};
