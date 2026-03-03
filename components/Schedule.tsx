import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, MapPin, Clock, Edit2, Trash2, X, Palette } from 'lucide-react';
import { CalendarEvent } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#0ea5e9', '#64748b'
];

// Helper to provide Vietnamese holidays
const getHolidaysForDate = (date: Date): string[] => {
    const month = date.getMonth(); // 0-indexed
    const d = date.getDate();
    const holidays = [];

    // Fixed Solar Holidays
    if (month === 0 && d === 1) holidays.push("Tết Dương Lịch");
    if (month === 1 && d === 14) holidays.push("Valentine's Day");
    if (month === 2 && d === 8) holidays.push("Quốc tế Phụ nữ");
    if (month === 3 && d === 30) holidays.push("Giải phóng Miền Nam");
    if (month === 4 && d === 1) holidays.push("Quốc tế Lao động");
    if (month === 5 && d === 1) holidays.push("Quốc tế Thiếu nhi");
    if (month === 8 && d === 2) holidays.push("Quốc khánh");
    if (month === 9 && d === 20) holidays.push("Phụ nữ Việt Nam");
    if (month === 9 && d === 31) holidays.push("Halloween");
    if (month === 10 && d === 20) holidays.push("Nhà giáo Việt Nam");
    if (month === 11 && d === 24) holidays.push("Giáng sinh (Noel)");

    // Approximated Lunar Holidays for 2026 (Tet is ~Feb 17 2026)
    const year = date.getFullYear();
    if (year === 2026) {
        if (month === 1 && d === 16) holidays.push("Giao Thừa (Tết Nguyên Đán)");
        if (month === 1 && d === 17) holidays.push("Mùng 1 Tết");
        if (month === 1 && d === 18) holidays.push("Mùng 2 Tết");
        if (month === 1 && d === 19) holidays.push("Mùng 3 Tết");
        if (month === 1 && d === 20) holidays.push("Mùng 4 Tết");
        if (month === 3 && d === 26) holidays.push("Giỗ Tổ Hùng Vương");
    } else if (year === 2025) {
        // Approximations for 2025 (Tet is ~Jan 29 2025)
        if (month === 0 && d === 28) holidays.push("Giao Thừa (Tết Nguyên Đán)");
        if (month === 0 && d === 29) holidays.push("Mùng 1 Tết");
        if (month === 0 && d === 30) holidays.push("Mùng 2 Tết");
        if (month === 0 && d === 31) holidays.push("Mùng 3 Tết");
        if (month === 3 && d === 7) holidays.push("Giỗ Tổ Hùng Vương");
    }

    return holidays;
};

export const Schedule: React.FC = () => {
    const { events, addEvent, updateEvent, deleteEvent, shiftFutureEvents, contextFilter, setContextFilter, tasks, toggleTask, updateTask } = useApp();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'day' | 'week'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
    const [newEventData, setNewEventData] = useState<{ title: string, description: string, color: string, date: Date, startHour: number, duration: number, type: 'work' | 'class' | 'personal', priority?: 'high' | 'medium' | 'low' }>({
        title: '', description: '', color: '', date: new Date(), startHour: 9, duration: 1, type: 'work'
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Initial scroll to 8 AM
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 8 * 80; // 8 AM * 80px per hour
        }
    }, [view]);

    const getStartOfWeek = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const monday = new Date(d);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const startOfWeek = getStartOfWeek(currentDate);

    const renderDays = view === 'week'
        ? Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        })
        : [currentDate];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getEventsForDay = (targetDate: Date) => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.start), targetDate));
        if (contextFilter === 'all') return dayEvents;
        if (contextFilter === 'school') return dayEvents.filter(e => e.type === 'class');
        if (contextFilter === 'work') return dayEvents.filter(e => e.type === 'work');
        if (contextFilter === 'home') return dayEvents.filter(e => e.type === 'personal');
        return dayEvents;
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const start = new Date(newEventData.date);
        start.setHours(Math.floor(newEventData.startHour), Math.round((newEventData.startHour % 1) * 60), 0);

        const end = new Date(start);
        end.setHours(Math.floor(newEventData.startHour + newEventData.duration), Math.round(((newEventData.startHour + newEventData.duration) % 1) * 60), 0);

        addEvent({
            id: Date.now().toString(),
            title: newEventData.title,
            description: newEventData.description,
            color: newEventData.color,
            start: start,
            end: end,
            type: newEventData.type,
            priority: newEventData.priority
        });
        setShowAddModal(false);
        setNewEventData({ title: '', description: '', color: '', date: new Date(), startHour: 9, duration: 1, type: 'work' });
    };

    const openAddModal = (date: Date, hour: number) => {
        setNewEventData({ title: '', description: '', color: '', date: date, startHour: hour, duration: 1, type: 'work' });
        setShowAddModal(true);
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const durationHours = (eventEnd.getTime() - eventStart.getTime()) / (60 * 60 * 1000);

        setNewEventData({
            title: event.title,
            description: event.description || '',
            color: event.color || '',
            date: eventStart,
            startHour: eventStart.getHours() + (eventStart.getMinutes() / 60),
            duration: durationHours,
            type: event.type,
            priority: event.priority
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;

        const start = new Date(newEventData.date);
        start.setHours(Math.floor(newEventData.startHour), Math.round((newEventData.startHour % 1) * 60), 0);

        const end = new Date(start);
        end.setHours(Math.floor(newEventData.startHour + newEventData.duration), Math.round(((newEventData.startHour + newEventData.duration) % 1) * 60), 0);

        updateEvent(selectedEvent.id, {
            title: newEventData.title,
            description: newEventData.description,
            color: newEventData.color,
            start: start,
            end: end,
            type: newEventData.type,
            priority: newEventData.priority
        });

        setShowEditModal(false);
        setSelectedEvent(null);
    };

    const handleDelete = (eventToDelete?: CalendarEvent) => {
        const target = eventToDelete || selectedEvent;
        if (!target) return;
        deleteEvent(target.id);
        setShowEditModal(false);
        setSelectedEvent(null);
    };

    const shiftDate = (days: number) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
    };

    const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const eventId = e.dataTransfer.getData('eventId');

        const start = new Date(date);
        start.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0);

        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const duration = task.estimatedTime ? task.estimatedTime / 60 : 1;
            const end = new Date(start);
            end.setHours(Math.floor(hour + duration), Math.round(((hour + duration) % 1) * 60), 0);

            addEvent({
                id: Date.now().toString(),
                title: task.title,
                description: `Scheduled from task: ${task.title}`,
                start: start,
                end: end,
                type: task.context === 'work' ? 'work' : task.context === 'learning' ? 'class' : 'personal',
                color: '',
                priority: task.priority
            });

            updateTask(taskId, { dueDate: start });
        } else if (eventId) {
            const draggingEvent = events.find(ev => ev.id === eventId);
            if (!draggingEvent) return;
            const duration = new Date(draggingEvent.end).getTime() - new Date(draggingEvent.start).getTime();
            const end = new Date(start.getTime() + duration);
            updateEvent(eventId, { start, end });
        }
        setDraggedTaskId(null);
        setDraggedEventId(null);
    };

    const unscheduledTasks = tasks.filter(t => !t.completed && !t.dueDate);

    return (
        <div className="h-full flex gap-4 max-w-[1600px] mx-auto bg-transparent overflow-hidden animate-fade-in pr-2">

            {/* Task Side-Tray (Drag Source) */}
            <div className={`hidden lg:flex w-72 flex-col bg-black/20 border border-white/5 rounded-2xl overflow-hidden my-4 ml-4 transition-all ${draggedTaskId ? 'border-primary/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : ''}`}>
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-400" />
                        Unscheduled Tasks
                    </h3>
                    <p className="text-xs text-white/40 mt-1">Drag tasks onto the calendar to schedule them.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {unscheduledTasks.length === 0 ? (
                        <div className="text-center text-white/30 text-xs py-10">All tasks scheduled! 🎉</div>
                    ) : (
                        unscheduledTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                    setDraggedTaskId(task.id);
                                }}
                                onDragEnd={() => setDraggedTaskId(null)}
                                className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-grab hover:bg-white/10 hover:border-white/20 transition-all active:cursor-grabbing hover:scale-[1.02]"
                            >
                                <div className="text-sm font-semibold text-white truncate mb-1">{task.title}</div>
                                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                    <span>{task.context || 'work'}</span>
                                    {task.estimatedTime && <span className="flex items-center gap-1"><Clock size={10} /> {task.estimatedTime}m</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
                {/* Calendar Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-white/5 bg-transparent z-10 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <CalIcon size={20} className="text-indigo-400" />
                            {view === 'week'
                                ? startOfWeek.toLocaleString('default', { month: 'long', year: 'numeric' })
                                : currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </h2>
                        <div className="flex items-center bg-white/5 rounded-lg p-1 gap-1">
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-white/10 rounded shadow-sm transition-all text-xs font-medium text-white/80">
                                Today
                            </button>
                            <button onClick={() => shiftDate(view === 'week' ? -7 : -1)} className="p-1 hover:bg-white/10 rounded shadow-sm transition-all text-white/60">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => shiftDate(view === 'week' ? 7 : 1)} className="p-1 hover:bg-white/10 rounded shadow-sm transition-all text-white/60">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Schedule Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/5 hidden sm:flex">
                            <button onClick={() => setView('day')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'day' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>Day</button>
                            <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'week' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>Week</button>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <MapPin size={14} className="text-white/40" />
                            <select
                                value={contextFilter}
                                onChange={(e) => setContextFilter(e.target.value)}
                                className="bg-transparent text-sm font-medium text-white/80 focus:outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-gray-900">All Contexts</option>
                                <option value="school" className="bg-gray-900">At School</option>
                                <option value="work" className="bg-gray-900">At Work</option>
                                <option value="home" className="bg-gray-900">At Home</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">Add Event</span>
                        </button>
                    </div>
                </div>

                {/* Grid Header (Days) */}
                <div className="flex border-b border-white/5">
                    <div className="w-16 flex-shrink-0 border-r border-white/5 bg-white/5"></div>
                    {renderDays.map((date) => {
                        const isToday = isSameDay(new Date(), date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <div key={date.toISOString()} className={`flex-1 text-center py-3 border-r border-white/5 last:border-r-0 ${isToday ? 'bg-indigo-900/20' : ''}`}>
                                <p className={`text-xs font-bold uppercase ${isToday ? 'text-indigo-400' : 'text-white/40'}`}>{dayName}</p>
                                <div className={`w-8 h-8 mx-auto mt-1 rounded-full flex items-center justify-center text-sm font-medium ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-white/70'}`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* All-Day / Tasks / Holidays Section */}
                <div className="flex border-b border-white/5 bg-[#12121a]">
                    <div className="w-16 flex-shrink-0 border-r border-white/5 py-2 px-1 text-[10px] uppercase font-bold text-white/40 flex flex-col items-center justify-center">
                        <span>All-day</span>
                    </div>
                    {renderDays.map((date) => {
                        const dayHolidays = getHolidaysForDate(date);
                        const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date) && !t.completed);

                        return (
                            <div key={`allday-${date.toISOString()}`} className="flex-1 border-r border-white/5 last:border-r-0 p-1 min-h-[60px] pb-6 flex flex-col gap-1">
                                {dayHolidays.map((holiday, i) => (
                                    <div key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate flex items-center gap-1">
                                        <span className="text-[8px]">🌴</span> {holiday}
                                    </div>
                                ))}
                                {dayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className="text-[10px] font-medium text-blue-100 bg-blue-600/30 px-1.5 py-0.5 rounded truncate border border-blue-500/30 cursor-pointer hover:bg-blue-500/40 transition-colors flex items-center gap-1.5"
                                        title="Click to complete task"
                                    >
                                        <div className="w-2 h-2 rounded text-[7px] border border-blue-300/50 flex items-center justify-center flex-shrink-0 bg-black/20"></div>
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Scrollable Grid Area */}
                <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar relative">
                    <div className="flex min-w-max md:min-w-0">
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 bg-white/5 border-r border-white/5 relative bg-[#111113] z-10 sticky left-0">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-20 text-right pr-2 pt-2 text-xs text-white/30 relative border-b border-transparent">
                                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {renderDays.map((date) => (
                            <div key={date.toISOString()} className="flex-1 border-r border-white/5 relative min-w-[120px]">
                                {/* Current Time Indicator 🔴 */}
                                {isSameDay(currentTime, date) && (
                                    <div
                                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                        style={{
                                            top: `${(currentTime.getHours() * 80) + ((currentTime.getMinutes() / 60) * 80)}px`
                                        }}
                                    >
                                        <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-md"></div>
                                    </div>
                                )}

                                {/* Grid Lines */}
                                {HOURS.map(hour => (
                                    <div
                                        key={hour}
                                        onClick={() => openAddModal(date, hour)}
                                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                        onDrop={(e) => handleDrop(e, date, hour)}
                                        className={`h-20 border-b border-white/5 transition-colors cursor-pointer group relative ${draggedTaskId || draggedEventId ? 'hover:bg-indigo-500/20 hover:border-indigo-400 border-dashed' : 'hover:bg-white/5'}`}
                                    >
                                        {/* Half-hour marker dashed line relative to cell */}
                                        <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-white/5 pointer-events-none opacity-50" />
                                        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center opacity-50 pointer-events-none">
                                            <Plus size={16} className={`transition-colors ${draggedTaskId ? 'text-indigo-400' : 'text-white/30'}`} />
                                        </div>
                                    </div>
                                ))}

                                {/* Events Overlay */}
                                {getEventsForDay(date).map(event => {
                                    const startHour = new Date(event.start).getHours();
                                    const startMin = new Date(event.start).getMinutes();
                                    const durationMin = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;

                                    const top = (startHour * 80) + ((startMin / 60) * 80);
                                    const height = (durationMin / 60) * 80;

                                    return (
                                        <div
                                            key={event.id}
                                            draggable
                                            onDragStart={(e) => { e.dataTransfer.setData('eventId', event.id); setDraggedEventId(event.id); }}
                                            onDragEnd={() => setDraggedEventId(null)}
                                            onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                            className={`absolute left-1 right-1 rounded-lg p-2 text-xs border-2 shadow-lg cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all overflow-hidden group ${draggedEventId === event.id ? 'opacity-50' : ''}`}
                                            style={{
                                                top: `${top}px`,
                                                height: `${height}px`,
                                                backgroundColor: event.color ? `${event.color}E6` : event.type === 'work'
                                                    ? '#3B82F6E6' // Solid muted blue
                                                    : event.type === 'class'
                                                        ? '#F59E0BE6' // Solid muted amber
                                                        : '#10B981E6', // Solid muted emerald
                                                borderColor: event.color ? event.color : event.type === 'work' ? '#2563EB' : event.type === 'class' ? '#D97706' : '#059669',
                                                zIndex: 10
                                            }}
                                            title={`Click to edit`}
                                        >
                                            <div className="font-bold truncate text-white mb-0.5 flex items-center justify-between gap-1">
                                                <span className="truncate">{event.title}</span>
                                                {event.priority === 'high' && <span className="text-[8px] text-red-100 bg-red-600/80 px-1 py-0.5 rounded uppercase font-bold tracking-wider flex-shrink-0">High</span>}
                                                {event.priority === 'medium' && <span className="text-[8px] text-yellow-100 bg-yellow-600/80 px-1 py-0.5 rounded uppercase font-bold tracking-wider flex-shrink-0">Med</span>}
                                                {event.priority === 'low' && <span className="text-[8px] text-blue-100 bg-blue-600/80 px-1 py-0.5 rounded uppercase font-bold tracking-wider flex-shrink-0">Low</span>}
                                            </div>
                                            <div className="opacity-70 truncate text-[10px] text-white/70">
                                                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {/* Quick action buttons on hover */}
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                                    className="p-1 bg-black/40 rounded hover:bg-black/60 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={10} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(event);
                                                    }}
                                                    className="p-1 bg-red-500/40 rounded hover:bg-red-500/60 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Event Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                        <form onSubmit={handleAddSubmit} onClick={(e) => e.stopPropagation()} className="bg-[#111113] rounded-md shadow-sm p-6 w-full max-w-md animate-slide-up border border-[#2A2D35]">
                            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-400" />
                                Add Event
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                        placeholder="Event title..."
                                        autoFocus
                                        value={newEventData.title}
                                        onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                            value={`${String(Math.floor(newEventData.startHour)).padStart(2, '0')}:${String(Math.round((newEventData.startHour % 1) * 60)).padStart(2, '0')}`}
                                            onChange={e => {
                                                const [h, m] = e.target.value.split(':');
                                                setNewEventData({ ...newEventData, startHour: parseInt(h) + (parseInt(m) / 60) });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Duration</label>
                                        <select
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                            value={newEventData.duration}
                                            onChange={e => setNewEventData({ ...newEventData, duration: parseFloat(e.target.value) })}
                                        >
                                            {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => <option key={h} value={h} className="bg-gray-900">{h}h</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Description</label>
                                        <textarea
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C] min-h-[80px]"
                                            placeholder="Event description..."
                                            value={newEventData.description}
                                            onChange={e => setNewEventData({ ...newEventData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-white/50 uppercase mb-2">Type</label>
                                                <div className="flex gap-2">
                                                    {['work', 'class', 'personal'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setNewEventData({ ...newEventData, type: type as any })}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${newEventData.type === type ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/50 border-white/5 hover:bg-white/5'}`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-white/50 uppercase mb-2">Priority</label>
                                                <div className="flex gap-2">
                                                    {['high', 'medium', 'low'].map(prio => (
                                                        <button
                                                            key={prio}
                                                            type="button"
                                                            onClick={() => setNewEventData({ ...newEventData, priority: prio as any })}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${newEventData.priority === prio ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/50 border-white/5 hover:bg-white/5'}`}
                                                        >
                                                            {prio}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-white/50 uppercase mb-2">Color</label>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewEventData({ ...newEventData, color: '' })}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${newEventData.color === '' ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'} bg-white/10 text-white/50 flex items-center justify-center`}
                                                >
                                                    <X size={12} />
                                                </button>
                                                {PRESET_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setNewEventData({ ...newEventData, color })}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${newEventData.color === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-white/50 hover:bg-white/5 rounded-md transition-colors font-medium">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-[#1E2532] text-white border border-[#2A3F5C] rounded-md hover:bg-[#252E3E] font-medium transition-colors shadow-sm">Save Event</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Edit Event Modal */}
                {showEditModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
                        <form onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} className="bg-[#111113] rounded-md shadow-sm p-6 w-full max-w-md animate-slide-up border border-[#2A2D35]">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Edit2 size={20} className="text-indigo-400" />
                                    Edit Event
                                </h3>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                        placeholder="Event title..."
                                        autoFocus
                                        value={newEventData.title}
                                        onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                            value={`${String(Math.floor(newEventData.startHour)).padStart(2, '0')}:${String(Math.round((newEventData.startHour % 1) * 60)).padStart(2, '0')}`}
                                            onChange={e => {
                                                const [h, m] = e.target.value.split(':');
                                                setNewEventData({ ...newEventData, startHour: parseInt(h) + (parseInt(m) / 60) });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Duration</label>
                                        <select
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C]"
                                            value={newEventData.duration}
                                            onChange={e => setNewEventData({ ...newEventData, duration: parseFloat(e.target.value) })}
                                        >
                                            {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => <option key={h} value={h} className="bg-[#111113]">{h}h</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Description</label>
                                        <textarea
                                            className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#2A3F5C] min-h-[80px]"
                                            placeholder="Event description..."
                                            value={newEventData.description}
                                            onChange={e => setNewEventData({ ...newEventData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-white/50 uppercase mb-2">Type</label>
                                                <div className="flex gap-2">
                                                    {['work', 'class', 'personal'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setNewEventData({ ...newEventData, type: type as any })}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${newEventData.type === type ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/50 border-white/5 hover:bg-white/5'}`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-white/50 uppercase mb-2">Priority</label>
                                                <div className="flex gap-2">
                                                    {['high', 'medium', 'low'].map(prio => (
                                                        <button
                                                            key={prio}
                                                            type="button"
                                                            onClick={() => setNewEventData({ ...newEventData, priority: prio as any })}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${newEventData.priority === prio ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/50 border-white/5 hover:bg-white/5'}`}
                                                        >
                                                            {prio}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-white/50 uppercase mb-2">Color</label>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewEventData({ ...newEventData, color: '' })}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${newEventData.color === '' ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'} bg-white/10 text-white/50 flex items-center justify-center`}
                                                >
                                                    <X size={12} />
                                                </button>
                                                {PRESET_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setNewEventData({ ...newEventData, color })}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${newEventData.color === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => handleDelete()} className="py-2.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors font-medium">Delete</button>
                                <button type="submit" className="flex-1 py-2.5 bg-[#1E2532] text-white border border-[#2A3F5C] rounded-md hover:bg-[#252E3E] font-medium transition-colors shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};