import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { 
  Trophy, Target, TrendingDown, TrendingUp, Calendar, CheckCircle2, 
  Award, Star, Zap, ChevronRight, Info, Sparkles
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval, differenceInDays } from 'date-fns';
import { UserProfile, FoodLog, WeightLog, ActivityLog } from '../types';

interface ProgressViewProps {
  profile: UserProfile;
  foodLogs: FoodLog[];
  weightLogs: WeightLog[];
  activityLogs: ActivityLog[];
}

export default function ProgressView({ profile, foodLogs, weightLogs, activityLogs }: ProgressViewProps) {
  // 1. Weight Data Processing
  const weightData = useMemo(() => {
    return [...weightLogs]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => ({
        date: format(log.timestamp, 'MMM d'),
        weight: log.weight,
        timestamp: log.timestamp
      }));
  }, [weightLogs]);

  // 2. Calorie Balance Data (Last 7 Days)
  const calorieBalanceData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return days.map(day => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86400000;

      const intake = foodLogs
        .filter(log => log.timestamp >= dayStart && log.timestamp < dayEnd)
        .reduce((sum, log) => sum + log.calories, 0);

      const burned = activityLogs
        .filter(log => log.timestamp >= dayStart && log.timestamp < dayEnd)
        .reduce((sum, log) => sum + log.calories, 0);

      return {
        date: format(day, 'EEE'),
        intake,
        burned,
        net: intake - burned
      };
    });
  }, [foodLogs, activityLogs]);

  // 3. Consistency Data (Last 28 Days)
  const consistencyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 27),
      end: new Date()
    });

    return days.map(day => {
      const hasActivity = activityLogs.some(log => isSameDay(log.timestamp, day));
      return {
        date: day,
        active: hasActivity
      };
    });
  }, [activityLogs]);

  // 4. Milestone Calculations
  const milestones = useMemo(() => {
    const initialWeight = weightLogs[weightLogs.length - 1]?.weight || profile.weight;
    const currentWeight = weightLogs[0]?.weight || profile.weight;
    const targetWeight = profile.targetWeight;
    
    const totalToLose = Math.abs(initialWeight - targetWeight);
    const lostSoFar = Math.abs(initialWeight - currentWeight);
    const weightProgress = totalToLose > 0 ? (lostSoFar / totalToLose) : 0;

    // Consistency streak
    let streak = 0;
    const sortedActivityDates = [...new Set(activityLogs.map(l => startOfDay(l.timestamp).getTime()))].sort((a, b) => b - a);
    
    let checkDate = startOfDay(new Date()).getTime();
    for (let i = 0; i < sortedActivityDates.length; i++) {
      if (sortedActivityDates.includes(checkDate)) {
        streak++;
        checkDate -= 86400000;
      } else if (i === 0 && sortedActivityDates.includes(checkDate - 86400000)) {
        // If today isn't logged yet, check yesterday
        checkDate -= 86400000;
        streak++;
        checkDate -= 86400000;
      } else {
        break;
      }
    }

    return [
      {
        id: 'weight-50',
        title: 'Halfway Hero',
        description: 'Reached 50% of your weight goal',
        achieved: weightProgress >= 0.5,
        progress: Math.min(weightProgress * 2, 1) * 100,
        icon: <TrendingDown className="text-blue-500" />
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: '7-day workout streak',
        achieved: streak >= 7,
        progress: (Math.min(streak, 7) / 7) * 100,
        icon: <Zap className="text-orange-500" />
      },
      {
        id: 'consistency-master',
        title: 'Consistency King',
        description: '20 workouts in 30 days',
        achieved: consistencyData.filter(d => d.active).length >= 20,
        progress: (Math.min(consistencyData.filter(d => d.active).length, 20) / 20) * 100,
        icon: <Award className="text-purple-500" />
      }
    ];
  }, [weightLogs, profile, activityLogs, consistencyData]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-32 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Progress Tracking</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">Your journey, visualized.</p>
        </div>
        <div className="p-4 bg-white rounded-[24px] shadow-xl border border-[#5A5A40]/5">
          <TrendingUp className="text-[#5A5A40]" size={32} />
        </div>
      </header>

      {/* Weight Change Visualization */}
      <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm border border-[#5A5A40]/5">
              <Target size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Weight Journey</h2>
              <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Metric Evolution</p>
            </div>
          </div>
          <div className="px-6 py-2 bg-[#f5f5f0] rounded-full text-sm font-black text-[#5A5A40] tracking-tight border border-[#5A5A40]/5 shadow-sm">
            {weightData.length > 0 ? (
              <>
                <span className="opacity-30">{weightData[0].weight}kg</span>
                <ChevronRight size={14} className="inline mx-2 opacity-20" />
                <span>{weightData[weightData.length-1].weight}kg</span>
              </>
            ) : 'No data'}
          </div>
        </div>
        <div className="h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#5A5A40" strokeOpacity={0.05} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#5A5A40', fontWeight: 900, letterSpacing: '0.1em' }} 
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 1', 'dataMax + 1']} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: '1px solid rgba(90, 90, 64, 0.05)', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ fontWeight: 900, color: '#5A5A40', textTransform: 'uppercase', fontSize: '10px' }}
                labelStyle={{ fontWeight: 900, color: '#5A5A40', opacity: 0.3, marginBottom: '4px', fontSize: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#5A5A40" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#5A5A40', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 10, strokeWidth: 0, fill: '#5A5A40' }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Calorie Intake vs Expenditure */}
      <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-orange-50 rounded-[24px] text-orange-500 shadow-sm border border-orange-100">
              <Zap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Energy Balance</h2>
              <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Metabolic Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-6 p-2 bg-[#f5f5f0] rounded-full px-6 border border-[#5A5A40]/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5A5A40] shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/40">Intake</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/40">Burned</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calorieBalanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#5A5A40" strokeOpacity={0.05} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#5A5A40', fontWeight: 900, letterSpacing: '0.1em' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#5A5A40', fontWeight: 900, opacity: 0.2 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(90, 90, 64, 0.03)', radius: 20 }}
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: '1px solid rgba(90, 90, 64, 0.05)', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                labelStyle={{ fontWeight: 900, color: '#5A5A40', opacity: 0.3, marginBottom: '4px', fontSize: '10px' }}
              />
              <Bar dataKey="intake" stackId="a" fill="#5A5A40" radius={[0, 0, 0, 0]} name="Intake" />
              <Bar dataKey="burned" stackId="a" fill="#f97316" radius={[12, 12, 0, 0]} name="Burned" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Workout Consistency Grid */}
      <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm border border-[#5A5A40]/5">
              <Calendar size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Consistency</h2>
              <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Activity Heatmap</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-[#f5f5f0] rounded-full text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest border border-[#5A5A40]/5">
            Last 28 Days
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4 relative z-10">
          {consistencyData.map((day, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
              className={`aspect-square rounded-[18px] flex items-center justify-center transition-all duration-500 ${
                day.active 
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20 scale-105' 
                  : 'bg-[#f5f5f0] text-[#5A5A40]/10 border border-[#5A5A40]/5'
              }`}
              title={format(day.date, 'MMM d')}
            >
              {day.active && <CheckCircle2 size={18} strokeWidth={3} />}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-10 p-8 bg-[#f5f5f0]/50 rounded-[32px] flex items-center justify-between border border-[#5A5A40]/5 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white rounded-[20px] shadow-sm text-orange-500">
              <Zap size={24} strokeWidth={3} />
            </div>
            <div>
              <div className="text-lg font-black text-[#5A5A40] tracking-tight">Active Days</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30">Current Month Performance</div>
            </div>
          </div>
          <div className="text-5xl font-black text-[#5A5A40] tracking-tighter">
            {consistencyData.filter(d => d.active).length}
          </div>
        </div>
      </section>

      {/* Milestones Celebration */}
      <section className="space-y-8">
        <div className="flex items-center gap-5 mb-4">
          <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-500 border border-yellow-100">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Milestones</h2>
            <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Achievements & Goals</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {milestones.map((milestone, idx) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`p-8 rounded-[48px] border transition-all duration-500 ${
                milestone.achieved 
                  ? 'bg-white border-[#5A5A40]/5 shadow-2xl' 
                  : 'bg-[#f5f5f0]/30 border-dashed border-[#5A5A40]/10 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`p-5 rounded-[24px] shadow-sm ${milestone.achieved ? 'bg-[#f5f5f0] text-[#5A5A40]' : 'bg-white text-[#5A5A40]/20'}`}>
                  {React.cloneElement(milestone.icon as React.ReactElement<any>, { size: 32, strokeWidth: 3 })}
                </div>
                {milestone.achieved && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle2 size={20} strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              
              <h3 className="text-xl font-black text-[#5A5A40] tracking-tight mb-2">{milestone.title}</h3>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#5A5A40]/30 leading-relaxed mb-8">{milestone.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="opacity-30">Progress</span>
                  <span className="text-[#5A5A40]">{Math.round(milestone.progress)}%</span>
                </div>
                <div className="h-2.5 bg-[#f5f5f0] rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${milestone.achieved ? 'bg-[#5A5A40]' : 'bg-[#5A5A40]/30'}`}
                  />
                </div>
              </div>

              {milestone.achieved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-8 border-t border-[#5A5A40]/5 flex items-center justify-between"
                >
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Achievement Unlocked</span>
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Celebration Suggestion Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="bg-[#5A5A40] p-12 rounded-[56px] text-white relative overflow-hidden shadow-2xl shadow-[#5A5A40]/30"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles size={24} className="text-yellow-400" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.4em] font-black opacity-50">Next Big Goal</span>
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter">Reach 75% of your goal</h2>
          <p className="text-lg opacity-70 mb-10 max-w-xl font-medium leading-relaxed">
            You're doing amazing! Once you hit 75%, we'll unlock a personalized 
            advanced training plan to help you cross the finish line.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-white text-[#5A5A40] rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl hover:shadow-2xl transition-all"
          >
            View Details
            <ChevronRight size={20} strokeWidth={3} />
          </motion.button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-orange-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      </motion.div>
    </div>
  );
}
