import React from 'react';

// Base shimmer block reused by all skeletons
const Shimmer: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
    <div className={`animate-pulse bg-white/[0.06] rounded-xl ${className}`} style={style} />
);

// --- DASHBOARD SKELETON ---
export const DashboardSkeleton: React.FC = () => (
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-8 pt-2 pb-4">
        {/* Header */}
        <div className="border-b border-white/10 pb-4 md:pb-6 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-9 w-64 rounded-2xl" />
                <Shimmer className="h-4 w-80" />
            </div>
            <Shimmer className="h-12 w-20 rounded-xl" />
        </div>

        {/* Today's Focus */}
        <div>
            <Shimmer className="h-4 w-28 mb-3" />
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <Shimmer key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>

        {/* Action Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 md:p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <Shimmer className="h-3.5 w-24" />
                            <Shimmer className="h-2.5 w-16" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Shimmer className="h-8 w-full" />
                        <Shimmer className="h-8 w-full" />
                        <Shimmer className="h-8 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- TASK LIST SKELETON ---
export const TaskListSkeleton: React.FC = () => (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between gap-4">
            <Shimmer className="h-9 w-48 rounded-lg" />
            <Shimmer className="h-9 w-24 rounded-lg" />
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <Shimmer className="h-9 w-9 rounded-md" />
                    <Shimmer className="h-9 w-9 rounded-md" />
                </div>
                <Shimmer className="h-9 w-28 rounded-md" />
            </div>
            {/* Task rows */}
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <Shimmer className="w-5 h-5 rounded-full flex-shrink-0" />
                    <Shimmer className={`h-4 flex-1 ${i % 3 === 0 ? 'w-1/2' : 'w-full'}`} />
                    <Shimmer className="h-4 w-12 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

// --- SCHEDULE SKELETON ---
export const ScheduleSkeleton: React.FC = () => (
    <div className="h-full flex flex-col max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between">
            <Shimmer className="h-8 w-40 rounded-xl" />
            <div className="flex gap-2">
                <Shimmer className="h-8 w-8 rounded-lg" />
                <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
        </div>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
                <Shimmer key={i} className="h-6 rounded-lg" />
            ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
            {[...Array(35)].map((_, i) => (
                <Shimmer key={i} className={`rounded-xl ${i % 7 === 3 ? 'bg-indigo-500/10' : ''}`} style={{ minHeight: 60 }} />
            ))}
        </div>
    </div>
);

// --- GOALS / STATS SKELETON ---
export const GoalsSkeleton: React.FC = () => (
    <div className="flex flex-col gap-8 overflow-y-auto p-6 max-w-6xl mx-auto">
        {/* Level stats card */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-8 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Shimmer className="w-14 h-14 rounded-xl" />
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-24 rounded-lg" />
                        <Shimmer className="h-4 w-36" />
                    </div>
                </div>
                <div className="space-y-2 text-right">
                    <Shimmer className="h-10 w-20 rounded-lg ml-auto" />
                    <Shimmer className="h-3 w-16 ml-auto" />
                </div>
            </div>
            <Shimmer className="h-3 w-full rounded-full" />
        </div>
        {/* Goals grid */}
        <div>
            <Shimmer className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.05] p-6 rounded-xl space-y-4">
                        <div className="flex justify-between">
                            <div className="space-y-2">
                                <Shimmer className="h-5 w-16 rounded-full" />
                                <Shimmer className="h-6 w-44" />
                            </div>
                            <Shimmer className="w-5 h-5 rounded" />
                        </div>
                        <Shimmer className="h-3 w-20 rounded" />
                        <Shimmer className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
