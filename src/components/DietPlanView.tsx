import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, DietPlan, Recipe } from '../types';
import { generateDietPlan, generateRecipes } from '../services/geminiService';
import { Loader2, Utensils, Flame, Info, ChevronRight, Clock, BookOpen, Plus } from 'lucide-react';

interface DietPlanViewProps {
  profile: UserProfile;
}

export default function DietPlanView({ profile }: DietPlanViewProps) {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchData = async (force = false) => {
      const cachedPlan = localStorage.getItem('diet_plan');
      const cachedRecipes = localStorage.getItem('recipes');
      const cachedDate = localStorage.getItem('diet_data_date');
      const today = new Date().toDateString();

      if (!force && cachedPlan && cachedRecipes && cachedDate === today) {
        setDietPlan(JSON.parse(cachedPlan));
        setRecipes(JSON.parse(cachedRecipes));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [plan, recs] = await Promise.all([
          generateDietPlan(profile),
          generateRecipes(profile)
        ]);
        setDietPlan(plan);
        setRecipes(recs);
        localStorage.setItem('diet_plan', JSON.stringify(plan));
        localStorage.setItem('recipes', JSON.stringify(recs));
        localStorage.setItem('diet_data_date', today);
      } catch (error) {
        console.error("Error fetching diet data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [plan, recs] = await Promise.all([
        generateDietPlan(profile),
        generateRecipes(profile)
      ]);
      setDietPlan(plan);
      setRecipes(recs);
      localStorage.setItem('diet_plan', JSON.stringify(plan));
      localStorage.setItem('recipes', JSON.stringify(recs));
      localStorage.setItem('diet_data_date', new Date().toDateString());
    } catch (error) {
      console.error("Error refreshing diet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#5A5A40]" size={40} />
        <p className="text-[#5A5A40]/60 italic">Gemini is crafting your tailored diet plan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-32 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Diet & Nutrition</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">Tailored for your {profile.goal} goal.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-4 rounded-[24px] bg-white border border-[#5A5A40]/5 text-[#5A5A40] shadow-xl hover:shadow-2xl transition-all ${isLoading ? 'opacity-50' : ''}`}
          title="Refresh Plan"
        >
          <motion.div animate={isLoading ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Plus size={24} className="rotate-45" />
          </motion.div>
        </motion.button>
      </header>

      {dietPlan && (
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] p-10 shadow-xl border border-[#5A5A40]/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm border border-[#5A5A40]/5">
                <Utensils size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Dietary Summary</h2>
                <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Nutritional Architecture</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-[#5A5A40] rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-[#5A5A40]/20">
              Personalized Plan
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
            <div className="p-8 bg-[#5A5A40] rounded-[32px] text-center text-white shadow-2xl relative overflow-hidden group/card">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover/card:scale-150 transition-transform duration-700" />
              <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mb-2">Daily Target</div>
              <div className="text-4xl font-black tracking-tighter">{dietPlan.dailyCalorieTarget}</div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">kcal / day</div>
            </div>
            <div className="p-8 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mb-2">Protein</div>
              <div className="text-3xl font-black text-[#5A5A40] tracking-tighter">{dietPlan.macros.protein}g</div>
              <div className="text-[10px] font-black text-[#5A5A40]/20 uppercase tracking-widest mt-2">
                {Math.round((dietPlan.macros.protein * 4 / dietPlan.dailyCalorieTarget) * 100)}% energy
              </div>
            </div>
            <div className="p-8 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mb-2">Carbs</div>
              <div className="text-3xl font-black text-[#5A5A40] tracking-tighter">{dietPlan.macros.carbs}g</div>
              <div className="text-[10px] font-black text-[#5A5A40]/20 uppercase tracking-widest mt-2">
                {Math.round((dietPlan.macros.carbs * 4 / dietPlan.dailyCalorieTarget) * 100)}% energy
              </div>
            </div>
            <div className="p-8 bg-[#f5f5f0]/50 rounded-[32px] text-center border border-[#5A5A40]/5 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mb-2">Fats</div>
              <div className="text-3xl font-black text-[#5A5A40] tracking-tighter">{dietPlan.macros.fat}g</div>
              <div className="text-[10px] font-black text-[#5A5A40]/20 uppercase tracking-widest mt-2">
                {Math.round((dietPlan.macros.fat * 9 / dietPlan.dailyCalorieTarget) * 100)}% energy
              </div>
            </div>
          </div>

          <div className="bg-[#f5f5f0]/50 rounded-[40px] p-10 mb-10 border border-[#5A5A40]/5 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-[#5A5A40]/30 uppercase tracking-[0.3em]">Macro Strategy</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2.5 text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5A5A40] shadow-sm" /> Protein
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B8B6B] shadow-sm" /> Carbs
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C2C2A3] shadow-sm" /> Fat
                </div>
              </div>
            </div>
            
            <div className="h-5 w-full bg-white rounded-full overflow-hidden flex mb-10 shadow-inner border border-[#5A5A40]/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(dietPlan.macros.protein * 4 / dietPlan.dailyCalorieTarget) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-[#5A5A40]" 
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(dietPlan.macros.carbs * 4 / dietPlan.dailyCalorieTarget) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-[#8B8B6B]" 
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(dietPlan.macros.fat * 9 / dietPlan.dailyCalorieTarget) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-[#C2C2A3]" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <div className="text-[10px] font-black text-[#5A5A40]/30 uppercase tracking-[0.2em]">Protein Goal</div>
                <p className="text-xs text-[#5A5A40]/60 leading-relaxed font-medium">
                  Essential for muscle {profile.goal === 'gain' ? 'growth' : 'maintenance'} and metabolic health.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-[10px] font-black text-[#5A5A40]/30 uppercase tracking-[0.2em]">Carb Strategy</div>
                <p className="text-xs text-[#5A5A40]/60 leading-relaxed font-medium">
                  Primary energy source for your {profile.activityLevel > 1.5 ? 'active' : 'daily'} lifestyle.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-[10px] font-black text-[#5A5A40]/30 uppercase tracking-[0.2em]">Healthy Fats</div>
                <p className="text-xs text-[#5A5A40]/60 leading-relaxed font-medium">
                  Crucial for hormone production and nutrient absorption.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <h3 className="text-lg font-black text-[#5A5A40] flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-[#f5f5f0] rounded-xl text-[#5A5A40]">
                <BookOpen size={20} />
              </div>
              Meal Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(dietPlan.suggestedMeals).map(([meal, suggestions]) => (
                <div key={meal} className="p-8 bg-[#f5f5f0]/30 border border-[#5A5A40]/5 rounded-[32px] hover:bg-white hover:shadow-xl transition-all duration-500">
                  <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mb-4 capitalize">{meal}</div>
                  <ul className="space-y-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-[#5A5A40]/70 flex items-start gap-3 font-medium">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-[#5A5A40] rounded-full shrink-0 shadow-sm" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-[#5A5A40]/5 relative z-10">
            <h3 className="text-lg font-black text-[#5A5A40] mb-6 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-[#f5f5f0] rounded-xl text-[#5A5A40]">
                <Info size={20} />
              </div>
              Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dietPlan.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-[#f5f5f0]/50 rounded-[24px] text-xs text-[#5A5A40]/60 font-medium border border-[#5A5A40]/5">
                  <ChevronRight size={16} className="shrink-0 mt-0.5 text-[#5A5A40]/30" />
                  {r}
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      <section className="space-y-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-orange-50 rounded-[24px] text-orange-500 border border-orange-100 shadow-sm">
            <Flame size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Tasty Recipes</h2>
            <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30">Culinary Inspiration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recipes.map((recipe, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-[48px] overflow-hidden shadow-xl border border-[#5A5A40]/5 cursor-pointer group relative"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-[#5A5A40] tracking-tight group-hover:text-orange-500 transition-colors leading-tight">{recipe.title}</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#f5f5f0] rounded-full text-[10px] font-black text-[#5A5A40]/40 uppercase tracking-widest">
                    <Clock size={14} />
                    {recipe.prepTime}m
                  </div>
                </div>
                <p className="text-sm text-[#5A5A40]/50 mb-8 line-clamp-2 font-medium leading-relaxed">{recipe.description}</p>
                <div className="flex items-center justify-between pt-8 border-t border-[#5A5A40]/5">
                  <div className="text-xl font-black text-[#5A5A40] tracking-tighter">{recipe.calories} <span className="text-[10px] opacity-30 uppercase tracking-widest">kcal</span></div>
                  <div className="flex gap-2">
                    {recipe.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-[#f5f5f0] rounded-full text-[9px] font-black uppercase tracking-widest text-[#5A5A40]/40 border border-[#5A5A40]/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recipe Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#5A5A40]/40 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-[56px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              
              <div className="p-12 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div>
                    <h2 className="text-4xl font-black text-[#5A5A40] tracking-tighter leading-tight mb-4">{selectedRecipe.title}</h2>
                    <div className="flex items-center gap-8">
                      <div className="text-2xl font-black text-orange-500 tracking-tighter">{selectedRecipe.calories} <span className="text-[10px] opacity-40 uppercase tracking-widest">kcal</span></div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/30">
                        P: <span className="text-[#5A5A40]">{selectedRecipe.protein}g</span> • 
                        C: <span className="text-[#5A5A40]">{selectedRecipe.carbs}g</span> • 
                        F: <span className="text-[#5A5A40]">{selectedRecipe.fat}g</span>
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedRecipe(null)}
                    className="p-4 bg-[#f5f5f0] text-[#5A5A40] rounded-full shadow-sm hover:bg-white hover:shadow-xl transition-all"
                  >
                    <Plus size={24} className="rotate-45" />
                  </motion.button>
                </div>

                <div className="space-y-12 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#5A5A40]/30 mb-6">Ingredients</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-[#f5f5f0]/50 rounded-[20px] text-sm text-[#5A5A40]/70 font-medium border border-[#5A5A40]/5">
                          <div className="w-2 h-2 bg-orange-400 rounded-full shadow-sm" />
                          {ing}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#5A5A40]/30 mb-6">Instructions</h3>
                    <div className="space-y-6">
                      {selectedRecipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-6 group/step">
                          <div className="w-10 h-10 rounded-[14px] bg-[#5A5A40] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg shadow-[#5A5A40]/20 group-hover/step:scale-110 transition-transform">
                            {i + 1}
                          </div>
                          <div className="pt-2">
                            <p className="text-sm text-[#5A5A40]/70 leading-relaxed font-medium">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
