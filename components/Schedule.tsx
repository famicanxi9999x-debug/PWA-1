import React, { useState } from 'react';
import { useApp } from '../store';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, MapPin, Clock } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

export const Schedule: React.FC = () => {
  const { events, addEvent, shiftFutureEvents, contextFilter, setContextFilter } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventData, setNewEventData] = useState<{title: string, day: number, startHour: number, type: 'work' | 'class' | 'personal'}>({
      title: '', day: 0, startHour: 9, type: 'work'
  });

  // Helper to get the Monday of the current week
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const formatHeaderDate = (dayIndex: number) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayIndex);
    return d.getDate();
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getEventsForDay = (dayIndex: number) => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + dayIndex);
    
    // Context-Aware Filtering
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), targetDate));
    
    if (contextFilter === 'all') return dayEvents;
    
    // Simple mapping of contexts for demo
    if (contextFilter === 'school') return dayEvents.filter(e => e.type === 'class');
    if (contextFilter === 'work') return dayEvents.filter(e => e.type === 'work');
    if (contextFilter === 'home') return dayEvents.filter(e => e.type === 'personal');
    
    return dayEvents;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const eventDate = new Date(startOfWeek);
      eventDate.setDate(startOfWeek.getDate() + newEventData.day);
      
      const start = new Date(eventDate);
      start.setHours(newEventData.startHour, 0, 0);
      
      const end = new Date(eventDate);
      end.setHours(newEventData.startHour + 1, 0, 0);

      addEvent({
          id: Date.now().toString(),
          title: newEventData.title,
          start: start,
          end: end,
          type: newEventData.type
      });
      setShowAddModal(false);
      setNewEventData({ ...newEventData, title: '' });
  };

  const openAddModal = (dayIndex: number, hour: number) => {
      setNewEventData({ ...newEventData, day: dayIndex, startHour: hour });
      setShowAddModal(true);
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'work': return 'bg-indigo-900/40 text-indigo-300 border-indigo-800';
          case 'class': return 'bg-orange-900/40 text-orange-300 border-orange-800';
          case 'personal': return 'bg-green-900/40 text-green-300 border-green-800';
          default: return 'bg-zinc-800 text-slate-300 border-zinc-700';
      }
  };

  const handleRunningLate = () => {
    if(window.confirm("Running late? Shift all future events today by 30 minutes?")) {
        shiftFutureEvents(30);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto bg-transparent overflow-hidden animate-fade-in">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-white/5 bg-transparent z-10 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CalIcon size={20} className="text-indigo-400"/> 
                {startOfWeek.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center bg-white/5 rounded-lg p-1">
                <button onClick={handlePrevWeek} className="p-1 hover:bg-white/10 rounded shadow-sm transition-all text-white/60"><ChevronLeft size={16}/></button>
                <button onClick={handleNextWeek} className="p-1 hover:bg-white/10 rounded shadow-sm transition-all text-white/60"><ChevronRight size={16}/></button>
            </div>
        </div>

        {/* Dynamic Schedule Controls */}
        <div className="flex items-center gap-3">
             {/* Context Selector */}
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

            {/* Buffer Time Button */}
            <button 
                onClick={handleRunningLate}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-900/20 text-orange-400 border border-orange-900/30 rounded-lg text-sm hover:bg-orange-900/30 transition-colors"
                title="Shift future tasks by 30 mins"
            >
                <Clock size={14} /> Running Late
            </button>

            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
            >
                <Plus size={16} /> Add Event
            </button>
        </div>
      </div>

      {/* Grid Header (Days) */}
      <div className="flex border-b border-white/5">
          <div className="w-16 flex-shrink-0 border-r border-white/5 bg-white/5"></div> {/* Time axis header */}
          {DAYS.map((day, idx) => {
              const dateNum = formatHeaderDate(idx);
              const isToday = isSameDay(new Date(), new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + idx));
              
              return (
                <div key={day} className={`flex-1 text-center py-3 border-r border-white/5 last:border-r-0 ${isToday ? 'bg-indigo-900/20' : ''}`}>
                    <p className={`text-xs font-bold uppercase ${isToday ? 'text-indigo-400' : 'text-white/40'}`}>{day}</p>
                    <div className={`w-8 h-8 mx-auto mt-1 rounded-full flex items-center justify-center text-sm font-medium ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-white/70'}`}>
                        {dateNum}
                    </div>
                </div>
              );
          })}
      </div>

      {/* Scrollable Grid Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex">
              {/* Time Column */}
              <div className="w-16 flex-shrink-0 bg-white/5 border-r border-white/5">
                  {HOURS.map(hour => (
                      <div key={hour} className="h-20 text-right pr-2 pt-2 text-xs text-white/30 relative">
                          {hour}:00
                      </div>
                  ))}
              </div>

              {/* Day Columns */}
              {DAYS.map((_, dayIdx) => (
                  <div key={dayIdx} className="flex-1 border-r border-white/5 relative min-w-[120px]">
                      {/* Grid Lines */}
                      {HOURS.map(hour => (
                          <div 
                            key={hour} 
                            onClick={() => openAddModal(dayIdx, hour)}
                            className="h-20 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group relative"
                          >
                             <div className="hidden group-hover:flex absolute inset-0 items-center justify-center opacity-50">
                                 <Plus size={16} className="text-white/30"/>
                             </div>
                          </div>
                      ))}

                      {/* Events Overlay */}
                      {getEventsForDay(dayIdx).map(event => {
                          const startHour = new Date(event.start).getHours();
                          const startMin = new Date(event.start).getMinutes();
                          const durationMin = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;
                          
                          // Only render if within our view hours (6-22)
                          if (startHour < 6) return null;

                          // Calculate position relative to 6:00 AM start
                          const top = ((startHour - 6) * 80) + ((startMin / 60) * 80);
                          const height = (durationMin / 60) * 80;

                          return (
                              <div
                                key={event.id}
                                className={`absolute left-1 right-1 rounded-md p-2 text-xs border shadow-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden ${getTypeColor(event.type)}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                title={`${event.title} (${durationMin} min)`}
                              >
                                  <div className="font-semibold truncate text-white/90">{event.title}</div>
                                  <div className="opacity-70 truncate text-[10px] text-white/70">
                                      {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                      {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
               <form onSubmit={handleAddSubmit} className="bg-[#1a1a2e] rounded-xl shadow-2xl p-6 w-full max-w-sm animate-slide-up border border-white/10 ring-1 ring-white/5">
                   <h3 className="text-lg font-bold text-white mb-4">Add Schedule Item</h3>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-white/40 uppercase mb-1">Title</label>
                           <input 
                             type="text" 
                             className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                             placeholder="Lecture, Study, Gym..."
                             autoFocus
                             value={newEventData.title}
                             onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                           />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-1">Day</label>
                                <select 
                                    className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white"
                                    value={newEventData.day}
                                    onChange={e => setNewEventData({...newEventData, day: parseInt(e.target.value)})}
                                >
                                    {DAYS.map((d, i) => <option key={d} value={i} className="bg-gray-900">{d}</option>)}
                                </select>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-1">Start Hour</label>
                                <select 
                                    className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white"
                                    value={newEventData.startHour}
                                    onChange={e => setNewEventData({...newEventData, startHour: parseInt(e.target.value)})}
                                >
                                    {HOURS.map(h => <option key={h} value={h} className="bg-gray-900">{h}:00</option>)}
                                </select>
                           </div>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-white/40 uppercase mb-1">Type</label>
                           <div className="flex gap-2">
                               {['work', 'class', 'personal'].map(type => (
                                   <button
                                     key={type}
                                     type="button"
                                     onClick={() => setNewEventData({...newEventData, type: type as any})}
                                     className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${newEventData.type === type ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'}`}
                                   >
                                       {type}
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-2 mt-6">
                       <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-white/40 hover:bg-white/5 rounded-lg">Cancel</button>
                       <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add</button>
                   </div>
               </form>
          </div>
      )}
    </div>
  );
};