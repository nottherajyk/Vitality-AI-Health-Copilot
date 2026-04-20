import React, { useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, User, Ruler, Weight, Target, Calendar, Activity } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const HEALTH_PROFILE_STEP = 5;
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    goal: 'lose',
    dietPreference: 'veg',
    targetWeight: 65,
    timeframeWeeks: 12,
    activityLevel: 1.2,
  });
  const [healthConditionsInput, setHealthConditionsInput] = useState('');
  const [deficienciesInput, setDeficienciesInput] = useState('');

  const parseCommaSeparatedList = (value: string) =>
    value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const withParsedHealthProfile = (baseProfile: UserProfile): UserProfile => ({
    ...baseProfile,
    healthConditions: parseCommaSeparatedList(healthConditionsInput),
    deficiencies: parseCommaSeparatedList(deficienciesInput),
  });

  const nextStep = () => {
    if (step === HEALTH_PROFILE_STEP) {
      setProfile(prev => withParsedHealthProfile(prev));
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
    onComplete(withParsedHealthProfile(profile));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[48px] shadow-2xl p-12 max-w-lg w-full border border-[#5A5A40]/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center mb-12 relative z-10">
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Vitality</h1>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30">Step {step} of 6</span>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Tell us about yourself</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Gender</label>
                  <select 
                    className="w-full bg-transparent outline-none font-black text-sm appearance-none"
                    value={profile.gender}
                    onChange={e => setProfile({...profile, gender: e.target.value as any})}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Calendar size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Age</label>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-black text-sm"
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Body Metrics</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Weight size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-black text-sm"
                    value={profile.weight}
                    onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Ruler size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Height (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-black text-sm"
                    value={profile.height}
                    onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Your Goal</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Target size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">I want to</label>
                  <select 
                    className="w-full bg-transparent outline-none font-black text-sm appearance-none"
                    value={profile.goal}
                    onChange={e => setProfile({...profile, goal: e.target.value as any})}
                  >
                    <option value="lose">Lose Weight</option>
                    <option value="gain">Gain Weight</option>
                    <option value="maintain">Maintain Weight</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Weight size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Target Weight (kg)</label>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-black text-sm"
                    value={profile.targetWeight}
                    onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Diet Preference</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Activity size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Dietary Choice</label>
                  <select 
                    className="w-full bg-transparent outline-none font-black text-sm appearance-none"
                    value={profile.dietPreference}
                    onChange={e => setProfile({...profile, dietPreference: e.target.value as any})}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Health Profile</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 ml-4">Health Conditions</label>
                <input 
                  type="text" 
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full p-6 bg-[#f5f5f0] rounded-[28px] outline-none font-black text-sm border border-[#5A5A40]/5 shadow-inner"
                  value={healthConditionsInput}
                  onChange={e => setHealthConditionsInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 ml-4">Nutrient Deficiencies</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vitamin D, Iron"
                  className="w-full p-6 bg-[#f5f5f0] rounded-[28px] outline-none font-black text-sm border border-[#5A5A40]/5 shadow-inner"
                  value={deficienciesInput}
                  onChange={e => setDeficienciesInput(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <h2 className="text-2xl font-black text-[#5A5A40] mb-8 tracking-tight">Lifestyle</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Activity size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Activity Level</label>
                  <select 
                    className="w-full bg-transparent outline-none font-black text-sm appearance-none"
                    value={profile.activityLevel}
                    onChange={e => setProfile({...profile, activityLevel: Number(e.target.value)})}
                  >
                    <option value={1.2}>Sedentary (Little to no exercise)</option>
                    <option value={1.375}>Lightly Active (1-3 days/week)</option>
                    <option value={1.55}>Moderately Active (3-5 days/week)</option>
                    <option value={1.725}>Very Active (6-7 days/week)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6 bg-[#f5f5f0] rounded-[28px] border border-[#5A5A40]/5 shadow-inner">
                <div className="p-3 bg-white rounded-2xl text-[#5A5A40] shadow-sm">
                  <Calendar size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/40 mb-1">Timeframe (Weeks)</label>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-black text-sm"
                    value={profile.timeframeWeeks}
                    onChange={e => setProfile({...profile, timeframeWeeks: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-12 flex gap-4 relative z-10">
          {step > 1 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              className="flex-1 p-5 rounded-[24px] border border-[#5A5A40]/10 text-[#5A5A40] bg-[#f5f5f0] font-black text-xs uppercase tracking-[0.2em] shadow-sm"
            >
              Back
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={step === 6 ? handleComplete : nextStep}
            className="flex-[2] p-5 rounded-[24px] bg-[#5A5A40] text-white flex items-center justify-center gap-3 shadow-xl shadow-[#5A5A40]/20 font-black text-xs uppercase tracking-[0.2em]"
          >
            {step === 6 ? 'Get Started' : 'Continue'}
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
