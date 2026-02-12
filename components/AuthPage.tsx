import React from 'react';
import { useApp } from '../store';
import AuthSwitch from './ui/auth-switch';
import { Sparkles, X } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, setShowLoginPage } = useApp();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[linear-gradient(135deg,#0f0f1a_0%,#1a1a2e_50%,#16213e_100%)] p-4 relative overflow-hidden">
        
        {/* Back Button */}
        <button 
            onClick={() => setShowLoginPage(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-50 border border-white/5"
            title="Return to App"
        >
            <X size={24} />
        </button>

        {/* Background Ambient Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 rounded-3xl overflow-hidden shadow-2xl bg-[#1a1a2e]/50 backdrop-blur-md border border-white/5 ring-1 ring-white/5">
            
            {/* Left Column: Brand/Welcome */}
            <div className="hidden md:flex flex-col justify-between p-12 bg-black/20 relative">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a2e]/90"></div>
                 
                 <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">FlowState</span>
                     </div>
                     <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Your Life OS,<br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Reimagined.</span>
                     </h1>
                     <p className="text-lg text-white/60 font-light">
                        Manage tasks, focus, and goals in one unified flow. No friction, just focus.
                     </p>
                 </div>

                 <div className="relative z-10 space-y-6">
                     <div className="flex gap-4">
                         <div className="flex flex-col">
                             <span className="text-2xl font-bold text-white">10k+</span>
                             <span className="text-xs text-white/40 uppercase tracking-wider">Users</span>
                         </div>
                         <div className="w-px bg-white/10 h-10"></div>
                         <div className="flex flex-col">
                             <span className="text-2xl font-bold text-white">4.9</span>
                             <span className="text-xs text-white/40 uppercase tracking-wider">Rating</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Right Column: Auth Form */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-[#1a1a2e] relative">
                <div className="md:hidden flex items-center justify-center gap-2 mb-8">
                     <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                     </div>
                     <span className="text-lg font-bold text-white">FlowState</span>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-white/40 text-sm">Enter your details to access your workspace.</p>
                </div>

                <AuthSwitch onAuthComplete={login} />
            </div>
        </div>
    </div>
  );
};