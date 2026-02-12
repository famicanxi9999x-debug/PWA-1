"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Mail, Github, ArrowRight, Lock, User, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthSwitchProps {
    onAuthComplete?: () => void;
}

export default function AuthSwitch({ onAuthComplete }: AuthSwitchProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        if (onAuthComplete) onAuthComplete();
    }, 1500);
  };

  return (
    <div className="w-full mx-auto">
      {/* Toggle Switch */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/10 relative overflow-hidden">
        <motion.div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/20 z-0"
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
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      placeholder="alex@flowstate.app"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button
                  disabled={loading}
                  className="w-full mt-2 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-white/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                     <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
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
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white text-xs font-medium group">
          <Github size={16} className="text-white/70 group-hover:text-white" /> Github
        </button>
        <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white text-xs font-medium group">
          <Chrome size={16} className="text-white/70 group-hover:text-white" /> Google
        </button>
      </div>
      
      <p className="text-center text-[10px] text-white/30 mt-6 max-w-xs mx-auto">
          By continuing, you agree to FlowState's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}