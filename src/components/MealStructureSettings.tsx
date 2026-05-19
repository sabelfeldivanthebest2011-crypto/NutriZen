import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, Plus, Trash2, GripVertical, Save, Info } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';

export const MealStructureSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { profile, setProfile } = useStore();
  const { t } = useTranslation();
  const [meals, setMeals] = useState(profile.mealStructure || []);

  const handleSave = () => {
    setProfile({ mealStructure: meals });
    onBack();
  };

  const addMeal = () => {
    const id = `meal-${Date.now()}`;
    setMeals([...meals, { id, name: t('common.new_meal') || 'New Meal', icon: '🍲', time: '12:00' }]);
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const updateMealName = (id: string, name: string) => {
    setMeals(meals.map(m => m.id === id ? { ...m, name } : m));
  };

  const updateMealTime = (id: string, time: string) => {
    setMeals(meals.map(m => m.id === id ? { ...m, time } : m));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6 pb-24">
      <header className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-display font-black tracking-tight">{t('profile.settings.meal_structure')}</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary-600 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform"
        >
          <Save size={20} />
        </button>
      </header>

      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-[3rem] p-6 shadow-sm border border-gray-100">
          <Reorder.Group axis="y" values={meals} onReorder={setMeals} className="space-y-3">
            {meals.map((meal) => (
              <Reorder.Item 
                key={meal.id} 
                value={meal}
                className="bg-gray-50/50 p-4 rounded-2xl flex items-center gap-4 group transition-all active:scale-[0.98] active:shadow-md border border-transparent hover:border-gray-100"
              >
                <div className="cursor-grab active:cursor-grabbing text-gray-300">
                  <GripVertical size={20} />
                </div>
                <span className="text-xl">{meal.icon}</span>
                <div className="flex-1 flex flex-col">
                  <input 
                    value={meal.name}
                    onChange={(e) => updateMealName(meal.id, e.target.value)}
                    className="bg-transparent font-black text-sm outline-none text-gray-900"
                  />
                  <input 
                    type="time"
                    value={meal.time}
                    onChange={(e) => updateMealTime(meal.id, e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-gray-400 outline-none uppercase tracking-widest"
                  />
                </div>
                <button 
                  onClick={() => removeMeal(meal.id)}
                  className="text-gray-300 hover:text-rose-500 transition-colors p-2"
                >
                  <Trash2 size={16} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button 
            onClick={addMeal}
            className="w-full mt-6 flex items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-xs hover:border-primary-200 hover:text-primary-500 transition-all uppercase tracking-widest"
          >
            <Plus size={16} /> {t('common.add')}
          </button>
        </div>

        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex gap-4">
           <Info className="text-blue-500 shrink-0" size={20} />
           <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
             Changes to meal names and order will instantly reflect in your daily diary and analytics breakdown.
           </p>
        </div>
      </div>
    </div>
  );
};
