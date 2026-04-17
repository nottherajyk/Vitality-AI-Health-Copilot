import React, { useState, useEffect } from 'react';
import { UserProfile, GroceryItem } from '../types';
import { motion } from 'motion/react';
import { ShoppingCart, CheckCircle2, Loader2, Info, Sparkles, ChevronRight } from 'lucide-react';
import { generateGroceryList } from '../services/geminiService';

interface GroceryListProps {
  profile: UserProfile;
}

export default function GroceryList({ profile }: GroceryListProps) {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchGroceries = async () => {
      setIsLoading(true);
      try {
        const list = await generateGroceryList(profile);
        setGroceries(list);
      } catch (error) {
        console.error("Error fetching groceries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroceries();
  }, [profile]);

  const toggleItem = (name: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(name)) {
      newChecked.delete(name);
    } else {
      newChecked.add(name);
    }
    setCheckedItems(newChecked);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5A5A40]">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="italic font-serif">Gemini is curating your healthy grocery list...</p>
      </div>
    );
  }

  const categories = [...new Set(groceries.map(item => item.category))];

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-32 font-sans">
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-[#f5f5f0] rounded-[24px] text-[#5A5A40] shadow-sm mb-4">
          <ShoppingCart size={32} />
        </div>
        <h2 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Grocery Guide</h2>
        <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 max-w-md mx-auto">
          Personalized recommendations based on your {profile.goal} goal and health profile.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {categories.map(category => (
          <section key={category} className="space-y-6">
            <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-[#5A5A40]/30 flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-[#5A5A40]/20 rounded-full shadow-sm" />
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {groceries.filter(item => item.category === category).map(item => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-10 rounded-[48px] border transition-all cursor-pointer relative overflow-hidden group ${
                    checkedItems.has(item.name) 
                      ? 'bg-[#f5f5f0]/50 border-[#5A5A40]/5 opacity-40' 
                      : 'bg-white border-[#5A5A40]/5 shadow-xl hover:shadow-2xl'
                  }`}
                  onClick={() => toggleItem(item.name)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#5A5A40]/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className={`w-8 h-8 rounded-[12px] border-2 flex items-center justify-center transition-all duration-500 ${
                        checkedItems.has(item.name) 
                          ? 'bg-[#5A5A40] border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20' 
                          : 'border-[#5A5A40]/10 bg-white'
                      }`}>
                        {checkedItems.has(item.name) && <CheckCircle2 size={18} className="text-white" />}
                      </div>
                      <h4 className={`text-xl font-black text-[#5A5A40] tracking-tight transition-all duration-500 ${checkedItems.has(item.name) ? 'line-through opacity-40' : ''}`}>
                        {item.name}
                      </h4>
                    </div>
                    <Sparkles size={20} className={`text-orange-400 transition-all duration-500 ${checkedItems.has(item.name) ? 'opacity-10' : 'opacity-40 group-hover:scale-125 group-hover:rotate-12'}`} />
                  </div>
                  
                  <p className={`text-sm text-[#5A5A40]/50 mb-8 leading-relaxed font-medium italic relative z-10 transition-all duration-500 ${checkedItems.has(item.name) ? 'opacity-20' : ''}`}>
                    "{item.reason}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {item.nutrients.map(nutrient => (
                      <span key={nutrient} className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all duration-500 ${
                        checkedItems.has(item.name)
                          ? 'bg-[#5A5A40]/5 text-[#5A5A40]/20'
                          : 'bg-[#f5f5f0] text-[#5A5A40]/40 border border-[#5A5A40]/5'
                      }`}>
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {groceries.length === 0 && !isLoading && (
        <div className="text-center py-24 bg-white rounded-[56px] border-2 border-dashed border-[#5A5A40]/10 shadow-sm">
          <ShoppingCart size={64} className="mx-auto mb-6 text-[#5A5A40]/10" />
          <p className="text-[#5A5A40]/30 font-black uppercase tracking-[0.2em] text-xs">No recommendations available yet.</p>
        </div>
      )}
    </div>
  );
}
