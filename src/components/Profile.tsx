import React, { useState } from 'react';
import Dexie from 'dexie';
import { useStore } from '../store/useStore';
import { User, Settings, Shield, Moon, Bell, LogOut, ChevronRight, Activity, Target, Languages, Info, Trash2, X, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db/db';
import { useTranslation } from '../lib/useTranslation';
import { supabase } from '../lib/supabase';

export const Profile: React.FC<{ 
  onNavigate?: (view: string) => void, 
  setActiveTab?: (tab: 'home' | 'diary' | 'analytics' | 'profile') => void 
}> = ({ onNavigate, setActiveTab }) => {
  const { profile, calculatedTargets, setProfile, setIsOnboarded, adaptiveTDEE, resetAll } = useStore();
  const { t, lang } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'nutrition' | 'meals'>('personal');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    resetAll();
  };

  const handleExport = async () => {
    try {
      const userProducts = await db.foods.where('type').equals('user').toArray();
      const recipes = await db.recipes.toArray();
      const logs = await db.logs.toArray();
      const weight = await db.weight.toArray();
      
      const dump = {
        version: 2,
        timestamp: Date.now(),
        data: { userProducts, recipes, logs, weight, profile }
      };
      
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrizen_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dump = JSON.parse(event.target?.result as string);
        if (dump.data) {
           if (dump.data.userProducts?.length) await db.foods.bulkPut(dump.data.userProducts);
           if (dump.data.recipes?.length) await db.recipes.bulkPut(dump.data.recipes);
           if (dump.data.logs?.length) await db.logs.bulkPut(dump.data.logs);
           if (dump.data.weight?.length) await db.weight.bulkPut(dump.data.weight);
           
           if (dump.data.profile) {
             setProfile(dump.data.profile);
           }
           
           alert(lang === 'ru' ? 'Импорт завершен!' : 'Import successful!');
           window.location.reload();
        }
      } catch (err) {
        alert(lang === 'ru' ? 'Ошибка импорта' : 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAll = async () => {
    try {
      await supabase.auth.signOut();
      db.close();
      await Dexie.delete('NutriZenDB');
      localStorage.clear();
      sessionStorage.clear();
      resetAll();
      window.location.href = window.location.origin + '?reset=' + Date.now();
    } catch (err) {
      console.error('Delete failed:', err);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-900 border-4 border-white shadow-xl flex items-center justify-center relative mb-4 transition-transform hover:scale-105 group overflow-hidden">
          <User className="text-white group-hover:scale-110 transition-transform" size={40} />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent pointer-events-none" />
        </div>
        <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">{profile.name || t('profile.champions')}</h1>
        <div className="flex items-center gap-2 mt-1">
           <span className="text-xs font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest">{t('profile.premium_member')}</span>
        </div>
      </header>

      {/* Tabs Switcher */}
      <nav className="flex items-center gap-2 bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100 mx-4">
        {[
          { id: 'personal', label: t('profile.tabs.personal') },
          { id: 'nutrition', label: t('profile.tabs.nutrition') },
          { id: 'meals', label: t('profile.tabs.meals') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
              activeSubTab === tab.id ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="px-1 space-y-8">
        <AnimatePresence mode="wait">
          {activeSubTab === 'personal' && (
            <motion.div 
              key="personal"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 space-y-6">
                <DataRow label={t('onboarding.age')} value={profile.age} />
                <DataRow label={t('onboarding.gender')} value={t(`onboarding.gender_${profile.gender}`)} />
                <DataRow label={t('onboarding.height')} value={`${profile.height} cm`} />
                <DataRow label={t('onboarding.weight')} value={`${profile.weight.toFixed(1)} kg`} />
                <DataRow label={t('onboarding.activity_title')} value={t(`onboarding.activity_${profile.activityLevel >= 1.725 ? 'active' : profile.activityLevel >= 1.55 ? 'moderate' : profile.activityLevel >= 1.375 ? 'light' : 'sedentary'}`)} />
                <DataRow label={t('onboarding.exp_title')} value={t(`onboarding.exp_${profile.experienceLevel || 'beginner'}`)} />
                <DataRow label={t('onboarding.goal_title')} value={t(`onboarding.goal_${profile.goal}`)} />
              </div>
              
              <button 
                onClick={() => onNavigate?.('basics')}
                className="w-full py-6 px-10 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 transition-transform group-hover:rotate-12">
                    <BookOpen size={20} />
                  </div>
                  <span className="font-black text-gray-900 text-sm">Academy Hub</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>

              <button 
                onClick={() => setIsOnboarded(false)}
                className="w-full py-6 px-10 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 transition-transform group-hover:rotate-12">
                    <Activity size={20} />
                  </div>
                  <span className="font-black text-gray-900 text-sm">{t('onboarding.re_onboarding')}</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExport}
                  className="py-4 px-6 bg-primary-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-200 active:scale-95 transition-all text-center"
                >
                  {lang === 'ru' ? 'Экспорт данных' : 'Export Data'}
                </button>
                <label className="py-4 px-6 bg-zinc-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 transition-all text-center">
                  {lang === 'ru' ? 'Импорт данных' : 'Import Data'}
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'nutrition' && (
            <motion.div 
              key="nutrition"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-50">
                <h3 className="font-display font-black text-xl mb-8 flex items-center gap-3 text-gray-900 tracking-tight">
                    <Target size={24} className="text-primary-600" /> {t('analytics.performance_targets')}
                </h3>
                <div className="space-y-6">
                  <TargetRow label={t('profile.targets.calories')} val={calculatedTargets.calories} unit="kcal" isLarge />
                  
                  <div className="grid grid-cols-3 gap-3 py-6 border-y border-gray-50">
                    <div className="text-center group">
                      <div className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">{t('dashboard.protein')}</div>
                      <div className="font-display font-black text-xl text-blue-600">{calculatedTargets.protein}g</div>
                    </div>
                    <div className="text-center group">
                      <div className="text-[10px] font-black text-amber-400 mb-2 uppercase tracking-widest">{t('dashboard.carbs')}</div>
                      <div className="font-display font-black text-xl text-amber-600">{calculatedTargets.carbs}g</div>
                    </div>
                    <div className="text-center group">
                      <div className="text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest">{t('dashboard.fat')}</div>
                      <div className="font-display font-black text-xl text-rose-600">{calculatedTargets.fat}g</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <DataRow label={t('dashboard.fiber')} value={`${calculatedTargets.fiber}g`} />
                    <DataRow label={t('dashboard.sugar')} value={`${calculatedTargets.sugar}g`} />
                    <DataRow label={t('profile.settings.maintenance')} value={`${adaptiveTDEE} kcal`} />
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate?.('goals')}
                  className="w-full mt-8 py-5 bg-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all border border-gray-100"
                >
                  {t('common.edit')} {t('profile.settings.goals')}
                </button>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'meals' && (
            <motion.div 
              key="meals"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-50 divide-y divide-gray-50">
                {(profile.mealStructure || []).map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-sm">
                        {meal.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-sm">{meal.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{meal.time}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-200" />
                  </div>
                ))}
                <button 
                  onClick={() => onNavigate?.('meal-structure')}
                  className="w-full py-5 text-center font-black text-[10px] uppercase tracking-widest text-primary-600 bg-primary-50/50 hover:bg-primary-50 transition-all"
                >
                  {t('common.edit')} {t('onboarding.meal_time_title')}
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", profile.notificationsEnabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400")}>
                    <Bell size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 text-sm">{t('common.notifications')}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setProfile({ notificationsEnabled: !profile.notificationsEnabled })}
                  className={cn("w-14 h-8 rounded-full relative transition-all duration-300", profile.notificationsEnabled ? "bg-primary-500" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md", profile.notificationsEnabled ? "right-1" : "left-1")} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="px-4 pt-8 space-y-4">
        <div className="bg-white rounded-[2rem] p-4 border border-gray-50 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Languages size={24} />
            </div>
            <span className="font-black text-sm text-gray-900">{t('profile.language')}</span>
          </div>
          <button 
             onClick={() => setProfile({ language: lang === 'en' ? 'ru' : 'en' })}
             className="px-4 py-2 bg-gray-50 rounded-xl font-black text-xs uppercase tracking-widest text-primary-600 border border-primary-50"
          >
             {lang === 'en' ? 'RU' : 'EN'}
          </button>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 text-zinc-300 font-black text-sm py-5 bg-zinc-900 border border-zinc-800 rounded-[2rem] hover:bg-zinc-850 hover:text-white transition-all active:scale-[0.98] group mb-3"
        >
          <LogOut size={20} className="text-zinc-500 group-hover:text-white transition-colors" /> 
          {lang === 'en' ? 'SIGN OUT' : 'ВЫЙТИ ИЗ АККАУНТА'}
        </button>

        <button 
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-3 text-rose-500 font-black text-sm py-5 bg-rose-50 rounded-[2rem] border border-rose-100 hover:bg-rose-100 transition-all active:scale-[0.98] group"
        >
          <Trash2 size={20} className="group-hover:rotate-12 transition-transform" /> 
          {t('profile.delete_data')}
        </button>
        <p className="text-[10px] text-gray-400 font-medium text-center mt-4 px-10 leading-relaxed uppercase tracking-widest">
           NutriZen stores data locally. Deletion is IRREVERSIBLE.
        </p>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 flex flex-col items-center text-center overflow-hidden relative"
             >
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                   <AlertTriangle size={40} />
                </div>
                
                <h3 className="text-2xl font-display font-black text-gray-900 mb-3 tracking-tight">{t('profile.nuclear_option')}</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                  {t('profile.delete_warning')}
                </p>

                <div className="w-full space-y-3">
                   <button 
                      onClick={handleDeleteAll}
                      className="w-full bg-rose-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-rose-200 active:scale-95 transition-all"
                   >
                     {t('profile.confirm_delete_extra')}
                   </button>
                   <button 
                      onClick={() => setShowDeleteModal(false)}
                      className="w-full bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black text-sm active:scale-95 transition-all"
                   >
                      {t('common.cancel')}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TargetRow: React.FC<{ label: string, val: number, unit: string, isLarge?: boolean }> = ({ label, val, unit, isLarge }) => (
  <div className="flex justify-between items-center py-1">
    <span className={cn("text-gray-500 font-bold", isLarge ? "text-lg text-gray-700" : "text-sm")}>{label}</span>
    <span className={cn("font-display font-black text-gray-900", isLarge ? "text-2xl" : "text-sm")}>
      {val} <span className="text-gray-400 font-normal uppercase text-[10px] ml-1">{unit}</span>
    </span>
  </div>
);

const DataRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-gray-900">{value}</span>
  </div>
);


