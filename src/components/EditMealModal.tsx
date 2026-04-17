import React, { useState } from 'react';
import { FoodLog, MealType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Utensils } from 'lucide-react';

interface EditMealModalProps {
  log: FoodLog;
  onClose: () => void;
  onSave: (updatedLog: FoodLog) => void;
}

export default function EditMealModal({ log, onClose, onSave }: EditMealModalProps) {
  const [editedLog, setEditedLog] = useState<FoodLog>({ ...log });

  const handleMacroChange = (field: keyof Pick<FoodLog, 'calories' | 'protein' | 'carbs' | 'fat'>, value: number) => {
    setEditedLog(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: 'name' | 'weight', value: string | number) => {
    if (!editedLog.items) return;
    const newItems = [...editedLog.items];
    const item = newItems[index];

    if (field === 'weight') {
      const newWeight = Number(value) || 0;
      const oldWeight = item.weight || 1;
      const ratio = newWeight / oldWeight;

      newItems[index] = {
        ...item,
        weight: newWeight,
        calories: Math.round(item.calories * ratio),
        protein: Math.round(item.protein * ratio * 10) / 10,
        carbs: Math.round(item.carbs * ratio * 10) / 10,
        fat: Math.round(item.fat * ratio * 10) / 10,
      };

      const totalCalories = newItems.reduce((sum, i) => sum + i.calories, 0);
      const totalProtein = Math.round(newItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
      const totalCarbs = Math.round(newItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10;
      const totalFat = Math.round(newItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10;

      setEditedLog(prev => ({
        ...prev,
        items: newItems,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      }));
    } else {
      newItems[index] = { ...item, name: value as string };
      setEditedLog(prev => ({ ...prev, items: newItems }));
    }
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[56px] overflow-hidden shadow-2xl border border-[#5A5A40]/5"
      >
        <div className="p-12">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-[#5A5A40] tracking-tighter">Edit Meal</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">Refine your culinary record</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="p-4 bg-[#f5f5f0] hover:bg-[#5A5A40]/5 rounded-full transition-all"
            >
              <X size={24} className="text-[#5A5A40]" />
            </motion.button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block ml-4">Meal Name</label>
              <input 
                type="text"
                className="w-full p-6 bg-[#f5f5f0] rounded-[28px] font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner"
                value={editedLog.name}
                onChange={(e) => setEditedLog(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block ml-4">Meal Type</label>
                <div className="relative">
                  <select 
                    className="w-full p-6 bg-[#f5f5f0] rounded-[28px] font-black text-[#5A5A40] outline-none appearance-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner"
                    value={editedLog.mealType}
                    onChange={(e) => setEditedLog(prev => ({ ...prev, mealType: e.target.value as MealType }))}
                  >
                    {mealTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <Utensils size={18} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block ml-4">Calories (kcal)</label>
                <input 
                  type="number"
                  className="w-full p-6 bg-[#f5f5f0] rounded-[28px] font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner"
                  value={editedLog.calories}
                  onChange={(e) => handleMacroChange('calories', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block text-center">Protein (g)</label>
                <input 
                  type="number"
                  className="w-full p-5 bg-[#f5f5f0] rounded-[24px] font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner text-center"
                  value={editedLog.protein}
                  onChange={(e) => handleMacroChange('protein', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block text-center">Carbs (g)</label>
                <input 
                  type="number"
                  className="w-full p-5 bg-[#f5f5f0] rounded-[24px] font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner text-center"
                  value={editedLog.carbs}
                  onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 block text-center">Fat (g)</label>
                <input 
                  type="number"
                  className="w-full p-5 bg-[#f5f5f0] rounded-[24px] font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner text-center"
                  value={editedLog.fat}
                  onChange={(e) => handleMacroChange('fat', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {editedLog.items && editedLog.items.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-4 block ml-4">Ingredients & Weights</label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {editedLog.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input 
                        type="text"
                        className="flex-1 p-4 bg-[#f5f5f0]/50 rounded-[20px] text-sm font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      />
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-24 p-4 bg-[#f5f5f0]/50 rounded-[20px] text-sm font-black text-[#5A5A40] outline-none border border-[#5A5A40]/5 text-center pr-8"
                          value={item.weight}
                          onChange={(e) => handleItemChange(idx, 'weight', parseInt(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase opacity-30">g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(editedLog)}
            className="w-full mt-12 p-6 bg-[#5A5A40] text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-2xl hover:shadow-[#5A5A40]/20 transition-all"
          >
            <Save size={20} />
            Save Changes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
