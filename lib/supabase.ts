import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Please check your .env.local file.");
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,       // Always store session in localStorage
            autoRefreshToken: true,     // Auto-refresh before expiry
            detectSessionInUrl: true,   // Handle OAuth redirects
            storageKey: 'fameo-auth',   // Custom key so PWA cache doesn't interfere
        }
    }
);
