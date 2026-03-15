import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

// 🔍 DIAGNOSTIC: confirm storage is available before client init
console.log('[Fameo Storage] localStorage available:',
    typeof window !== 'undefined' && !!window.localStorage);

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            // ✅ Persist session in localStorage (survives tab close / page reload)
            persistSession: true,

            // ✅ Do NOT set a custom storageKey — let Supabase use its default
            // "sb-{project-ref}-auth-token". A custom key desynchronises the
            // PKCE code_verifier lookup, causing silent exchange failures.

            // ✅ Explicit localStorage reference (safe for SSR guard)
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,

            autoRefreshToken: true,

            // ✅ Automatically exchange the OAuth code/token in the redirect URL
            detectSessionInUrl: true,

            // ❌ REMOVED: flowType: 'pkce'
            // PKCE requires the Supabase Dashboard Google provider to be configured
            // in "PKCE" mode. If the provider uses the default "Implicit" flow,
            // the redirect returns #access_token=... in the hash — not ?code=...
            // The PKCE client finds no code, exchange fails silently, nothing is
            // written to localStorage. Use the default implicit flow instead.
        }
    }
);
