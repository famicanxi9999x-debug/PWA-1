"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Mail, Github, ArrowRight, Lock, User, Chrome, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

interface AuthSwitchProps {
  onAuthComplete?: () => void;
}

export default function AuthSwitch({ onAuthComplete }: AuthSwitchProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
      }
      if (onAuthComplete) onAuthComplete();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      {/* Dynamic Welcome Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isLogin ? "Welcome Back" : "Join Fameo"}
        </h2>
        <p className="text-white/40 text-sm">
          {isLogin ? "Enter your details to access your workspace." : "Create an account to start your journey."}
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="flex bg-white/5 p-1 rounded-md mb-8 border border-white/10 relative overflow-hidden">
        <motion.div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#1E2532] border border-[#2A3F5C] rounded-md shadow-sm z-0"
          animate={{
            left: isLogin ? "4px" : "calc(50%)",
            right: isLogin ? "calc(50%)" : "4px"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          className={cn(
            "flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-300",
            isLogin ? "text-white" : "text-white/50 hover:text-white"
          )}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className={cn(
            "flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-300",
            !isLogin ? "text-white" : "text-white/50 hover:text-white"
          )}
        >
          Sign Up
        </button>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4 relative overflow-hidden min-h-[250px]">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs leading-relaxed">{errorMsg}</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors"
                    size={16}
                  />
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#2A3F5C] focus:bg-white/10 transition-all placeholder:text-white/20"
                    placeholder="Alex Chen"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#2A3F5C] focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="alex@fameo.app"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
                {isLogin && <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300">Forgot?</a>}
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors"
                  size={16}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#2A3F5C] focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full mt-2 bg-[#1E2532] text-white border border-[#2A3F5C] font-bold py-3.5 rounded-md hover:bg-[#252E3E] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"} <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </form>

      {/* Social Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-medium tracking-widest">
          <span className="bg-[#1a1a2e] px-2 text-white/30">Or continue with</span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="w-full">
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin,
                }
              });
              if (error) throw error;
            } catch (err: any) {
              setErrorMsg(err.message || "Failed to initialize Google Login.");
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors text-white text-sm font-medium group disabled:opacity-50"
        >
          <Chrome size={18} className="text-white/70 group-hover:text-white" /> Continue with Google
        </button>
      </div>

      <p className="text-center text-[10px] text-white/30 mt-6 max-w-xs mx-auto">
        By continuing, you agree to Fameo's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}