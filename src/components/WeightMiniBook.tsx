import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Scale, Droplets, Zap, Activity, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from '../lib/useTranslation';
import { cn } from '../lib/utils';

export const WeightMiniBook: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const [currentChapter, setCurrentChapter] = React.useState(0);
  const totalChapters = 3;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <header className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-50 rounded-full shadow-sm hover:bg-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-display font-black tracking-tight leading-none">{t('education.weight.title')}</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CHAPTER {currentChapter + 1} OF {totalChapters}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
           {Array.from({ length: totalChapters }).map((_, i) => (
             <div key={i} className={cn("w-6 h-1 rounded-full transition-all", i <= currentChapter ? "bg-primary-500" : "bg-gray-100")} />
           ))}
        </div>
      </header>

      <div className="p-6 space-y-12 max-w-2xl mx-auto min-h-[70vh]">
        <AnimatePresence mode="wait">
          {currentChapter === 0 && (
            <motion.div 
              key="ch1" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <Chapter 
                icon={<Scale className="text-primary-500" />}
                title={t('education.weight.myth_title')}
                content={
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed font-medium">
                      {t('education.weight.myth_content')} Many people think that if the scale moves up, they've "gained fat." In reality, fat tissue changes occur very slowly.
                    </p>
                    <div className="flex gap-3">
                       <div className="flex-1 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                          <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Scale Weight</div>
                          <div className="text-sm font-bold text-rose-900">Total Body Mass</div>
                       </div>
                       <div className="flex-1 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Fat Mass</div>
                          <div className="text-sm font-bold text-emerald-900">Stored Energy</div>
                       </div>
                    </div>
                  </div>
                }
              />
            </motion.div>
          )}

          {currentChapter === 1 && (
            <motion.div 
              key="ch2" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <Chapter 
                icon={<Droplets className="text-blue-500" />}
                title={t('education.weight.water_title')}
                content={
                  <div className="space-y-4 text-gray-600 leading-relaxed font-medium">
                    <p>{t('education.weight.water_content')}</p>
                    <ul className="space-y-3 pt-2">
                       <li className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                          <span className="text-sm"><strong>Salt Intake:</strong> Sodium holds onto water. A salty meal can cause a 1-2kg temporary spike.</span>
                       </li>
                       <li className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                          <span className="text-sm"><strong>Glycogen:</strong> Carbs are stored as glycogen. Every gram of glycogen holds ~3 grams of water.</span>
                       </li>
                    </ul>
                  </div>
                }
              />
            </motion.div>
          )}

          {currentChapter === 2 && (
            <motion.div 
              key="ch3" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <Chapter 
                icon={<Zap className="text-amber-500" />}
                title={t('education.weight.linear_title')}
                content={
                  <div className="space-y-6">
                     <p className="text-gray-600 leading-relaxed font-medium">
                       {t('education.weight.linear_content')} Progress happens in waves, not straight lines. 
                       This is why NutriZen focuses on <strong>Weekly Averages</strong> and <strong>Weight Trends</strong> rather than daily numbers.
                     </p>
                     <div className="p-8 bg-gray-900 rounded-[3rem] text-white space-y-4">
                        <h3 className="text-xl font-display font-black flex items-center gap-2">
                           <Info className="text-primary-500" /> Key Takeaway
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {t('education.weight.takeaway')}
                        </p>
                     </div>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-2xl mx-auto">
         <div className="flex gap-3">
            {currentChapter > 0 && (
              <button 
                onClick={() => setCurrentChapter(prev => prev - 1)}
                className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button 
              onClick={() => {
                if (currentChapter < totalChapters - 1) setCurrentChapter(prev => prev + 1);
                else onBack();
              }}
              className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all"
            >
              {currentChapter < totalChapters - 1 ? 'NEXT CHAPTER' : 'FINISH READING'}
            </button>
         </div>
      </div>
    </div>
  );
};

const Chapter: React.FC<{ icon: React.ReactNode, title: string, content: React.ReactNode }> = ({ icon, title, content }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="space-y-6"
  >
    <div className="flex items-center gap-4">
       <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl">
          {icon}
       </div>
       <h2 className="text-2xl font-display font-black text-gray-900">{title}</h2>
    </div>
    <div className="pl-1 text-gray-700">
       {content}
    </div>
  </motion.section>
);

const ErrorItem: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
  <div className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
    <div className="font-black text-sm text-gray-900 mb-1">{title}</div>
    <div className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</div>
  </div>
);
