import React, { useState, useEffect } from 'react';
import { UserProfile, FoodLog, DailyStats, WeightLog, WaterLog, ActivityLog, WorkoutSuggestion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { Flame, Utensils, Target, TrendingUp, History, User as UserIcon, Scale, Plus, Droplets, Activity, Bike, Footprints, Timer, Sparkles, Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import FoodScanner from './FoodScanner';
import HealthConnect from './HealthConnect';
import MealHistory from './MealHistory';
import EditMealModal from './EditMealModal';
import { format } from 'date-fns';
import { generateWorkoutSuggestions } from '../services/geminiService';

interface DashboardProps {
  profile: UserProfile;
  foodLogs: FoodLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  activityLogs: ActivityLog[];
  onAddLog: (log: FoodLog) => void;
  onUpdateLog: (log: FoodLog) => void;
  onDeleteLog: (id: string) => void;
  onAddWeightLog: (weight: number) => void;
  onAddWaterLog: (amount: number) => void;
  onAddActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onAddCustomActivityType: (type: string) => void;
  onSyncActivity: (calories: number) => void;
  dailyGoal: number;
}

export default function Dashboard({ 
  profile, 
  foodLogs, 
  weightLogs, 
  waterLogs, 
  activityLogs,
  onAddLog, 
  onUpdateLog,
  onDeleteLog,
  onAddWeightLog, 
  onAddWaterLog, 
  onAddActivityLog,
  onAddCustomActivityType,
  onSyncActivity,
  dailyGoal 
}: DashboardProps) {
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [isAddingWater, setIsAddingWater] = useState(false);
  const [isShowingHistory, setIsShowingHistory] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [weightInput, setWeightInput] = useState(profile.weight.toString());
  const [activityInput, setActivityInput] = useState({ 
    type: 'Walking', 
    calories: '', 
    duration: '', 
    customName: '',
    intensity: 'moderate' as 'very_low' | 'low' | 'moderate' | 'high' | 'very_high',
    isManualCalories: true
  });
  const [activitySearch, setActivitySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [workoutSuggestions, setWorkoutSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async (force = false) => {
      const cached = localStorage.getItem('workout_suggestions');
      const cachedDate = localStorage.getItem('workout_suggestions_date');
      const today = new Date().toDateString();

      if (!force && cached && cachedDate === today) {
        setWorkoutSuggestions(JSON.parse(cached));
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const suggestions = await generateWorkoutSuggestions(profile, activityLogs);
        setWorkoutSuggestions(suggestions);
        localStorage.setItem('workout_suggestions', JSON.stringify(suggestions));
        localStorage.setItem('workout_suggestions_date', today);
      } catch (error) {
        console.error("Error fetching workout suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    if (activityLogs.length > 0 || profile.customActivityTypes?.length) {
      fetchSuggestions();
    }
  }, [profile, activityLogs.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.activity-type-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefreshSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await generateWorkoutSuggestions(profile, activityLogs);
      setWorkoutSuggestions(suggestions);
      localStorage.setItem('workout_suggestions', JSON.stringify(suggestions));
      localStorage.setItem('workout_suggestions_date', new Date().toDateString());
    } catch (error) {
      console.error("Error refreshing workout suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const MET_VALUES: Record<string, { very_low: number; low: number; moderate: number; high: number; very_high: number }> = {
    'Walking': { very_low: 2.0, low: 2.5, moderate: 3.5, high: 4.5, very_high: 5.5 },
    'Running': { very_low: 5.0, low: 6.5, moderate: 8.5, high: 10.5, very_high: 13.5 },
    'Cycling': { very_low: 3.5, low: 5.5, moderate: 8.0, high: 10.5, very_high: 14.0 },
    'Swimming': { very_low: 3.0, low: 4.5, moderate: 7.0, high: 9.5, very_high: 12.0 },
    'Gym': { very_low: 2.5, low: 3.5, moderate: 5.5, high: 7.5, very_high: 9.5 },
    'Yoga': { very_low: 1.5, low: 2.0, moderate: 3.0, high: 4.0, very_high: 5.0 },
    'HIIT': { very_low: 4.0, low: 6.0, moderate: 8.0, high: 11.0, very_high: 15.0 },
    'Other': { very_low: 2.0, low: 3.0, moderate: 5.0, high: 7.5, very_high: 10.0 }
  };

  const INTENSITY_LEVELS = [
    { id: 'very_low', label: 'Very Low', description: 'Leisurely pace' },
    { id: 'low', label: 'Low', description: 'Light effort' },
    { id: 'moderate', label: 'Moderate', description: 'Steady pace' },
    { id: 'high', label: 'High', description: 'Heavy breathing' },
    { id: 'very_high', label: 'Vigorous', description: 'Maximum effort' }
  ] as const;

  const COMMON_ACTIVITIES = [
    'Walking', 'Running', 'Cycling', 'Swimming', 'Gym', 'Yoga', 'Pilates', 'HIIT', 
    'Dancing', 'Hiking', 'Tennis', 'Basketball', 'Soccer', 'Badminton', 'Jump Rope', 
    'Rowing', 'Stair Climbing', 'Elliptical', 'Boxing', 'CrossFit'
  ];

  const calculateCalories = (type: string, duration: number, intensity: typeof activityInput.intensity) => {
    const metData = MET_VALUES[type] || MET_VALUES['Other'];
    const met = metData[intensity];
    return Math.round(met * profile.weight * (duration / 60));
  };

  const todayLogs = foodLogs.filter(log => 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  );

  const todayWaterLogs = waterLogs.filter(log => 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  );

  const todayActivityLogs = activityLogs.filter(log => 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  );

  const totalConsumed = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalWater = todayWaterLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalBurned = todayActivityLogs.reduce((sum, log) => sum + log.calories, 0);
  
  const waterGoal = 2500; // 2.5L default goal
  const activityGoal = 500; // 500 kcal default goal
  
  const waterProgress = (totalWater / waterGoal) * 100;
  const activityProgress = (totalBurned / activityGoal) * 100;

  const remaining = Math.max(0, dailyGoal - totalConsumed + totalBurned);
  const progress = (totalConsumed / (dailyGoal + totalBurned)) * 100;

  const chartData = [
    { name: 'Consumed', value: totalConsumed, color: '#5A5A40' },
    { name: 'Remaining', value: remaining, color: '#f5f5f0' },
  ];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = format(date, 'EEE');
    const dayLogs = foodLogs.filter(log => new Date(log.timestamp).toDateString() === date.toDateString());
    const dayActivity = activityLogs.filter(log => new Date(log.timestamp).toDateString() === date.toDateString());
    const consumed = dayLogs.reduce((sum, log) => sum + log.calories, 0);
    const burned = dayActivity.reduce((sum, log) => sum + log.calories, 0);
    return { 
      day: dayName, 
      kcal: consumed,
      net: consumed - burned,
      burned: burned
    };
  });

  const weightChartData = [...weightLogs].reverse().map(log => ({
    date: format(log.timestamp, 'MMM d'),
    weight: log.weight
  }));

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightInput);
    if (!isNaN(weight)) {
      onAddWeightLog(weight);
      setIsLoggingWeight(false);
    }
  };

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(activityInput.duration);
    let finalType = activityInput.type;

    if (activityInput.type === 'Custom' && activityInput.customName) {
      finalType = activityInput.customName;
      onAddCustomActivityType(finalType);
    }

    let calories = parseInt(activityInput.calories);
    if (!activityInput.isManualCalories && !isNaN(duration)) {
      calories = calculateCalories(activityInput.type, duration, activityInput.intensity);
    }

    if (!isNaN(calories)) {
      onAddActivityLog({
        type: finalType,
        calories,
        durationMinutes: duration || undefined
      });
      setIsLoggingActivity(false);
      setActivityInput({ 
        type: 'Walking', 
        calories: '', 
        duration: '', 
        customName: '',
        intensity: 'moderate',
        isManualCalories: true
      });
      setActivitySearch('');
      setShowSuggestions(false);
    }
  };

  const activityTypes = Array.from(
    new Map(
      [...COMMON_ACTIVITIES, ...(profile.customActivityTypes || []), 'Custom']
        .filter(Boolean)
        .map(t => [t.trim().toLowerCase(), t.trim()])
    ).values()
  ).filter(t => t.length > 0);

  const filteredActivities = activityTypes.filter(type => 
    type.toLowerCase().includes(activitySearch.toLowerCase()) && type !== 'Custom'
  );

  return (
    <div className="min-h-screen bg-[#f5f5f0] pb-24">
      {/* Header */}
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm border-b border-[#5A5A40]/5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif italic text-[#5A5A40]">Vitality</h1>
            <p className="text-sm text-[#5A5A40]/60">Welcome back, {profile.gender === 'male' ? 'Sir' : 'Madam'}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
            <UserIcon size={24} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Hydration Section - Moved to Top */}
        <section className="bg-white rounded-[56px] p-12 shadow-2xl border border-[#5A5A40]/5 overflow-hidden relative group">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full -ml-32 -mb-32 blur-2xl pointer-events-none" 
          />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="p-6 bg-[#f5f5f0] rounded-[28px] text-blue-500 shadow-xl border border-blue-50 relative z-10 group-hover:scale-110 transition-transform duration-700">
                  <Droplets size={36} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-400 rounded-[28px] blur-lg -z-10"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#5A5A40] tracking-tighter">Hydration</h2>
                <p className="text-[11px] uppercase tracking-[0.4em] font-black text-blue-600/40 mt-1">Vitality & Focus</p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-3">
                  <span className="text-6xl font-black text-[#5A5A40] tracking-tighter leading-none">{totalWater}</span>
                  <span className="text-sm font-black text-[#5A5A40]/20 uppercase tracking-widest">ml</span>
                </div>
                <div className="text-[11px] font-black text-[#5A5A40]/30 uppercase tracking-[0.4em] mt-3">
                  Daily Goal {waterGoal}ml
                </div>
              </div>
              
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingWater(!isAddingWater)}
                  className={`group relative flex items-center gap-4 px-8 py-5 rounded-[32px] transition-all duration-500 shadow-2xl overflow-hidden ${
                    isAddingWater 
                      ? 'bg-blue-600 text-white ring-8 ring-blue-50' 
                      : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'
                  }`}
                >
                  <span className="font-black text-xs uppercase tracking-[0.2em] relative z-10">
                    {isAddingWater ? 'Close' : 'Add Water'}
                  </span>
                  <Plus 
                    size={24} 
                    className={`transition-transform duration-700 relative z-10 ${isAddingWater ? 'rotate-[225deg]' : ''}`} 
                  />
                  {!isAddingWater && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="relative h-6 bg-[#f5f5f0] rounded-full overflow-hidden mb-4 z-10 border border-[#5A5A40]/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(waterProgress, 100)}%` }}
              className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 transition-all duration-1000 relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
              <motion.div 
                animate={{ x: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 bottom-0 w-20 bg-white/20 blur-sm"
              />
            </motion.div>
          </div>
          <div className="flex justify-between px-2 text-[10px] font-black text-[#5A5A40]/20 uppercase tracking-[0.4em] mb-6">
            <span>0%</span>
            <span className="text-blue-500/60">{Math.round(waterProgress)}% Complete</span>
            <span>100%</span>
          </div>

          <AnimatePresence>
            {isAddingWater && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 pt-4"
              >
                {[100, 250, 500, 750].map((amount, idx) => (
                  <motion.button 
                    key={amount}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      onAddWaterLog(amount);
                      setIsAddingWater(false);
                    }}
                    className="group/btn relative p-6 rounded-[32px] bg-white border border-blue-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200/50 text-[#5A5A40] transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-50/0 group-hover/btn:bg-blue-50/50 transition-colors" />
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 group-hover/btn:scale-110 group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-all duration-300 relative z-10">
                      <Plus size={18} />
                    </div>
                    <span className="text-sm font-black tracking-tight relative z-10">{amount}ml</span>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Energy Dashboard - Merged and Redesigned */}
        <section className="bg-gradient-to-br from-[#4A4A35] via-[#5A5A40] to-[#6B6B50] rounded-[48px] p-6 lg:p-12 shadow-2xl text-white relative overflow-hidden group min-h-[450px] lg:h-[600px] flex items-center justify-center">
          {/* Sophisticated Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-400/20 rounded-full blur-[120px] pointer-events-none" 
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 w-full max-w-5xl">
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-48 h-48 lg:w-80 lg:h-80 group/chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius="75%"
                      outerRadius="95%"
                      paddingAngle={8}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#fff' : 'rgba(255,255,255,0.08)'} 
                          className="transition-all duration-700"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl lg:text-7xl font-black tracking-tighter"
                  >
                    {totalConsumed}
                  </motion.span>
                  <span className="text-[9px] lg:text-[12px] font-black uppercase tracking-[0.4em] text-white/40 mt-1 lg:mt-2">Kcal Eaten</span>
                </div>
                {/* Decorative Ring */}
                <div className="absolute inset-0 border-[3px] border-white/5 rounded-full scale-110 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-6 lg:space-y-12 w-full max-w-md">
              <div className="grid grid-cols-2 gap-4 lg:gap-8 justify-items-center">
                <div className="w-[125px] h-[160px] lg:w-full lg:h-[180px] flex flex-col p-5 lg:p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm shadow-inner group/card hover:bg-white/10 transition-all duration-500">
                  <div className="flex items-center gap-2 text-orange-300">
                    <Flame size={16} className="group-hover/card:scale-110 transition-transform" />
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black">Kcal Left</span>
                  </div>
                  <div className="mt-6 lg:mt-8 text-3xl lg:text-5xl font-black tracking-tight">{remaining}</div>
                  <div className="mt-auto min-h-[24px]" />
                </div>
                <div className="w-[125px] h-[160px] lg:w-full lg:h-[180px] flex flex-col p-5 lg:p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm shadow-inner group/card hover:bg-white/10 transition-all duration-500">
                  <div className="flex items-center gap-2 text-blue-300">
                    <Target size={16} className="group-hover/card:scale-110 transition-transform" />
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black">Target</span>
                  </div>
                  <div className="mt-6 lg:mt-8 space-y-1">
                    <div className="text-3xl lg:text-5xl font-black tracking-tight">{dailyGoal + totalBurned}</div>
                    <div className="mt-auto min-h-[24px] text-[8px] font-bold text-white/30 uppercase tracking-widest leading-tight">
                      Base {dailyGoal}<br/>
                      <span className="text-orange-300">+{totalBurned} Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 lg:pt-8 border-t border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/10 rounded-[24px] text-white shadow-inner border border-white/5">
                    <Scale size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] font-black text-white/40">Target Weight</div>
                    <div className="text-2xl font-black tracking-tight">
                      {profile.targetWeight} <span className="text-sm font-bold opacity-30">kg</span>
                    </div>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsLoggingWeight(!isLoggingWeight)}
                  className={`p-5 rounded-[24px] transition-all shadow-xl ${
                    isLoggingWeight ? 'bg-white text-[#5A5A40]' : 'bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <Plus size={24} className={`transition-transform duration-500 ${isLoggingWeight ? 'rotate-45' : ''}`} />
                </motion.button>
              </div>

              <AnimatePresence>
                {isLoggingWeight && (
                  <motion.form 
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 20, height: 0 }}
                    onSubmit={handleWeightSubmit}
                    className="bg-white/10 p-6 rounded-[32px] flex items-center gap-4 border border-white/10 shadow-inner overflow-hidden"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-widest font-black text-white/40 mb-2">Current Weight</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-transparent border-none outline-none text-2xl font-black placeholder:text-white/10"
                        placeholder="00.0"
                        value={weightInput}
                        onChange={e => setWeightInput(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit" 
                      className="px-8 py-4 bg-white text-[#5A5A40] rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg"
                    >
                      Save
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Daily Activity Section */}
        <section className="bg-white rounded-[56px] p-12 shadow-2xl border border-[#5A5A40]/5 relative overflow-hidden group">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/5 rounded-full -ml-32 -mb-32 blur-2xl pointer-events-none" 
          />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="p-6 bg-[#f5f5f0] rounded-[28px] text-orange-600 shadow-xl border border-orange-50 relative z-10 group-hover:scale-110 transition-transform duration-700">
                  <Activity size={36} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-orange-400 rounded-[28px] blur-lg -z-10"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#5A5A40] tracking-tighter">Daily Activity</h2>
                <p className="text-[11px] uppercase tracking-[0.4em] font-black text-orange-600/40 mt-1">Movement & Energy</p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-3">
                  <span className="text-6xl font-black text-[#5A5A40] tracking-tighter leading-none">{totalBurned}</span>
                  <span className="text-sm font-black text-[#5A5A40]/20 uppercase tracking-widest">/ {activityGoal} kcal</span>
                </div>
                <div className="text-[11px] font-black text-[#5A5A40]/30 uppercase tracking-[0.4em] mt-3">Active Burn</div>
              </div>
              
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoggingActivity(!isLoggingActivity)}
                  className={`group relative flex items-center gap-4 px-8 py-5 rounded-[32px] transition-all duration-500 shadow-2xl overflow-hidden ${
                    isLoggingActivity 
                      ? 'bg-orange-600 text-white ring-8 ring-orange-50' 
                      : 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-100'
                  }`}
                >
                  <span className="font-black text-xs uppercase tracking-[0.2em] relative z-10">
                    {isLoggingActivity ? 'Close' : 'Add Activity'}
                  </span>
                  <Plus 
                    size={24} 
                    className={`transition-transform duration-700 relative z-10 ${isLoggingActivity ? 'rotate-[225deg]' : ''}`} 
                  />
                  {!isLoggingActivity && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="relative h-6 bg-[#f5f5f0] rounded-full overflow-hidden mb-4 z-10 border border-[#5A5A40]/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(activityProgress, 100)}%` }}
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-all duration-1000 relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
              <motion.div 
                animate={{ x: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 bottom-0 w-20 bg-white/20 blur-sm"
              />
            </motion.div>
          </div>
          <div className="flex justify-between px-2 text-[10px] font-black text-[#5A5A40]/20 uppercase tracking-[0.4em] mb-10">
            <span>0%</span>
            <span className="text-orange-500/60">{Math.round(activityProgress)}% Complete</span>
            <span>100%</span>
          </div>

          <AnimatePresence>
            {isLoggingActivity && (
              <motion.form 
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                onSubmit={handleActivitySubmit}
                className="mb-10 p-8 bg-[#f5f5f0] rounded-[40px] space-y-6 overflow-hidden border border-[#5A5A40]/5 shadow-inner"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 relative activity-type-container">
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40">Activity Type</label>
                    <div className="relative">
                      <input 
                        type="text"
                        className="w-full bg-white p-4 rounded-[20px] outline-none font-black text-sm shadow-sm border border-[#5A5A40]/5 focus:border-[#5A5A40]/20 transition-all"
                        placeholder="Search activity..."
                        value={activityInput.type === 'Custom' ? activityInput.customName : (activitySearch || activityInput.type)}
                        onChange={e => {
                          const val = e.target.value;
                          setActivitySearch(val);
                          setShowSuggestions(true);
                          if (activityInput.type === 'Custom') {
                            setActivityInput({ ...activityInput, customName: val });
                          }
                        }}
                        onFocus={() => setShowSuggestions(true)}
                      />
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-[32px] shadow-2xl border border-[#5A5A40]/5 max-h-72 overflow-y-auto p-3 backdrop-blur-xl bg-white/95"
                          >
                            <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[#5A5A40]/30 border-b border-[#5A5A40]/5 mb-2">Suggestions</div>
                            {filteredActivities.length > 0 ? (
                              filteredActivities.map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setActivityInput({ ...activityInput, type, customName: '' });
                                    setActivitySearch(type);
                                    setShowSuggestions(false);
                                  }}
                                  className="w-full text-left px-5 py-4 hover:bg-[#f5f5f0] rounded-[20px] text-sm font-black text-[#5A5A40] transition-all flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]/20 group-hover:bg-[#5A5A40] transition-colors" />
                                    {type}
                                  </div>
                                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActivityInput({ ...activityInput, type: 'Custom', customName: activitySearch });
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-5 py-4 hover:bg-orange-50 rounded-[20px] text-sm font-black text-orange-600 transition-all flex items-center gap-3"
                              >
                                <Plus size={16} />
                                Use custom: "{activitySearch}"
                              </button>
                            )}
                            <div className="h-px bg-[#5A5A40]/5 my-2" />
                            <button
                              type="button"
                              onClick={() => {
                                setActivityInput({ ...activityInput, type: 'Custom', customName: '' });
                                setActivitySearch('');
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-5 py-4 hover:bg-[#f5f5f0] rounded-[20px] text-sm font-black text-[#5A5A40]/40 transition-all flex items-center gap-3"
                            >
                              <Plus size={16} />
                              Add Custom Activity
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {activityInput.type === 'Custom' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40">Custom Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-white p-4 rounded-[20px] outline-none font-black text-sm shadow-sm border border-[#5A5A40]/5"
                        placeholder="e.g. Yoga"
                        value={activityInput.customName}
                        onChange={e => setActivityInput({ ...activityInput, customName: e.target.value })}
                        required
                      />
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40">Duration (min)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white p-4 rounded-[20px] outline-none font-black text-sm shadow-sm border border-[#5A5A40]/5"
                      placeholder="e.g. 30"
                      value={activityInput.duration}
                      onChange={e => setActivityInput({ ...activityInput, duration: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-[20px] shadow-sm border border-[#5A5A40]/5">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 ml-3">Calculation Mode</span>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setActivityInput({ ...activityInput, isManualCalories: true })}
                      className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${activityInput.isManualCalories ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' : 'text-[#5A5A40]/40 hover:bg-[#5A5A40]/5'}`}
                    >
                      Manual
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setActivityInput({ ...activityInput, isManualCalories: false })}
                      className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${!activityInput.isManualCalories ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' : 'text-[#5A5A40]/40 hover:bg-[#5A5A40]/5'}`}
                    >
                      Calculate
                    </motion.button>
                  </div>
                </div>

                {!activityInput.isManualCalories ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40">Intensity Level</label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {INTENSITY_LEVELS.map((level) => (
                          <motion.button
                            key={level.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setActivityInput({ ...activityInput, intensity: level.id as any })}
                            className={`p-4 rounded-[24px] transition-all border flex flex-col items-center gap-1 ${
                              activityInput.intensity === level.id 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20' 
                                : 'bg-white text-[#5A5A40] border-[#5A5A40]/5 hover:bg-[#5A5A40]/5'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest">{level.label}</span>
                            <span className={`text-[8px] font-bold opacity-40 uppercase tracking-tighter ${activityInput.intensity === level.id ? 'text-white' : ''}`}>
                              {level.description}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    {activityInput.duration && (
                      <div className="p-6 bg-orange-50 rounded-[32px] text-center border border-orange-100 shadow-inner">
                        <div className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-600/40 mb-2">Estimated Burn</div>
                        <div className="text-3xl font-black text-orange-600 tracking-tighter">
                          {calculateCalories(activityInput.type, parseInt(activityInput.duration), activityInput.intensity)} <span className="text-sm opacity-40">kcal</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40">Calories Burned</label>
                    <input 
                      type="number" 
                      className="w-full bg-white p-4 rounded-[20px] outline-none font-black text-sm shadow-sm border border-[#5A5A40]/5"
                      placeholder="e.g. 250"
                      value={activityInput.calories}
                      onChange={e => setActivityInput({ ...activityInput, calories: e.target.value })}
                      required
                    />
                  </motion.div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full p-6 bg-[#5A5A40] text-white rounded-[28px] shadow-xl shadow-[#5A5A40]/20 font-black text-xs uppercase tracking-[0.3em] mt-4"
                >
                  Log Activity
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4 relative z-10">
            {todayActivityLogs.map(log => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-6 bg-[#f5f5f0]/30 rounded-[32px] border border-[#5A5A40]/5 hover:bg-white hover:shadow-xl transition-all duration-500 group/log"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white rounded-[20px] text-[#5A5A40] shadow-sm group-hover/log:scale-110 transition-transform duration-500">
                    {log.type === 'Walking' && <Footprints size={24} />}
                    {log.type === 'Running' && <Flame size={24} />}
                    {log.type === 'Cycling' && <Bike size={24} />}
                    {log.type === 'Google Fit' && <Activity size={24} />}
                    {!['Walking', 'Running', 'Cycling', 'Google Fit'].includes(log.type) && <Timer size={24} />}
                  </div>
                  <div>
                    <div className="font-black text-[#5A5A40] tracking-tight">{log.type}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 mt-1">
                      {log.durationMinutes ? `${log.durationMinutes} min • ` : ''}{format(log.timestamp, 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="text-right font-black text-orange-600 text-xl tracking-tighter">
                  +{log.calories} <span className="text-[10px] opacity-40">kcal</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Water Intake Tracking - Removed from here as it's moved to top */}

        {/* Weekly Insights */}
        <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Calorie Overview</h2>
              <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Weekly Performance</p>
            </div>
            <div className="text-right p-4 bg-[#f5f5f0] rounded-[24px] border border-[#5A5A40]/5 shadow-inner min-w-[140px]">
              <div className="text-2xl font-black text-[#5A5A40] tracking-tighter">{totalConsumed - totalBurned} <span className="text-[10px] opacity-40 uppercase tracking-widest">kcal</span></div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">Net Today</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
            <div className="p-6 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 group/stat">
              <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm mb-4 mx-auto w-fit group-hover/stat:scale-110 transition-transform duration-500">
                <Utensils size={20} />
              </div>
              <div className="text-2xl font-black text-[#5A5A40] tracking-tighter">{totalConsumed}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">Intake</div>
            </div>
            <div className="p-6 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 group/stat">
              <div className="p-3 bg-white rounded-2xl text-orange-500 shadow-sm mb-4 mx-auto w-fit group-hover/stat:scale-110 transition-transform duration-500">
                <Flame size={20} />
              </div>
              <div className="text-2xl font-black text-orange-600 tracking-tighter">{totalBurned}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">Burned</div>
            </div>
            <div className="p-6 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 group/stat">
              <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm mb-4 mx-auto w-fit group-hover/stat:scale-110 transition-transform duration-500">
                <Activity size={20} />
              </div>
              <div className={`text-2xl font-black tracking-tighter ${totalConsumed - totalBurned > dailyGoal ? 'text-orange-600' : 'text-emerald-600'}`}>
                {totalConsumed - totalBurned}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">Net</div>
            </div>
          </div>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,90,64,0.05)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#5A5A40', opacity: 0.6, fontWeight: 900 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#5A5A40', opacity: 0.4, fontWeight: 900 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(90,90,64,0.03)', radius: 16 }}
                  contentStyle={{ 
                    borderRadius: '32px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '900',
                    padding: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                />
                <Bar dataKey="kcal" fill="#10b981" radius={[8, 8, 0, 0]} name="Intake" barSize={14} />
                <Bar dataKey="burned" fill="#f97316" radius={[8, 8, 0, 0]} name="Burned" barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-10 mt-8 relative z-10">
            <div className="flex items-center gap-3 text-[11px] font-black text-[#5A5A40]/40 uppercase tracking-[0.3em]">
              <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-lg shadow-emerald-200" /> Intake
            </div>
            <div className="flex items-center gap-3 text-[11px] font-black text-[#5A5A40]/40 uppercase tracking-[0.3em]">
              <div className="w-3 h-3 rounded-full bg-[#f97316] shadow-lg shadow-orange-200" /> Burned
            </div>
          </div>
        </section>

        {/* Personalized Workout Suggestions */}
        <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-orange-50 rounded-[24px] text-orange-600 shadow-sm border border-orange-100">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">AI Suggestions</h2>
                <p className="text-[11px] uppercase tracking-[0.3em] font-black text-orange-600/50">Personalized Guidance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefreshSuggestions}
                disabled={isLoadingSuggestions}
                className={`p-4 rounded-[20px] bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#5A5A40]/5 transition-all shadow-md ${isLoadingSuggestions ? 'opacity-50' : ''}`}
                title="Refresh Suggestions"
              >
                <RefreshCw size={24} className={isLoadingSuggestions ? 'animate-spin' : ''} />
              </motion.button>
              {isLoadingSuggestions && <Loader2 className="animate-spin text-orange-600" size={24} />}
            </div>
          </div>

          {workoutSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {workoutSuggestions.map((suggestion, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 bg-[#f5f5f0]/30 rounded-[40px] border border-[#5A5A40]/5 hover:bg-white hover:shadow-2xl transition-all duration-500 group/card flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-white rounded-[20px] text-orange-600 shadow-sm group-hover/card:scale-110 transition-transform duration-500">
                      {suggestion.type.toLowerCase().includes('run') ? <Flame size={24} /> : 
                       suggestion.type.toLowerCase().includes('walk') ? <Footprints size={24} /> :
                       suggestion.type.toLowerCase().includes('cycle') ? <Bike size={24} /> :
                       <Activity size={24} />}
                    </div>
                    <div className="px-4 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100">
                      {suggestion.duration}m
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#5A5A40] mb-4 tracking-tight leading-tight">{suggestion.title}</h3>
                  <p className="text-sm text-[#5A5A40]/60 leading-relaxed mb-8 line-clamp-3 flex-grow">{suggestion.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#5A5A40]/5">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30">Intensity</div>
                      <div className="text-xs font-black text-orange-600 uppercase tracking-widest">{suggestion.intensity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30">Est. Burn</div>
                      <div className="text-xs font-black text-orange-600 uppercase tracking-widest">{suggestion.estimatedBurn} kcal</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#f5f5f0]/50 rounded-[48px] border border-dashed border-[#5A5A40]/10 relative z-10">
              <Sparkles className="mx-auto text-[#5A5A40]/10 mb-6" size={48} />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5A5A40]/30">
                {isLoadingSuggestions ? "Gemini is crafting your workout plan..." : "Log some activities to get personalized suggestions!"}
              </p>
            </div>
          )}
        </section>

        {/* Recent Logs */}
        <section className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm border border-[#5A5A40]/5">
                <History size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Today's Meals</h2>
                <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Nutrition History</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsShowingHistory(true)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors flex items-center gap-2 group/btn"
              >
                View History
                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </motion.button>
              <span className="px-4 py-1.5 bg-[#f5f5f0] rounded-full text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest border border-[#5A5A40]/5">
                {format(new Date(), 'MMMM do')}
              </span>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {todayLogs.length === 0 ? (
              <div className="text-center py-20 bg-[#f5f5f0]/50 rounded-[48px] border border-dashed border-[#5A5A40]/10">
                <Utensils size={64} className="mx-auto mb-6 text-[#5A5A40]/10" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5A5A40]/30">No meals logged yet today.</p>
              </div>
            ) : (
              todayLogs.map(log => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-[#f5f5f0]/30 rounded-[40px] border border-[#5A5A40]/5 hover:bg-white hover:shadow-2xl transition-all duration-500 group/meal"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6 min-w-0">
                      {log.imageUrl ? (
                        <div className="relative">
                          <img 
                            src={log.imageUrl} 
                            alt={log.name} 
                            className="w-20 h-20 rounded-[24px] object-cover border-2 border-white shadow-lg group-hover/meal:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 rounded-[24px] shadow-inner pointer-events-none" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-[#5A5A40]/20 shadow-sm group-hover/meal:scale-110 transition-transform duration-500">
                          <Utensils size={32} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <div className="text-xl font-black text-[#5A5A40] tracking-tight truncate">{log.name}</div>
                          <span className="px-3 py-1 bg-[#5A5A40] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#5A5A40]/20">
                            {log.mealType}
                          </span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30">{format(log.timestamp, 'h:mm a')}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black text-[#5A5A40] tracking-tighter mb-1">{log.calories} <span className="text-[10px] opacity-30 uppercase tracking-widest">kcal</span></div>
                      <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#5A5A40]/40">
                        P: <span className="text-[#5A5A40]">{log.protein}g</span> • 
                        C: <span className="text-[#5A5A40]">{log.carbs}g</span> • 
                        F: <span className="text-[#5A5A40]">{log.fat}g</span>
                      </div>
                    </div>
                  </div>
                  {log.items && log.items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-[#5A5A40]/5">
                      {log.items.map((item, idx) => (
                        <span key={idx} className="text-[10px] font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full text-[#5A5A40]/60 shadow-sm border border-[#5A5A40]/5">
                          {item.name}: <span className="text-[#5A5A40]">{item.weight}g</span>
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isShowingHistory && (
          <MealHistory 
            logs={foodLogs}
            onClose={() => setIsShowingHistory(false)}
            onReLog={(log) => {
              onAddLog({
                ...log,
                id: crypto.randomUUID(),
                timestamp: Date.now()
              });
              setIsShowingHistory(false);
            }}
            onEdit={(log) => setEditingLog(log)}
            onDelete={onDeleteLog}
          />
        )}

        {editingLog && (
          <EditMealModal 
            log={editingLog}
            onClose={() => setEditingLog(null)}
            onSave={(updatedLog) => {
              onUpdateLog(updatedLog);
              setEditingLog(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
