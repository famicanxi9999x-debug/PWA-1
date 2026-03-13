import { supabase } from './supabase';

export interface PendingAction {
  id: string; // Unique ID for the action
  url: string; // pre-computed full URL
  method: 'POST' | 'PATCH' | 'DELETE';
  payload?: string; // stringified JSON
  timestamp: number;
  headers?: Record<string, string>; // Auth headers needed for background sync
}

const DB_NAME = 'fameo-offline-queue';
const STORE_NAME = 'pending-sync';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const addPendingAction = async (action: Omit<PendingAction, 'id' | 'timestamp' | 'headers' | 'url'> & { endpoint: string, recordId?: string }) => {
  const db = await initOfflineDB();
  
  // Try to capture current auth headers for the background worker
  let authHeaders: Record<string, string> = {
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch(e) { console.warn("Could not grab auth token for offline sync"); }

  // Construct full Supabase REST URL so the SW doesn't need env vars
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  let fullUrl = `${baseUrl}/rest/v1/${action.endpoint}`;
  if (action.recordId) {
      fullUrl += `?id=eq.${action.recordId}`;
  }

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const fullAction: PendingAction = {
      id: crypto.randomUUID(),
      url: fullUrl,
      method: action.method,
      payload: action.payload ? JSON.stringify(action.payload) : undefined,
      timestamp: Date.now(),
      headers: authHeaders
    };

    const request = store.add(fullAction);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getPendingActions = async (): Promise<PendingAction[]> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp so we replay oldest first
      const actions = request.result.sort((a, b) => a.timestamp - b.timestamp);
      resolve(actions);
    };
    request.onerror = () => reject(request.error);
  });
};

export const removePendingAction = async (id: string) => {
  const db = await initOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearAllPendingActions = async () => {
  const db = await initOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
