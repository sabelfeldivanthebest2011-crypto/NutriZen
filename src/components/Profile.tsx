import React, { useState } from 'react';
import Dexie from 'dexie';
import { useStore } from '../store/useStore';
import { User, Shield, LogOut, ChevronRight, Activity, Target, Languages, AlertTriangle, BookOpen, Bell } from 'lucide-react';
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

  const handleSignOut = async () => { await supabase.auth.signOut(); resetAll(); };
  const handleDeleteAll = async () => {
    try {
      await supabase.auth.signOut().catch(() => {});
      db.close();
      await Dexie.delete('NutriZenDB');
      localStorage.clear(); sessionStorage.clear();
      resetAll();
      window.location.href = window.location.origin + '?reset=' + Date.now();
    } catch (err) { window.location.href = '/'; }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-900 border-4 border-white shadow-xl flex items-center justify-center relative mb-4">
          <User className="text-white" size={40} />
        </div>
        <h1 className="text-2xl font-display font-black text-gray-900">{profile.name || t('profile.champions')}</h1>
      </header>

      <nav className="flex items-center gap-2 bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100 mx-4">
        {[
          { id: 'personal', label: t('profile.tabs.personal') },
          { id: 'nutrition', label: t('profile.tabs.nutrition') },
          { id: 'meals', label: t('profile.tabs.meals') },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={cn("flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all", activeSubTab === tab.id ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600")}>
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="px-4 space-y-8">
        <AnimatePresence mode="wait">
          {activeSubTab === 'personal' && (
            <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50">
              <DataRow label={t('onboarding.age')} value={profile.age} />
              <DataRow label={t('onboarding.height')} value={`${profile.height} cm`} />
              <DataRow label={t('onboarding.weight')} value={`${profile.weight.toFixed(1)} kg`} />
              <button onClick={() => setIsOnboarded(false)} className="w-full mt-4 py-4 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {t('onboarding.re_onboarding')}
              </button>
            </motion.div>
          )}
          {activeSubTab === 'nutrition' && (
            <motion.div key="nutrition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50">
              <TargetRow label={t('profile.targets.calories')} val={calculatedTargets.calories} unit="kcal" />
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => onNavigate?.('privacy')} className="w-full bg-white border border-gray-50 rounded-[2rem] p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Shield size={24} /></div>
            <span className="font-black text-sm text-gray-900">{lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}</span>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>

        <div className="pt-8 text-center space-y-3">
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Data Controller: IE Chebotarev M. A.</p>
          <a href="mailto:sabelfeld.i@icloud.com" className="text-primary-600 font-black text-[10px] hover:underline">sabelfeld.i@icloud.com</a>
        </div>
      </section>

      {/* Delete Modal Trigger */}
      <button onClick={() => setShowDeleteModal(true)} className="w-full text-rose-500 font-black text-xs py-4">{t('profile.delete_data')}</button>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center">
            <h3 className="text-xl font-black mb-4">{t('profile.nuclear_option')}</h3>
            <button onClick={handleDeleteAll} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm">{t('profile.confirm_delete_extra')}</button>
            <button onClick={() => setShowDeleteModal(false)} className="w-full mt-2 text-gray-400 font-black text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const DataRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-gray-900">{value}</span>
  </div>
);

const TargetRow: React.FC<{ label: string, val: number, unit: string }> = ({ label, val, unit }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <span className="text-xl font-black">{val} <span className="text-xs text-gray-400">{unit}</span></span>
  </div>
);