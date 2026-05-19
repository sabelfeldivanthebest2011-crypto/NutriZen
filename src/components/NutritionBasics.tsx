import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Info, BookOpen, Zap, Target, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';

export const NutritionBasics: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();

  const lessons = [
    {
      id: 'energy',
      icon: <Zap className="text-amber-500" size={24} fill="currentColor" />,
      title: t('education.basics.energy_title'),
      color: 'bg-amber-50',
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">{t('education.basics.energy_content')}</p>
          <div className="bg-zinc-950 p-8 rounded-[2rem] border border-white/5 space-y-4">
             <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protein</span>
                <span className="text-lg font-display font-black text-white">4 <span className="text-[10px] text-zinc-600">kcal/g</span></span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Carbs</span>
                <span className="text-lg font-display font-black text-white">4 <span className="text-[10px] text-zinc-600">kcal/g</span></span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fat</span>
                <span className="text-lg font-display font-black text-white">9 <span className="text-[10px] text-zinc-600">kcal/g</span></span>
             </div>
             <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alcohol</span>
                <span className="text-lg font-display font-black text-rose-500">7 <span className="text-[10px] text-rose-900">kcal/g</span></span>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'macros',
      icon: <BookOpen className="text-primary-500" size={24} />,
      title: "The Macronutrient Trio",
      color: 'bg-primary-50',
      content: (
        <div className="space-y-10">
          <div className="relative pl-6 border-l-4 border-primary-500">
             <h4 className="font-display font-black text-xl text-gray-900 mb-2">{t('education.basics.protein_title')}</h4>
             <p className="text-sm text-gray-500 leading-relaxed">{t('education.basics.protein_desc')}</p>
             <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-primary-50 text-[10px] font-black text-primary-600 rounded-full">BUILD</span>
                <span className="px-3 py-1 bg-primary-50 text-[10px] font-black text-primary-600 rounded-full">REPAIR</span>
             </div>
          </div>

          <div className="relative pl-6 border-l-4 border-amber-500">
             <h4 className="font-display font-black text-xl text-gray-900 mb-2">{t('education.basics.carbs_title')}</h4>
             <p className="text-sm text-gray-500 leading-relaxed">{t('education.basics.carbs_desc')}</p>
             <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-amber-50 text-[10px] font-black text-amber-600 rounded-full">FUEL</span>
                <span className="px-3 py-1 bg-amber-50 text-[10px] font-black text-amber-600 rounded-full">GLYCOGEN</span>
             </div>
          </div>

          <div className="relative pl-6 border-l-4 border-rose-500">
             <h4 className="font-display font-black text-xl text-gray-900 mb-2">{t('education.basics.fat_title')}</h4>
             <p className="text-sm text-gray-500 leading-relaxed">{t('education.basics.fat_desc')}</p>
             <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-rose-50 text-[10px] font-black text-rose-600 rounded-full">HORMONES</span>
                <span className="px-3 py-1 bg-rose-50 text-[10px] font-black text-rose-600 rounded-full">VITAL</span>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'fiber',
      icon: <Target className="text-emerald-500" size={24} />,
      title: t('education.basics.fiber_title'),
      color: 'bg-emerald-50',
      content: (
        <div className="space-y-6">
          <p className="text-gray-500 leading-relaxed">{t('education.basics.fiber_desc')}</p>
          <div className="p-8 bg-emerald-50 rounded-[2.5rem] flex flex-col items-center gap-2 border border-emerald-100 shadow-inner">
             <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Recommended Daily</div>
             <div className="text-4xl font-display font-black text-emerald-900 leading-none">25-35<span className="text-sm">g</span></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-12">
      <header className="px-6 pt-12 pb-8 sticky top-0 bg-[#FAFAF8]/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft size={24} />
           </button>
           <div className="w-12" />
        </div>
        <div>
          <h2 className="text-[11px] font-black uppercase text-primary-500 tracking-[0.2em] mb-2">Knowledge Base</h2>
          <h1 className="text-4xl font-display font-black tracking-tight text-gray-900">Academy</h1>
        </div>
      </header>

      <div className="px-6 space-y-12">
        {lessons.map((lesson, idx) => (
          <motion.section 
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", lesson.color)}>
                {lesson.icon}
              </div>
              <h2 className="text-2xl font-display font-black text-gray-900 tracking-tight">{lesson.title}</h2>
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
               {lesson.content}
            </div>
          </motion.section>
        ))}

        <div className="p-10 bg-gray-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/20 rounded-full blur-[80px]" />
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-500">
                    <Zap size={20} fill="currentColor" />
                 </div>
                 <h4 className="font-display font-black text-lg">Daily Mastery</h4>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                "We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Aristotle. Keep tracking, keep learning.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
