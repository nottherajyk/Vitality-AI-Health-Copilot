import React, { useState } from 'react';
import { FoodLog, ActivityLog, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, Utensils, Activity, Target, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EnergyHistoryProps {
  profile: UserProfile;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  dailyGoal: number;
}

export default function EnergyHistory({ profile, foodLogs, activityLogs, dailyGoal }: EnergyHistoryProps) {
  const [viewDays, setViewDays] = useState(14); // Default to 2 weeks
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = eachDayOfInterval({
    start: subDays(new Date(), viewDays - 1),
    end: new Date()
  });

  const historyData = days.map(day => {
    const dayFood = foodLogs.filter(log => isSameDay(new Date(log.timestamp), day));
    const dayActivity = activityLogs.filter(log => isSameDay(new Date(log.timestamp), day));
    
    const consumed = dayFood.reduce((sum, log) => sum + log.calories, 0);
    const burned = dayActivity.reduce((sum, log) => sum + log.calories, 0);
    const balance = consumed - (dailyGoal + burned);
    
    return {
      date: day,
      dateStr: format(day, 'MMM d'),
      consumed,
      burned,
      target: dailyGoal + burned,
      balance,
      status: balance <= 0 ? 'deficit' : 'surplus'
    };
  });

  const selectedDayData = historyData.find(d => isSameDay(d.date, selectedDate)) || historyData[historyData.length - 1];

  return (
    <div className="space-y-12 pb-32 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Energy Balance</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">Your metabolic history over time.</p>
        </div>
        <div className="flex bg-white rounded-[24px] p-1.5 border border-[#5A5A40]/5 shadow-xl">
          {[7, 14, 30].map(d => (
            <motion.button
              key={d}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewDays(d)}
              className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                viewDays === d ? 'bg-[#5A5A40] text-white shadow-lg' : 'text-[#5A5A40] opacity-30 hover:opacity-60'
              }`}
            >
              {d}D
            </motion.button>
          ))}
        </div>
      </header>

      {/* Chart Section */}
      <section className="bg-white p-10 rounded-[56px] shadow-2xl border border-[#5A5A40]/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#5A5A40]/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
        
        <div className="h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={historyData} 
              margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0) {
                  setSelectedDate(data.activePayload[0].payload.date);
                }
              }}
            >
              <XAxis 
                dataKey="dateStr" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#5A5A40', opacity: 0.3, letterSpacing: '0.1em' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#5A5A40', opacity: 0.2 }}
              />
              <Tooltip 
                cursor={{ fill: '#f5f5f0', radius: 12 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-[#5A5A40]/5 min-w-[200px]"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-4">{format(data.date, 'MMMM do')}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Consumed</span>
                            <span className="text-sm font-black text-[#5A5A40]">{data.consumed} kcal</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Burned</span>
                            <span className="text-sm font-black text-orange-600">{data.burned} kcal</span>
                          </div>
                          <div className="h-px bg-[#5A5A40]/5 my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Net</span>
                            <span className="text-sm font-black text-[#5A5A40]">{data.consumed - data.burned} kcal</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="consumed" stackId="a" fill="#5A5A40" radius={[0, 0, 0, 0]} name="Consumed">
                {historyData.map((entry, index) => (
                  <Cell 
                    key={`cell-consumed-${index}`} 
                    fillOpacity={isSameDay(entry.date, selectedDate) ? 1 : 0.2}
                    className="transition-all duration-500"
                  />
                ))}
              </Bar>
              <Bar dataKey="burned" stackId="a" fill="#ea580c" radius={[8, 8, 0, 0]} name="Burned">
                {historyData.map((entry, index) => (
                  <Cell 
                    key={`cell-burned-${index}`} 
                    fillOpacity={isSameDay(entry.date, selectedDate) ? 1 : 0.2}
                    className="transition-all duration-500"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 flex justify-center gap-10 text-[9px] uppercase tracking-[0.3em] font-black opacity-30">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]" />
            Intake
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            Burned
          </div>
        </div>
      </section>

      {/* Detailed Day View */}
      <AnimatePresence mode="wait">
        <motion.section
          key={selectedDate.toISOString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-white p-10 rounded-[56px] shadow-2xl border border-[#5A5A40]/5 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40]">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#5A5A40] tracking-tighter">{format(selectedDate, 'MMMM do')}</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30">Daily Breakdown</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-[24px] text-blue-600">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Total Consumed</div>
                    <div className="text-xl font-black text-[#5A5A40] tracking-tight">{selectedDayData.consumed} kcal</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-50 rounded-[24px] text-orange-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Active Burn</div>
                    <div className="text-xl font-black text-orange-600 tracking-tight">-{selectedDayData.burned} kcal</div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#f5f5f0] rounded-[40px] border border-[#5A5A40]/5 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#5A5A40]/40">Energy Balance</span>
                  <span className={`text-xl font-black tracking-tighter ${selectedDayData.balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {selectedDayData.balance > 0 ? '+' : ''}{selectedDayData.balance} kcal
                  </span>
                </div>
                <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(selectedDayData.balance / 500) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${selectedDayData.balance <= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-5 text-center leading-relaxed">
                  {selectedDayData.balance <= 0 
                    ? "Optimal energy management achieved." 
                    : "Energy surplus detected. Consider more activity."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#5A5A40] p-10 rounded-[56px] shadow-2xl text-white relative overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"
            />
            
            <h3 className="text-2xl font-black tracking-tighter mb-10 flex items-center gap-4 relative z-10">
              <div className="p-4 bg-white/10 rounded-[24px]">
                <Target size={24} />
              </div>
              Goal Summary
            </h3>
            <div className="space-y-8 relative z-10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 mb-2">Daily Base Goal</div>
                <div className="text-4xl font-black tracking-tighter">{dailyGoal} <span className="text-sm opacity-30">kcal</span></div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 mb-2">Adjusted Target</div>
                <div className="text-4xl font-black tracking-tighter">{selectedDayData.target} <span className="text-sm opacity-30">kcal</span></div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-2">Base + Activity Burn</p>
              </div>
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 text-orange-400 mb-4">
                  <Flame size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Metabolic Insight</span>
                </div>
                <p className="text-sm font-medium opacity-70 leading-relaxed italic">
                  {profile.goal === 'lose' 
                    ? "To lose weight effectively, aim for a consistent deficit of 300-500 kcal per day."
                    : profile.goal === 'gain'
                    ? "To build muscle, aim for a consistent surplus of 200-400 kcal with high protein intake."
                    : "Consistency is key to maintaining your current metabolic health."}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
