import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createNote, listNotes, createTask, listTasks } from '../services/supabaseService';
import { X, Loader2 } from 'lucide-react';

interface SupabaseTestProps {
    onClose: () => void;
}

export const SupabaseTest: React.FC<SupabaseTestProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [logs, setLogs] = useState<string>("Initializing Supabase Dev Tools...\n");
    const [loading, setLoading] = useState(false);

    const appendLog = (msg: string) => {
        setLogs(prev => prev + `[${new Date().toLocaleTimeString()}] ${msg}\n`);
    };

    const wrapAction = async (actionName: string, actionFn: () => Promise<any>) => {
        if (loading) return;
        setLoading(true);
        appendLog(`Starting: ${actionName}...`);
        try {
            const result = await actionFn();
            appendLog(`Success: ${actionName}`);
            if (result) {
                appendLog(`Output: ${JSON.stringify(result, null, 2)}`);
            }
        } catch (error: any) {
            appendLog(`Error in ${actionName}: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => wrapAction("Sign Up", async () => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    });

    const handleLogin = () => wrapAction("Login", async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    });

    const handleCheckSession = () => wrapAction("Check Session", async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data;
    });

    const handleLogout = () => wrapAction("Logout", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { status: "logged out" };
    });

    const handleCreateNote = () => wrapAction("Create Dummy Note", async () => {
        return await createNote({
            title: "Test Note from Dev Tools",
            content: "Hello from Supabase!",
            tags: ["test", "supabase"]
        });
    });

    const handleListNotes = () => wrapAction("List Notes", async () => {
        return await listNotes();
    });

    const handleCreateTask = () => wrapAction("Create Dummy Task", async () => {
        return await createTask({
            title: "Test Task from Dev Tools",
            context: "work",
            priority: "high"
        });
    });

    const handleListTasks = () => wrapAction("List Tasks", async () => {
        return await listTasks();
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a2e] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="border-b border-white/10 p-4 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                        Supabase CRUD Test
                        {loading && <Loader2 size={16} className="animate-spin text-white/50" />}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Panel: Controls */}
                    <div className="w-1/3 border-r border-white/10 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white/50 uppercase">Authentication</h3>
                            <input
                                type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white"
                            />
                            <input
                                type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white"
                            />
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button onClick={handleSignUp} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded transition-colors disabled:opacity-50">Sign Up</button>
                                <button onClick={handleLogin} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded transition-colors disabled:opacity-50">Login</button>
                                <button onClick={handleCheckSession} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white text-xs py-2 rounded transition-colors disabled:opacity-50">Session</button>
                                <button onClick={handleLogout} disabled={loading} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs py-2 rounded transition-colors disabled:opacity-50">Logout</button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/10"></div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white/50 uppercase">Notes (CRUD)</h3>
                            <button onClick={handleCreateNote} disabled={loading} className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs py-2 rounded transition-colors disabled:opacity-50 border border-blue-500/30">Create Dummy Note</button>
                            <button onClick={handleListNotes} disabled={loading} className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-2 rounded transition-colors disabled:opacity-50">List Notes</button>
                        </div>

                        <div className="w-full h-px bg-white/10"></div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white/50 uppercase">Tasks (CRUD)</h3>
                            <button onClick={handleCreateTask} disabled={loading} className="w-full bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs py-2 rounded transition-colors disabled:opacity-50 border border-amber-500/30">Create Dummy Task</button>
                            <button onClick={handleListTasks} disabled={loading} className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-2 rounded transition-colors disabled:opacity-50">List Tasks</button>
                        </div>

                        <button onClick={() => setLogs("")} className="mt-auto text-xs text-white/30 hover:text-white transition-colors underline text-center">Clear Logs</button>

                    </div>

                    {/* Right Panel: Logs */}
                    <div className="w-2/3 bg-black/60 p-4 overflow-y-auto custom-scrollbar font-mono text-xs text-green-400">
                        <pre className="whitespace-pre-wrap break-words">{logs}</pre>
                    </div>

                </div>
            </div>
        </div>
    );
};
