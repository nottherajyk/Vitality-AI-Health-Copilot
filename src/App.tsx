import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ProgressView from './components/ProgressView';
import DietPlanView from './components/DietPlanView';
import SleepTracker from './components/SleepTracker';
import FaceScan from './components/FaceScan';
import FoodScanner from './components/FoodScanner';
import HealthConnect from './components/HealthConnect';
import GroceryList from './components/GroceryList';
import EnergyHistory from './components/EnergyHistory';
import { UserProfile, FoodLog, WeightLog, WaterLog, ActivityLog, SleepLog, FaceScanResult } from './types';
import { calculateBMR, calculateTDEE } from './lib/utils';
import { Home, TrendingUp, User, Utensils, Moon, Camera, ShoppingBag, History, Bell, X, Flame, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'calorie' | 'activity' | 'info';
  timestamp: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'progress' | 'profile' | 'diet' | 'sleep' | 'facescan' | 'groceries' | 'history'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vitality_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(() => {
    const saved = localStorage.getItem('vitality_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem('vitality_weight_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('vitality_water_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('vitality_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
    const saved = localStorage.getItem('vitality_sleep_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [faceScanLogs, setFaceScanLogs] = useState<FaceScanResult[]>(() => {
    const saved = localStorage.getItem('vitality_facescan_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyGoal, setDailyGoal] = useState(2000);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifiedToday, setNotifiedToday] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('vitality_notified_today');
    const today = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed.flags;
    }
    return {};
  });

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('vitality_notified_today', JSON.stringify({ date: today, flags: notifiedToday }));
  }, [notifiedToday]);

  useEffect(() => {
    if (!profile) return;

    const today = new Date().setHours(0, 0, 0, 0);
    const consumed = foodLogs
      .filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today)
      .reduce((sum, log) => sum + log.calories, 0);
    
    const burned = activityLogs
      .filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today)
      .reduce((sum, log) => sum + (log.calories || 0), 0);

    const activityGoal = 500; // Standard goal
    const newNotified = { ...notifiedToday };
    let added = false;

    // Calorie Notifications
    if (consumed >= dailyGoal * 0.9 && consumed < dailyGoal && !notifiedToday.calorie90) {
      addNotification('calorie', 'Daily Goal Near', 'You have reached 90% of your daily calorie limit.');
      newNotified.calorie90 = true;
      added = true;
    } else if (consumed >= dailyGoal && !notifiedToday.calorie100) {
      addNotification('calorie', 'Goal Reached', 'You have reached your daily calorie goal!');
      newNotified.calorie100 = true;
      added = true;
    }

    // Activity Notifications
    if (burned >= activityGoal * 0.9 && burned < activityGoal && !notifiedToday.activity90) {
      addNotification('activity', 'Activity Goal Near', 'Almost there! You are at 90% of your daily activity goal.');
      newNotified.activity90 = true;
      added = true;
    } else if (burned >= activityGoal && !notifiedToday.activity100) {
      addNotification('activity', 'Activity Goal Smashed', 'Great job! You have reached your daily movement goal.');
      newNotified.activity100 = true;
      added = true;
    }

    if (added) {
      setNotifiedToday(newNotified);
    }
  }, [foodLogs, activityLogs, dailyGoal, profile]);

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [{ id, title, message, type, timestamp: Date.now() }, ...prev]);
    // Auto-remove after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (profile) {
      localStorage.setItem('vitality_profile', JSON.stringify(profile));
      
      // Calculate daily goal based on profile
      const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
      const tdee = calculateTDEE(bmr, profile.activityLevel);
      
      let goalAdjustment = 0;
      if (profile.goal === 'lose') {
        // 500 kcal deficit for ~0.5kg loss per week
        goalAdjustment = -500;
      } else if (profile.goal === 'gain') {
        goalAdjustment = 500;
      }
      
      setDailyGoal(Math.round(tdee + goalAdjustment));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('vitality_logs', JSON.stringify(foodLogs));
  }, [foodLogs]);

  useEffect(() => {
    localStorage.setItem('vitality_weight_logs', JSON.stringify(weightLogs));
  }, [weightLogs]);

  useEffect(() => {
    localStorage.setItem('vitality_water_logs', JSON.stringify(waterLogs));
  }, [waterLogs]);

  useEffect(() => {
    localStorage.setItem('vitality_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('vitality_sleep_logs', JSON.stringify(sleepLogs));
  }, [sleepLogs]);

  useEffect(() => {
    localStorage.setItem('vitality_facescan_logs', JSON.stringify(faceScanLogs));
  }, [faceScanLogs]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    // Add initial weight log
    setWeightLogs([{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      weight: newProfile.weight
    }]);
  };

  const handleAddLog = (log: FoodLog) => {
    setFoodLogs(prev => [log, ...prev]);
  };

  const handleUpdateLog = (updatedLog: FoodLog) => {
    setFoodLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };

  const handleDeleteLog = (id: string) => {
    setFoodLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleAddWeightLog = (weight: number) => {
    setWeightLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      weight
    }, ...prev]);
    if (profile) {
      setProfile({ ...profile, weight });
    }
  };

  const handleAddWaterLog = (amount: number) => {
    setWaterLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      amount
    }, ...prev]);
  };

  const handleAddActivityLog = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    setActivityLogs(prev => [{
      ...activity,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }, ...prev]);
  };

  const handleAddCustomActivityType = (type: string) => {
    if (profile) {
      const currentTypes = profile.customActivityTypes || [];
      const normalizedType = type.trim();
      if (!currentTypes.some(t => t.toLowerCase() === normalizedType.toLowerCase())) {
        setProfile({
          ...profile,
          customActivityTypes: [...currentTypes, normalizedType]
        });
      }
    }
  };

  const handleSyncActivity = (calories: number) => {
    // For sync, we'll replace today's "Google Fit" log if it exists, or add a new one
    const today = new Date().setHours(0, 0, 0, 0);
    setActivityLogs(prev => {
      const filtered = prev.filter(log => !(log.type === 'Google Fit' && new Date(log.timestamp).setHours(0, 0, 0, 0) === today));
      return [{
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'Google Fit',
        calories
      }, ...filtered];
    });
  };

  const handleAddSleepLog = (duration: number, quality: SleepLog['quality'], notes?: string) => {
    setSleepLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      durationHours: duration,
      quality,
      notes
    }, ...prev]);
  };

  const handleDeleteSleepLog = (id: string) => {
    setSleepLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleAddFaceScan = (log: FaceScanResult) => {
    setFaceScanLogs(prev => [log, ...prev]);
  };

  const handleDeleteFaceScan = (id: string) => {
    setFaceScanLogs(prev => prev.filter(log => log.id !== id));
  };

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Notifications Overlay */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6 space-y-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-[#5A5A40]/5 flex items-center gap-5 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#5A5A40]/10" />
              <div className={`p-4 rounded-2xl ${
                notification.type === 'calorie' ? 'bg-orange-50 text-orange-600' : 
                notification.type === 'activity' ? 'bg-blue-50 text-blue-600' : 
                'bg-[#f5f5f0] text-[#5A5A40]'
              }`}>
                {notification.type === 'calorie' ? <Flame size={24} /> : 
                 notification.type === 'activity' ? <ActivityIcon size={24} /> : 
                 <Bell size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-[#5A5A40] tracking-tight">{notification.title}</h4>
                <p className="text-[11px] font-bold text-[#5A5A40]/50 leading-relaxed mt-1">{notification.message}</p>
              </div>
              <button 
                onClick={() => removeNotification(notification.id)}
                className="p-2 hover:bg-[#5A5A40]/5 rounded-xl transition-colors text-[#5A5A40]/20 hover:text-[#5A5A40]"
              >
                <X size={18} />
              </button>
              
              {/* Progress Bar for auto-dismiss */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-[#5A5A40]/10"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Dashboard 
              profile={profile} 
              foodLogs={foodLogs} 
              weightLogs={weightLogs}
              waterLogs={waterLogs}
              activityLogs={activityLogs}
              onAddLog={handleAddLog}
              onUpdateLog={handleUpdateLog}
              onDeleteLog={handleDeleteLog}
              onAddWeightLog={handleAddWeightLog}
              onAddWaterLog={handleAddWaterLog}
              onAddActivityLog={handleAddActivityLog}
              onAddCustomActivityType={handleAddCustomActivityType}
              onSyncActivity={handleSyncActivity}
              dailyGoal={dailyGoal}
            />
          </motion.div>
        )}

        {currentView === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ProgressView 
              profile={profile}
              foodLogs={foodLogs}
              weightLogs={weightLogs}
              activityLogs={activityLogs}
            />
          </motion.div>
        )}

        {currentView === 'diet' && (
          <motion.div
            key="diet"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <DietPlanView profile={profile} />
          </motion.div>
        )}

        {currentView === 'sleep' && (
          <motion.div
            key="sleep"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <SleepTracker 
              logs={sleepLogs} 
              onAddLog={handleAddSleepLog} 
              onDeleteLog={handleDeleteSleepLog} 
            />
          </motion.div>
        )}

        {currentView === 'facescan' && (
          <motion.div
            key="facescan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-6 space-y-8 max-w-4xl mx-auto pb-32"
          >
            <HealthConnect 
              onConnect={() => {}} 
              onSyncWeight={handleAddWeightLog}
              onSyncActivity={handleSyncActivity}
            />
            
            <FoodScanner 
              dailyGoal={dailyGoal} 
              onScan={(analysis, mealType, customImage) => {
                handleAddLog({
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  name: analysis.foodName,
                  calories: analysis.calories,
                  protein: analysis.protein,
                  carbs: analysis.carbs,
                  fat: analysis.fat,
                  imageUrl: customImage,
                  mealType: mealType,
                  items: analysis.items,
                });
              }} 
            />

            <FaceScan 
              logs={faceScanLogs} 
              onAddLog={handleAddFaceScan} 
              onDeleteLog={handleDeleteFaceScan} 
            />
          </motion.div>
        )}

        {currentView === 'groceries' && (
          <motion.div
            key="groceries"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-8 max-w-4xl mx-auto"
          >
            <GroceryList profile={profile} />
          </motion.div>
        )}

        {currentView === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-8 max-w-4xl mx-auto"
          >
            <EnergyHistory 
              profile={profile}
              foodLogs={foodLogs}
              activityLogs={activityLogs}
              dailyGoal={dailyGoal}
            />
          </motion.div>
        )}

        {currentView === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="p-8 max-w-4xl mx-auto pb-32 font-sans"
          >
            <h1 className="text-4xl font-black text-[#5A5A40] mb-10 tracking-tighter">Profile Settings</h1>
            <div className="bg-white rounded-[56px] p-12 shadow-2xl border border-[#5A5A40]/5 space-y-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#5A5A40]/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-8 p-10 bg-[#f5f5f0]/50 rounded-[40px] relative z-10 border border-[#5A5A40]/5 group">
                <div className="w-24 h-24 rounded-[28px] bg-[#5A5A40] flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform duration-700">
                  <User size={48} />
                </div>
                <div>
                  <div className="text-3xl font-black text-[#5A5A40] tracking-tighter leading-tight">{profile.gender === 'male' ? 'Sir' : 'Madam'}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30 mt-2">
                    Age {profile.age} • {profile.height}cm • {profile.dietPreference}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="p-8 bg-white border border-[#5A5A40]/5 rounded-[40px] shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="text-[10px] uppercase tracking-[0.4em] font-black text-[#5A5A40]/30 mb-3">Current Weight</div>
                  <div className="text-4xl font-black text-[#5A5A40] tracking-tighter">{profile.weight} <span className="text-xs opacity-20 uppercase tracking-widest">kg</span></div>
                </div>
                <div className="p-8 bg-white border border-[#5A5A40]/5 rounded-[40px] shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="text-[10px] uppercase tracking-[0.4em] font-black text-[#5A5A40]/30 mb-3">Target Weight</div>
                  <div className="text-4xl font-black text-[#5A5A40] tracking-tighter">{profile.targetWeight} <span className="text-xs opacity-20 uppercase tracking-widest">kg</span></div>
                </div>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="space-y-6">
                  <label className="block text-[11px] font-black uppercase tracking-[0.4em] text-[#5A5A40]/30 ml-4">Health Conditions</label>
                  <div className="flex flex-wrap gap-4">
                    {profile.healthConditions?.length ? profile.healthConditions.map(c => (
                      <motion.span 
                        key={c} 
                        whileHover={{ scale: 1.05 }}
                        className="px-6 py-2.5 bg-[#5A5A40] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl shadow-[#5A5A40]/20"
                      >
                        {c}
                      </motion.span>
                    )) : <span className="text-xs font-black text-[#5A5A40]/20 uppercase tracking-widest ml-4">No conditions listed</span>}
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="block text-[11px] font-black uppercase tracking-[0.4em] text-[#5A5A40]/30 ml-4">Nutrient Deficiencies</label>
                  <div className="flex flex-wrap gap-4">
                    {profile.deficiencies?.length ? profile.deficiencies.map(d => (
                      <motion.span 
                        key={d} 
                        whileHover={{ scale: 1.05 }}
                        className="px-6 py-2.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl shadow-orange-500/20"
                      >
                        {d}
                      </motion.span>
                    )) : <span className="text-xs font-black text-[#5A5A40]/20 uppercase tracking-widest ml-4">No deficiencies listed</span>}
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.removeItem('vitality_profile');
                  window.location.reload();
                }}
                className="w-full p-8 bg-red-50 text-red-600 rounded-[40px] font-black text-xs uppercase tracking-[0.4em] hover:bg-red-100 transition-all border border-red-100 relative z-10 shadow-sm"
              >
                Reset Profile
              </motion.button>
            </div>
          </motion.div>
 )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-[#5A5A40]/5 px-8 py-6 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'diet', icon: Utensils, label: 'Diet' },
            { id: 'groceries', icon: ShoppingBag, label: 'Buy' },
            { id: 'sleep', icon: Moon, label: 'Sleep' },
            { id: 'facescan', icon: Camera, label: 'Scan' },
            { id: 'history', icon: History, label: 'Log' },
            { id: 'progress', icon: TrendingUp, label: 'Stats' },
            { id: 'profile', icon: User, label: 'Me' },
          ].map((item) => (
            <motion.button 
              key={item.id}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center gap-2 transition-all relative group ${
                currentView === item.id ? 'text-[#5A5A40]' : 'text-[#5A5A40]/30'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-500 ${
                currentView === item.id ? 'bg-[#5A5A40]/5 shadow-inner' : 'group-hover:bg-[#5A5A40]/5'
              }`}>
                <item.icon size={22} className={currentView === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                currentView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
              }`}>
                {item.label}
              </span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="nav-pill"
                  className="absolute -bottom-3 w-1.5 h-1.5 bg-[#5A5A40] rounded-full shadow-lg shadow-[#5A5A40]/40"
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}
