import React, { useState } from 'react';
import { useApp } from '../store';
import { Moon, CheckSquare, Heart, ArrowRight } from 'lucide-react';

export const Review: React.FC = () => {
    const { tasks, toggleTask } = useApp();
    const [step, setStep] = useState(0);
    const [reflection, setReflection] = useState('');

    const completedTasks = tasks.filter(t => t.completed);

    const steps = [
        {
            title: "Daily Shutdown",
            desc: "Close the loops. Clear your mind.",
            content: (
                <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
                        <Moon size={40} />
                    </div>
                    <h2 className="text-2xl font-light text-white">Ready to wrap up?</h2>
                    <p className="text-white/50 mt-2 max-w-sm mx-auto">Disconnecting from work is just as important as the work itself.</p>
                </div>
            )
        },
        {
            title: "Review Tasks",
            desc: "Celebrate small wins.",
            content: (
                <div className="space-y-4 text-left w-full max-w-md mx-auto">
                    <h3 className="font-medium text-white/80 flex items-center gap-2">
                        <CheckSquare size={18} /> What you achieved
                    </h3>
                    <div className="bg-white/5 rounded-md border border-white/10 divide-y divide-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                        {completedTasks.length > 0 ? completedTasks.map(t => (
                            <div key={t.id} className="p-3 text-sm text-white/70 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                <span className="line-through opacity-60">{t.title}</span>
                            </div>
                        )) : (
                            <div className="p-4 text-center text-white/30 text-sm">No tasks completed yet. That's okay!</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "Reflection",
            desc: "Gratitude & improvement.",
            content: (
                <div className="w-full max-w-md mx-auto">
                    <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Heart size={16} className="text-pink-400" /> 3 things I'm grateful for...
                    </label>
                    <textarea
                        className="w-full h-32 p-4 rounded-md border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C] resize-none placeholder:text-white/20"
                        placeholder="1. My health..."
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                    ></textarea>
                </div>
            )
        },
        {
            title: "Goodnight",
            desc: "See you tomorrow.",
            content: (
                <div className="text-center animate-pulse">
                    <h2 className="text-3xl font-light text-indigo-300 mb-4">Sleep well.</h2>
                    <p className="text-white/40">The system is now offline.</p>
                </div>
            )
        }
    ];

    const current = steps[step];

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent transition-colors">
            <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 text-center transition-all duration-500 border border-white/10 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

                <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-8">Step {step + 1} of {steps.length}</p>

                <div className="min-h-[300px] flex flex-col items-center justify-center animate-fade-in">
                    {current.content}
                </div>

                <div className="mt-8 flex justify-center">
                    {step < steps.length - 1 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="group flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 transition-all"
                        >
                            Next <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep(0)} // Reset for demo
                            className="px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
                        >
                            Return to Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};