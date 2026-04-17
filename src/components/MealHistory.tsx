import React, { useState } from 'react';
import { FoodLog, MealType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Utensils, Plus, ChevronRight, Calendar, Search, Edit2, Copy, Trash2 } from 'lucide-react';
import { format, isSameDay, startOfDay } from 'date-fns';

interface MealHistoryProps {
  logs: FoodLog[];
  onClose: () => void;
  onReLog: (log: FoodLog) => void;
  onEdit: (log: FoodLog) => void;
  onDelete: (id: string) => void;
}

export default function MealHistory({ logs, onClose, onReLog, onEdit, onDelete }: MealHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(startOfDay(new Date(log.timestamp)), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, FoodLog[]>);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  const filteredLogs = logs.filter(log => 
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.mealType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLogs = searchTerm ? filteredLogs : (selectedDate ? groupedLogs[selectedDate] : logs);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-white flex flex-col font-sans"
    >
      <header className="p-8 border-b border-[#5A5A40]/5 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#5A5A40] tracking-tighter">Meal History</h2>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mt-1">{logs.length} entries recorded</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-4 bg-[#f5f5f0] hover:bg-[#5A5A40]/5 rounded-full transition-all"
        >
          <X size={24} className="text-[#5A5A40]" />
        </motion.button>
      </header>

      <div className="p-8 bg-[#f5f5f0]/30 border-b border-[#5A5A40]/5">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#5A5A40]/30" size={20} />
          <input 
            type="text"
            placeholder="Search your culinary history..."
            className="w-full pl-16 pr-8 py-5 bg-white rounded-[32px] border border-[#5A5A40]/5 outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-xl font-medium text-[#5A5A40]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {!searchTerm && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide max-w-4xl mx-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(null)}
              className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedDate === null ? 'bg-[#5A5A40] text-white shadow-xl' : 'bg-white text-[#5A5A40] border border-[#5A5A40]/5 shadow-sm'
              }`}
            >
              All Time
            </motion.button>
            {sortedDates.map(date => (
              <motion.button 
                key={date}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedDate === date ? 'bg-[#5A5A40] text-white shadow-xl' : 'bg-white text-[#5A5A40] border border-[#5A5A40]/5 shadow-sm'
                }`}
              >
                {format(new Date(date), 'MMM do')}
              </motion.button>
            ))}
          </div>
        )}

        <div className="space-y-6 max-w-4xl mx-auto">
          {displayLogs.length === 0 ? (
            <div className="text-center py-32 text-[#5A5A40]/20">
              <Utensils size={80} className="mx-auto mb-6 opacity-10" />
              <p className="text-2xl font-black tracking-tighter">No culinary records found</p>
            </div>
          ) : (
            displayLogs.sort((a, b) => b.timestamp - a.timestamp).map((log) => (
              <motion.div 
                layout
                key={log.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[48px] border border-[#5A5A40]/5 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                  <div className="flex items-center gap-6">
                    {log.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={log.imageUrl} 
                          alt={log.name} 
                          className="w-24 h-24 rounded-[32px] object-cover border border-[#5A5A40]/5 shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -top-2 -right-2 px-3 py-1 bg-[#5A5A40] text-white text-[8px] font-black uppercase rounded-full shadow-lg">
                          {log.mealType}
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-[#f5f5f0] rounded-[32px] flex items-center justify-center text-[#5A5A40] shadow-inner">
                        <Utensils size={32} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-[#5A5A40] tracking-tighter mb-2">{log.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30">
                        <Calendar size={14} />
                        <span>{format(log.timestamp, 'MMM do, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3 bg-[#f5f5f0] px-8 py-5 rounded-[32px] border border-[#5A5A40]/5">
                    <span className="text-4xl font-black text-[#5A5A40] tracking-tighter leading-none">{log.calories}</span>
                    <span className="text-[10px] font-black text-[#5A5A40]/30 uppercase tracking-[0.2em]">kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#f5f5f0]/50 p-4 rounded-[24px] text-center border border-[#5A5A40]/5">
                    <div className="text-lg font-black text-[#5A5A40] tracking-tight">{log.protein}g</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Protein</div>
                  </div>
                  <div className="bg-[#f5f5f0]/50 p-4 rounded-[24px] text-center border border-[#5A5A40]/5">
                    <div className="text-lg font-black text-[#5A5A40] tracking-tight">{log.carbs}g</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Carbs</div>
                  </div>
                  <div className="bg-[#f5f5f0]/50 p-4 rounded-[24px] text-center border border-[#5A5A40]/5">
                    <div className="text-lg font-black text-[#5A5A40] tracking-tight">{log.fat}g</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Fat</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-[#5A5A40]/5">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onReLog(log)}
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-[#5A5A40] text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-xl hover:shadow-[#5A5A40]/20 transition-all"
                  >
                    <Copy size={18} />
                    Log Again
                  </motion.button>
                  <div className="flex gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(log)}
                      className="p-5 bg-[#f5f5f0] text-[#5A5A40] rounded-[24px] hover:bg-[#5A5A40]/5 transition-all border border-[#5A5A40]/5"
                    >
                      <Edit2 size={20} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(log.id)}
                      className="p-5 bg-red-50 text-red-500 rounded-[24px] hover:bg-red-100 transition-all border border-red-100"
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
