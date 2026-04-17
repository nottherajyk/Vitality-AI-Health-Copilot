import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Area
} from 'recharts';
import { 
  Trophy, Target, Calendar, TrendingDown, Flame, 
  Award, CheckCircle2, ChevronRight, Star, Zap
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, differenceInDays } from 'date-fns';
import { UserProfile, FoodLog, WeightLog, ActivityLog, Milestone } from '../types';

interface ProgressTrackerProps {
  profile: UserProfile;
  foodLogs: FoodLog[];
  weightLogs: WeightLog[];
  activityLogs: ActivityLog[];
}

export default function ProgressTracker({ profile, foodLogs, weightLogs, activityLogs }: ProgressTrackerProps) {
  // 1. Weight Data Processing
  const weightData = useMemo(() => {
    return [...weightLogs]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => ({
        date: format(log.timestamp, 'MMM d'),
        weight: log.weight,
        target: profile.targetWeight
      }));
  }, [weightLogs, profile.targetWeight]);

  // 2. Calorie Data Processing (Last 7 days)
  const calorieData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      
      const intake = foodLogs
        .filter(log => isSameDay(new Date(log.timestamp), date))
        .reduce((sum, log) => sum + log.calories, 0);
        
      const burn = activityLogs
        .filter(log => isSameDay(new Date(log.timestamp), date))
        .reduce((sum, log) => sum + log.calories, 0);
        
      return {
        name: format(date, 'EEE'),
        intake,
        burn,
        net: intake - burn
      };
    });
    return days;
  }, [foodLogs, activityLogs]);

  // 3. Consistency Data (Last 30 days)
  const consistencyData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const hasActivity = activityLogs.some(log => isSameDay(new Date(log.timestamp), date));
      return { date, hasActivity };
    });
    return days;
  }, [activityLogs]);

  // 4. Milestone Logic
  const milestones = useMemo(() => {
    const list: Milestone[] = [];
    
    // Weight Loss Milestone (50%)
    if (weightLogs.length > 1) {
      const sortedWeights = [...weightLogs].sort((a, b) => a.timestamp - b.timestamp);
      const initialWeight = sortedWeights[0].weight;
      const currentWeight = sortedWeights[sortedWeights.length - 1].weight;
      const totalGoal = Math.abs(initialWeight - profile.targetWeight);
      const currentProgress = Math.abs(initialWeight - currentWeight);
      
      if (totalGoal > 0 && (currentProgress / totalGoal) >= 0.5) {
        list.push({
          id: 'weight-50',
          title: 'Halfway Hero',
          description: 'You have reached 50% of your weight loss goal!',
          icon: 'Trophy',
          achievedAt: Date.now(),
          type: 'weight'
        });
      }
    }

    // Workout Streak (7 days)
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const hasActivity = activityLogs.some(log => isSameDay(new Date(log.timestamp), date));
      if (hasActivity) currentStreak++;
      else break;
    }
    
    if (currentStreak >= 7) {
      list.push({
        id: 'streak-7',
        title: 'Consistency King',
        description: '7-day workout streak completed!',
        icon: 'Flame',
        achievedAt: Date.now(),
        type: 'streak'
      });
    }

    return list;
  }, [weightLogs, profile.targetWeight, activityLogs]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Milestones & Celebrations */}
      {milestones.length > 0 && (
        <section className="bg-black text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star size={120} className="animate-spin-slow" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-yellow-400" size={28} />
              <h2 className="text-2xl font-bold tracking-tight">Milestones Achieved</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map(m => (
                <motion.div 
                  key={m.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                    {m.icon === 'Trophy' ? <Trophy size={24} /> : <Flame size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{m.title}</h3>
                    <p className="text-sm text-white/60">{m.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Weight Tracking */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <TrendingDown size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Weight Journey</h2>
                <p className="text-sm text-black/40">Tracking your progress to {profile.targetWeight}kg</p>
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#000', opacity: 0.4 }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#000', opacity: 0.4 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#000" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#000', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
                <Line 
                  type="step" 
                  dataKey="target" 
                  stroke="#000" 
                  strokeDasharray="5 5" 
                  strokeWidth={1} 
                  opacity={0.3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Calorie Balance */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Energy Balance</h2>
                <p className="text-sm text-black/40">Intake vs. Expenditure (Last 7 Days)</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calorieData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#000', opacity: 0.4 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#000', opacity: 0.4 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="intake" name="Intake" fill="#000" radius={[10, 10, 0, 0]} barSize={20} />
                <Area type="monotone" dataKey="burn" name="Burned" fill="#f97316" stroke="#f97316" fillOpacity={0.1} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 4. Workout Consistency Heatmap */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-2xl text-green-600">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Workout Consistency</h2>
              <p className="text-sm text-black/40">Your activity over the last 30 days</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black/5" />
            <span className="text-[10px] uppercase tracking-widest opacity-40">Rest</span>
            <div className="w-3 h-3 rounded-full bg-black" />
            <span className="text-[10px] uppercase tracking-widest opacity-40">Active</span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-30 gap-2">
          {consistencyData.map((day, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              className={`aspect-square rounded-lg flex items-center justify-center relative group ${
                day.hasActivity ? 'bg-black text-white' : 'bg-black/5'
              }`}
              title={format(day.date, 'MMM d')}
            >
              {day.hasActivity && <CheckCircle2 size={12} />}
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                {format(day.date, 'MMM d')}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 pt-8 border-t border-black/5 flex flex-wrap gap-8">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-black">
              {consistencyData.filter(d => d.hasActivity).length}
            </div>
            <div className="text-xs uppercase tracking-widest opacity-40 leading-tight">
              Active Days<br/>This Month
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-black">
              {Math.round((consistencyData.filter(d => d.hasActivity).length / 30) * 100)}%
            </div>
            <div className="text-xs uppercase tracking-widest opacity-40 leading-tight">
              Consistency<br/>Score
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
