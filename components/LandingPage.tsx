import React from 'react';
import { LazyHeroSection } from './ui/LazyHeroSection';
import { GradientMenu } from './ui/gradient-menu';
import { ArrowRight, Sparkles, Download, Brain, Focus, Calendar, Share2, Zap, LayoutDashboard } from 'lucide-react';

interface LandingPageProps {
    onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const features = [
        {
            icon: <Brain className="w-8 h-8" />,
            title: 'Rich Text Editor',
            description: 'Professional note-taking with formatting, tables, code blocks, and markdown support',
            color: 'from-blue-400 to-cyan-400'
        },
        {
            icon: <Download className="w-8 h-8" />,
            title: 'Export & Backup',
            description: 'Export to Markdown, JSON, HTML. Full workspace backup and restore capabilities',
            color: 'from-cyan-400 to-blue-300'
        },
        {
            icon: <Focus className="w-8 h-8" />,
            title: 'Focus Timer',
            description: 'Pomodoro technique with customizable intervals and break reminders',
            color: 'from-blue-300 to-indigo-400'
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: 'Smart Calendar',
            description: 'Visual timeline with drag-and-drop scheduling and recurring tasks',
            color: 'from-indigo-400 to-purple-400'
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: 'AI Assistant',
            description: 'Powered by Gemini AI for smart suggestions and content generation',
            color: 'from-purple-400 to-pink-400'
        },
        {
            icon: <Share2 className="w-8 h-8" />,
            title: 'Sync & Share',
            description: 'Cloud sync across devices with real-time collaboration (coming soon)',
            color: 'from-pink-400 to-blue-400'
        }
    ];

    return (
        <div className="landing-page">
            {/* Hero Section with 3D Scene */}
            <div className="relative">
                <LazyHeroSection />

                {/* CTA with Gradient Menu */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-8 px-4 w-full max-w-3xl">
                    {/* Gradient Navigation Menu */}
                    <GradientMenu
                        items={[
                            {
                                title: 'Dashboard',
                                icon: <LayoutDashboard className="w-6 h-6" />,
                                gradientFrom: '#3b82f6',
                                gradientTo: '#22d3ee',
                                onClick: onEnterApp
                            },
                            {
                                title: 'Brain',
                                icon: <Brain className="w-6 h-6" />,
                                gradientFrom: '#22d3ee',
                                gradientTo: '#10b981',
                                onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                            },
                            {
                                title: 'Focus',
                                icon: <Focus className="w-6 h-6" />,
                                gradientFrom: '#10b981',
                                gradientTo: '#8b5cf6',
                                onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                            },
                            {
                                title: 'Calendar',
                                icon: <Calendar className="w-6 h-6" />,
                                gradientFrom: '#8b5cf6',
                                gradientTo: '#ec4899',
                                onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                            },
                            {
                                title: 'AI',
                                icon: <Sparkles className="w-6 h-6" />,
                                gradientFrom: '#ec4899',
                                gradientTo: '#3b82f6',
                                onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                            }
                        ]}
                    />

                    {/* Primary CTA */}
                    <button
                        onClick={onEnterApp}
                        className="group relative px-10 py-4 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-3 overflow-hidden"
                    >
                        {/* Animated shine effect */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

                        <span className="relative z-10">Enter Fameo</span>
                        <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="relative bg-black py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Powerful Features
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            A complete productivity suite designed for students and professionals who demand excellence
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                                }}
                            >
                                {/* Gradient Glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>

                                {/* Icon */}
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg`}>
                                    {feature.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-white/60 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover Arrow */}
                                <div className="mt-6 flex items-center gap-2 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-sm font-medium">Learn more</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-20 text-center">
                        <button
                            onClick={onEnterApp}
                            className="group px-10 py-5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                        >
                            Start Your Journey
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="mt-6 text-white/40 text-sm">
                            No credit card required • Free forever • 0₫
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative bg-black border-t border-white/10 py-12 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4">
                        Fameo Life OS
                    </div>
                    <p className="text-white/40 mb-6">
                        Your ultimate productivity companion
                    </p>
                    <div className="flex justify-center gap-8 text-white/40 text-sm">
                        <button className="hover:text-white transition-colors">Privacy</button>
                        <button className="hover:text-white transition-colors">Terms</button>
                        <button className="hover:text-white transition-colors">Contact</button>
                    </div>
                    <div className="mt-8 text-white/20 text-xs">
                        © 2026 Fameo Life OS. Made with ❤️ in Vietnam
                    </div>
                </div>
            </footer>

            {/* Animation Keyframes */}
            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .landing-page {
          background: #000;
          min-height: 100vh;
        }
      `}</style>
        </div>
    );
};
