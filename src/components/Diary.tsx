import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, FoodLog, FoodItem } from '../db/db';
import { FoodSearchModal } from './FoodSearchModal';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronRight, ChevronLeft, Flame, Trash2, Edit2, BookOpen, Target } from 'lucide-react';
import { startOfDay, endOfDay, format, addDays, subDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { Toast } from './ui/Toast';
import { MealRatingModal } from './ui/MealRatingModal';
import { calculateMealRating } from '../lib/nutritionLogic';
import { supabase } from '../lib/supabase';

export const Diary: React.FC = () => {
  const { profile, setProfile, user } = useStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string>(profile.mealStructure?.[0]?.id || 'breakfast');
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [toast, setToast] = useState<{ message: string, onUndo?: () => void, isVisible: boolean }>({ message: '', isVisible: false });
  const [libraryType, setLibraryType] = useState<'recipes' | 'products' | null>(null);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, mealName: string, logs: FoodLog[] }>({ isOpen: false, mealName: '', logs: [] });

  const dayLogs = useLiveQuery(
    () => db.logs.where('timestamp').between(startOfDay(selectedDate).getTime(), endOfDay(selectedDate).getTime()).toArray(),
    [selectedDate]
  );

  const handleAddClick = (mealId: string) => {
    setSelectedMealId(mealId);
    setEditingLog(null);
    setIsSearchOpen(true);
  };

  const handleEditClick = (log: FoodLog) => {
    setEditingLog(log);
    setSelectedMealId(log.mealType);
    setIsSearchOpen(true);
  };

  const deleteLog = async (id: number) => {
    const log = await db.logs.get(id);
    if (!log) return;
    
    // Удаляем локально из Dexie
    await db.logs.delete(id);

    // Удаляем из Supabase удаленно
    if (user?.id) {
      try {
        await supabase.from('daily_meals').delete().eq('user_id', user.id).eq('local_id', id);
      } catch (err) {
        console.error("Failed to delete remote log:", err);
      }
    }

    setToast({
      message: 'Запись удалена',
      isVisible: true,
      onUndo: async () => {
        const addedId = await db.logs.add(log);
        // Восстанавливаем в Supabase при отмене удалении
        if (user?.id) {
          try {
            await supabase.from('daily_meals').insert({
              user_id: user.id,
              local_id: addedId,
              meal_type: log.mealType,
              amount: log.amount,
              name_ru: log.name_ru,
              name_en: log.name_en,
              calories: log.nutrients?.calories || (log as any).calories || 0,
              protein: log.nutrients?.protein || (log as any).protein || 0,
              carbs: log.nutrients?.carbs || (log as any).carbs || 0,
              fat: log.nutrients?.fat || (log as any).fat || 0,
              timestamp: log.timestamp
            });
          } catch (err) {
            console.error("Failed to restore remote log:", err);
          }
        }
      }
    });
  };

  const logsByMeal = (mealId: string) => dayLogs?.filter(l => l.mealType === mealId) || [];
  
  const totalCals = dayLogs?.reduce((acc, l) => {
    const cals = l.nutrients?.calories ?? (l as any).calories ?? 0;
    return acc + cals;
  }, 0) || 0;

  if (!profile || !profile.mealStructure || profile.mealStructure.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] glass rounded-[3rem] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-inner">🍎</div>
        <p className="text-gray-900 font-black text-xl mb-2 tracking-tight">{t('diary.meal_structure')}</p>
        <p className="text-gray-400 text-sm mb-10 max-w-[200px]">Для начала работы настройте структуру приемов пищи.</p>
        <button 
          onClick={() => setProfile({ mealStructure: [
            { id: 'breakfast', name: 'Завтрак', icon: '☀️', time: '08:00' },
            { id: 'lunch', name: 'Обед', icon: '🍱', time: '13:00' },
            { id: 'dinner', name: 'Ужин', icon: '🍽️', time: '19:00' },
            { id: 'snack', name: 'Перекусы', icon: '🍎', time: '16:00' },
          ] })}
          className="bg-gray-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-95 transition-all"
        >
          {t('common.confirm')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        onUndo={toast.onUndo} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {ratingModal.isOpen && (
        <MealRatingModal 
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal(prev => ({ ...prev, isOpen: false }))}
          mealName={ratingModal.mealName}
          {...calculateMealRating(ratingModal.logs)}
        />
      )}

      <header className="flex justify-between items-end px-2">
        <div>
          <div className="flex items-center gap-1 mb-2">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronLeft size={16} /></button>
            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-white/50">
               <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-[10px] tracking-widest uppercase">
                  {isSameDay(selectedDate, new Date()) ? t('common.today') : format(selectedDate, 'd MMM')}
               </span>
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronRight size={16} /></button>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">{t('diary.title')}</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-black text-gray-900 leading-none">{Math.round(totalCals)}</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">ккал всего</div>
        </div>
      </header>

      {/* Library Modals Access */}
      <div className="flex gap-2 px-2">
        <button 
          onClick={() => setLibraryType('recipes')}
          className="flex-1 bg-white p-4 rounded-3xl border border-white/50 shadow-sm flex items-center gap-3 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Рецепты</span>
        </button>
        <button 
          onClick={() => setLibraryType('products')}
          className="flex-1 bg-white p-4 rounded-3xl border border-white/50 shadow-sm flex items-center gap-3 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Продукты</span>
        </button>
      </div>

      <div className="space-y-5">
        {profile.mealStructure.map((section) => (
          <div key={section.id} className="glass rounded-[2.5rem] p-6 border-white/60 shadow-lg flex flex-col gap-6 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform relative">
                   <div className="w-2 h-2 rounded-full bg-primary-500 absolute top-2 right-2" />
                   {section.icon}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-gray-900 flex items-center gap-2">
                    {section.name}
                    {logsByMeal(section.id).length > 0 && (
                      <button 
                        onClick={() => setRatingModal({ 
                          isOpen: true, 
                          mealName: section.name, 
                          logs: logsByMeal(section.id) 
                        })}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm active:scale-95 transition-all",
                          calculateMealRating(logsByMeal(section.id)).grade === 'A' ? 'bg-[#038141] text-white' :
                          calculateMealRating(logsByMeal(section.id)).grade === 'B' ? 'bg-[#85BB2F] text-white' :
                          calculateMealRating(logsByMeal(section.id)).grade === 'C' ? 'bg-[#FECB02] text-black' :
                          calculateMealRating(logsByMeal(section.id)).grade === 'D' ? 'bg-[#EE8100] text-white' :
                          'bg-[#E63E11] text-white'
                        )}
                      >
                        {calculateMealRating(logsByMeal(section.id)).grade}
                      </button>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Flame size={12} className="text-rose-500" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                       {Math.round(logsByMeal(section.id).reduce((acc, l) => {
                         const cals = l.nutrients?.calories ?? (l as any).calories ?? 0;
                         return acc + cals;
                       }, 0))} kcal
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleAddClick(section.id)}
                className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-md active:scale-90"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {logsByMeal(section.id).map((log) => {
                const p = log.nutrients?.protein ?? ((log as any).protein ? ((log as any).protein * (log.amount / 100)) : 0);
                const c = log.nutrients?.carbs ?? ((log as any).carbs ? ((log as any).carbs * (log.amount / 100)) : 0);
                const f = log.nutrients?.fat ?? ((log as any).fat ? ((log as any).fat * (log.amount / 100)) : 0);
                const cal = log.nutrients?.calories ?? ((log as any).calories ? ((log as any).calories * (log.amount / 100)) : 0);

                return (
                  <div key={log.id} className="flex justify-between items-center p-4 bg-white/40 rounded-3xl border border-white/50 group/item hover:bg-white transition-all scroll-m-2">
                    <div className="flex-1">
                      <div className="font-black text-[15px] text-gray-900 leading-tight">
                        {t('common.lang') === 'ru' ? (log.name_ru || log.name_en || (log as any).name) : (log.name_en || log.name_ru || (log as any).name)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-primary-600 bg-primary-100/50 px-1.5 py-0.5 rounded-md">{Math.round(log.amount)}g</span>
                        <span>P: {Math.round(p)}g</span>
                        <span>C: {Math.round(c)}g</span>
                        <span>F: {Math.round(f)}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {Math.round(cal)} <span className="text-[10px] font-bold text-gray-400">kcal</span>
                        </div>
                       <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(log)} className="p-2 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => deleteLog(log.id!)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                       </div>
                    </div>
                  </div>
                );
              })}
              {logsByMeal(section.id).length === 0 && (
                <div className="text-center py-6 bg-white/30 rounded-[2rem] border-2 border-dashed border-white/40 group-hover:border-primary-100/50 transition-colors">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('diary.no_logs')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <FoodSearchModal 
            onClose={() => setIsSearchOpen(false)} 
            mealType={selectedMealId} 
            editingLog={editingLog}
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {libraryType === 'recipes' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[120] bg-zinc-950 flex flex-col"
          >
             <div className="flex-1 overflow-hidden">
                <FoodSearchModal 
                   onClose={() => setLibraryType(null)} 
                   mealType="library" 
                   initialTab="my-food"
                   initialSubTab="recipes"
                />
             </div>
          </motion.div>
        )}
        {libraryType === 'products' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[120] bg-zinc-950 flex flex-col"
          >
             <div className="flex-1 overflow-hidden">
                <FoodSearchModal 
                   onClose={() => setLibraryType(null)} 
                   mealType="library" 
                   initialTab="my-food"
                   initialSubTab="products"
                />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};