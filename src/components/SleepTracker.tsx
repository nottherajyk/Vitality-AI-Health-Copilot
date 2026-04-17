import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SleepLog } from '../types';
import { Moon, Sun, Plus, History, Star, Clock, Trash2, TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SleepTrackerProps {
  logs: SleepLog[];
  onAddLog: (duration: number, quality: SleepLog['quality'], notes?: string) => void;
  onDeleteLog: (id: string) => void;
}

export default function SleepTracker({ logs, onAddLog, onDeleteLog }: SleepTrackerProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [duration, setDuration] = useState('8');
  const [quality, setQuality] = useState<SleepLog['quality']>('good');
  const [notes, setNotes] = useState('');

  const sleepData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return days.map(day => {
      const log = logs.find(l => isSameDay(l.timestamp, day));
      return {
        date: format(day, 'EEE'),
        hours: log ? log.durationHours : 0,
        quality: log ? log.quality : 'none'
      };
    });
  }, [logs]);

  const averageSleep = useMemo(() => {
    if (logs.length === 0) return 0;
    const recentLogs = logs.slice(0, 7);
    const total = recentLogs.reduce((sum, log) => sum + log.durationHours, 0);
    return (total / recentLogs.length).toFixed(1);
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog(parseFloat(duration), quality, notes);
    setIsLogging(false);
    setDuration('8');
    setQuality('good');
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-32 font-sans">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Sleep Tracking</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">Rest is the foundation of health.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsLogging(!isLogging)}
          className="p-5 bg-[#5A5A40] text-white rounded-[24px] shadow-2xl shadow-[#5A5A40]/30 hover:shadow-none transition-all"
        >
          <Plus size={28} className={isLogging ? 'rotate-45' : ''} />
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#f5f5f0] rounded-2xl text-[#5A5A40] shadow-sm">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Sleep Trends</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30">Weekly Cycle</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-[#5A5A40]/5 rounded-full text-[9px] font-black text-[#5A5A40]/40 uppercase tracking-widest border border-[#5A5A40]/10">
              Last 7 Days
            </div>
          </div>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData}>
                <defs>
                  <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#5A5A40" strokeOpacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#5A5A40', fontWeight: 900, opacity: 0.3 }} 
                />
                <YAxis 
                  hide 
                  domain={[0, 12]} 
                />
                <Tooltip 
                  cursor={{ stroke: '#5A5A40', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid rgba(90, 90, 64, 0.1)', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#5A5A40' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A5A40', opacity: 0.4, marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#5A5A40" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#5A5A40', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#5A5A40' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#5A5A40] rounded-[48px] p-10 text-white flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <Moon size={64} className="mb-6 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
          <div className="text-6xl font-black tracking-tighter mb-2">{averageSleep}<span className="text-xl opacity-40 ml-1">h</span></div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Avg Sleep / Night</div>
          <p className="mt-10 text-xs opacity-60 font-medium leading-relaxed italic max-w-[180px]">
            "Sleep is the golden chain that ties health and our bodies together."
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isLogging && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-[48px] p-12 shadow-2xl border border-[#5A5A40]/5 space-y-10 relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#5A5A40]/5 rounded-full -ml-16 -mt-16 blur-2xl pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30 ml-2">Duration (hours)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="w-full bg-[#f5f5f0]/50 p-6 rounded-[24px] outline-none font-black text-2xl text-[#5A5A40] border border-transparent focus:border-[#5A5A40]/10 focus:bg-white transition-all shadow-inner"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30 ml-2">Quality</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['poor', 'fair', 'good', 'excellent'] as const).map((q) => (
                      <motion.button
                        key={q}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                          quality === q 
                            ? 'bg-[#5A5A40] text-white shadow-xl shadow-[#5A5A40]/20' 
                            : 'bg-[#f5f5f0]/50 text-[#5A5A40]/40 hover:bg-white hover:text-[#5A5A40] border border-transparent hover:border-[#5A5A40]/10'
                        }`}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30 ml-2">Notes (optional)</label>
                <textarea 
                  className="w-full bg-[#f5f5f0]/50 p-6 rounded-[32px] outline-none font-medium text-[#5A5A40] h-32 resize-none border border-transparent focus:border-[#5A5A40]/10 focus:bg-white transition-all shadow-inner"
                  placeholder="How did you feel when you woke up?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full p-6 bg-[#5A5A40] text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 shadow-2xl shadow-[#5A5A40]/30 relative z-10"
              >
                <Sun size={24} />
                Log Sleep Session
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-8">
        <div className="flex items-center gap-4 ml-2">
          <div className="p-3 bg-[#f5f5f0] rounded-2xl text-[#5A5A40] shadow-sm">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Recent Sleep</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30">History & Logs</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-[#5A5A40]/10">
              <Moon size={48} className="mx-auto mb-4 text-[#5A5A40]/10" />
              <p className="text-[#5A5A40]/30 font-black uppercase tracking-widest text-xs">No sleep logs yet. Start tracking tonight!</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-8 bg-white rounded-[40px] border border-[#5A5A40]/5 group shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-inner group-hover:bg-[#5A5A40] group-hover:text-white transition-colors duration-500">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#5A5A40] tracking-tighter">{log.durationHours} <span className="text-xs opacity-30 uppercase tracking-widest">hours</span></div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">{format(log.timestamp, 'MMMM do, yyyy')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                    log.quality === 'excellent' ? 'bg-green-50 text-green-600 border border-green-100' :
                    log.quality === 'good' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    log.quality === 'fair' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {log.quality}
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => onDeleteLog(log.id)}
                    className="p-3 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-2xl"
                  >
                    <Trash2 size={20} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
