import React from 'react';
import { Home, BookOpen, Focus, Calendar, Sparkles, LayoutDashboard } from 'lucide-react';

interface MenuItem {
    title: string;
    icon: React.ReactNode;
    gradientFrom: string;
    gradientTo: string;
    onClick?: () => void;
}

interface GradientMenuProps {
    items?: MenuItem[];
    onItemClick?: (title: string) => void;
}

const defaultMenuItems: MenuItem[] = [
    { title: 'Home', icon: <Home className="w-6 h-6" />, gradientFrom: '#3b82f6', gradientTo: '#22d3ee' },
    { title: 'Notes', icon: <BookOpen className="w-6 h-6" />, gradientFrom: '#22d3ee', gradientTo: '#10b981' },
    { title: 'Focus', icon: <Focus className="w-6 h-6" />, gradientFrom: '#10b981', gradientTo: '#8b5cf6' },
    { title: 'Calendar', icon: <Calendar className="w-6 h-6" />, gradientFrom: '#8b5cf6', gradientTo: '#ec4899' },
    { title: 'AI', icon: <Sparkles className="w-6 h-6" />, gradientFrom: '#ec4899', gradientTo: '#3b82f6' }
];

export const GradientMenu: React.FC<GradientMenuProps> = ({ items = defaultMenuItems, onItemClick }) => {
    return (
        <div className="flex justify-center items-center py-8">
            <ul className="flex gap-4 md:gap-6 flex-wrap justify-center">
                {items.map(({ title, icon, gradientFrom, gradientTo, onClick }, idx) => (
                    <li
                        key={idx}
                        style={
                            {
                                '--gradient-from': gradientFrom,
                                '--gradient-to': gradientTo,
                            } as React.CSSProperties
                        }
                        onClick={() => {
                            onClick?.();
                            onItemClick?.(title);
                        }}
                        className="relative w-[50px] h-[50px] md:w-[60px] md:h-[60px] bg-white/10 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[150px] md:hover:w-[180px] hover:shadow-2xl group cursor-pointer border border-white/20"
                    >
                        {/* Gradient background on hover */}
                        <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>

                        {/* Blur glow */}
                        <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-70"></span>

                        {/* Icon */}
                        <span className="relative z-10 transition-all duration-500 group-hover:scale-0 group-hover:opacity-0">
                            <span className="text-white/80 group-hover:text-white flex items-center justify-center">
                                {icon}
                            </span>
                        </span>

                        {/* Title */}
                        <span className="absolute text-white uppercase tracking-[0.15em] text-xs md:text-sm font-semibold transition-all duration-500 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-150">
                            {title}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
