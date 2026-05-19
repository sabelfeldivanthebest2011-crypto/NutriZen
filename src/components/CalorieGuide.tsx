import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Zap, Info, Target, TrendingUp, Droplets, BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';

export const CalorieGuide: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const [currentChapter, setCurrentChapter] = useState(0);

  const chapters = [
    {
      title: lang === 'en' ? 'The Law of Thermodynamics' : 'Закон термодинамики',
      icon: <Zap className="text-amber-500" />,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed font-semibold">
            {lang === 'en' 
              ? "Calories are a measurement of energy. Your body is a machine that either burns this energy or stores it for later."
              : "Калории — это мера энергии. Ваше тело — это машина, которая либо сжигает эту энергию, либо запасает её на потом."}
          </p>
          <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500"><TrendingUp size={16} /></div>
                <span className="text-sm font-black text-gray-900">{lang === 'en' ? 'Surplus = Storage (Fat Gain)' : 'Профицит = Запас (Жир)'}</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500"><Target size={16} /></div>
                <span className="text-sm font-black text-gray-900">{lang === 'en' ? 'Deficit = Usage (Fat Loss)' : 'Дефицит = Расход (Жиросжигание)'}</span>
             </div>
          </div>
        </div>
      )
    },
    {
      title: lang === 'en' ? 'Total Daily Energy (TDEE)' : 'Ваш расход (TDEE)',
      icon: <BookOpen className="text-blue-500" />,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed font-medium">
            {lang === 'en' ? "Your TDEE is made of 4 components:" : "Ваш TDEE состоит из 4 компонентов:"}
          </p>
          <div className="space-y-3">
             {[
               { id: 'BMR', label: lang === 'en' ? 'Basal Metabolism' : 'Базальный метаболизм', val: '60-70%', desc: lang === 'en' ? 'Energy while lying in bed' : 'Энергия в покое' },
               { id: 'NEAT', label: lang === 'en' ? 'Non-Exercise Activity' : 'Бытовая активность', val: '15-20%', desc: lang === 'en' ? 'Walking, typing, movement' : 'Ходьба, жестикуляция' },
               { id: 'TEF', label: lang === 'en' ? 'Thermic Effect of Food' : 'Термический эффект пищи', val: '10%', desc: lang === 'en' ? 'Energy used to digest' : 'Переваривание еды' },
               { id: 'EAT', label: lang === 'en' ? 'Exercise Activity' : 'Тренировки', val: '5-10%', desc: lang === 'en' ? 'Weightlifting, cardio' : 'Силовые, кардио' },
             ].map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white transition-all">
                   <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.id} • {item.val}</div>
                      <div className="text-sm font-black text-gray-900">{item.label}</div>
                   </div>
                   <div className="text-[10px] text-gray-400 italic">{item.desc}</div>
                </div>
             ))}
          </div>
        </div>
      )
    },
    {
      title: lang === 'en' ? 'Adaptation: The Plateau' : 'Адаптация: Плато',
      icon: <TrendingUp className="text-purple-500" />,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed font-medium">
            {lang === 'en' 
              ? "As you lose weight, your body requires less energy. Your TDEE is not a static number—it is a moving target." 
              : "Когда вы худеете, телу нужно меньше энергии. Ваши нормы калорий — это не константа, а движущаяся цель."}
          </p>
          <div className="p-6 bg-gray-900 rounded-[2rem] text-white">
             <div className="flex items-center gap-2 mb-4 text-primary-400">
                <Info size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Scientific Fact</span>
             </div>
             <p className="text-sm font-medium leading-relaxed opacity-80">
                {lang === 'en' 
                  ? "Adaptive Thermogenesis means your BMR can drop slightly more than weight loss alone explains. This is why NutriZen uses an adaptive algorithm." 
                  : "Адаптивный термогенез означает, что ваш метаболизм может замедляться чуть сильнее, чем просто от потери веса. Поэтому мы используем адаптивный алгоритм."}
             </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#FAFAF8] flex flex-col"
        >
          <header className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 h-[72px]">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose} 
                className="p-2 bg-gray-50 rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-sm font-display font-black tracking-tight leading-none uppercase">
                  {lang === 'en' ? 'Calorie Guide' : 'Гид по калориям'}
                </h1>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CHAPTER {currentChapter + 1} OF {chapters.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
               {chapters.map((_, i) => (
                 <div key={i} className={cn("w-6 h-1 rounded-full transition-all", i <= currentChapter ? "bg-primary-500" : "bg-gray-100")} />
               ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-8 max-w-2xl mx-auto space-y-12 pb-32">
               <motion.div
                 key={currentChapter}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                  <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-3xl mb-4 shadow-inner">
                        {chapters[currentChapter].icon}
                     </div>
                     <h2 className="text-3xl font-display font-black text-gray-900 tracking-tight leading-tight">
                        {chapters[currentChapter].title}
                     </h2>
                  </div>

                  <div className="mt-8">
                     {chapters[currentChapter].content}
                  </div>
               </motion.div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 max-w-2xl mx-auto flex gap-3">
             {currentChapter > 0 && (
                <button 
                  onClick={() => setCurrentChapter(prev => prev - 1)}
                  className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <ChevronLeft size={24} />
                </button>
             )}
             <button 
               onClick={() => {
                 if (currentChapter < chapters.length - 1) setCurrentChapter(prev => prev + 1);
                 else onClose();
               }}
               className="flex-1 bg-gray-900 text-white rounded-[1.5rem] py-5 font-black text-sm active:scale-95 transition-all shadow-xl shadow-gray-200"
             >
               {currentChapter < chapters.length - 1 ? 'NEXT CHAPTER' : 'FINISH READING'}
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
