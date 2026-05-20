import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NutriScore } from '../../lib/nutritionLogic';

interface MealRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: NutriScore;
  positiveFactors: { label: string; value: string; impact: 'positive' }[];
  negativeFactors: { label: string; value: string; impact: 'negative' }[];
  mealName: string;
}

const GRADE_COLORS = {
  A: 'bg-[#038141] text-white',
  B: 'bg-[#85BB2F] text-white',
  C: 'bg-[#FECB02] text-black',
  D: 'bg-[#EE8100] text-white',
  E: 'bg-[#E63E11] text-white',
};

const GRADE_DESCRIPTIONS = {
  A: 'Высокая нутриентная плотность. Сбалансированный состав с обилием полезных веществ.',
  B: 'Хороший выбор. Содержит важные нутриенты при умеренном количестве ограничений.',
  C: 'Умеренная ценность. Рекомендуется дополнить овощами или белком.',
  D: 'Низкая ценность. Содержит много сахара, жиров или калорий при минимуме пользы.',
  E: 'Минимальная пользы. Продукт глубокой переработки или с критическим уровнем сахара/жиров.',
};

export const MealRatingModal: React.FC<MealRatingModalProps> = ({ 
  isOpen, onClose, grade, positiveFactors, negativeFactors, mealName 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[250] bg-zinc-950 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-12 space-y-8">
            <header className="flex justify-between items-center">
               <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <X size={24} />
               </button>
               <h2 className="text-xl font-display font-black text-white tracking-tight">Анализ состава</h2>
               <div className="w-12" />
            </header>

            <div className="flex flex-col items-center text-center space-y-4 py-8">
               <div className={cn(
                 "w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-6xl font-display font-black shadow-2xl animate-in zoom-in-50 duration-500",
                 GRADE_COLORS[grade]
               )}>
                 {grade}
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white">{mealName}</h3>
                  <p className="text-zinc-500 text-sm mt-2 max-w-xs">{GRADE_DESCRIPTIONS[grade]}</p>
               </div>
            </div>

            <div className="grid grid-cols-5 gap-1 p-2 bg-white/5 rounded-2xl border border-white/5">
               {['A', 'B', 'C', 'D', 'E'].map(g => (
                 <div key={g} className={cn(
                   "h-2 rounded-full transition-all duration-700",
                   g === grade ? GRADE_COLORS[grade as NutriScore] : 'bg-zinc-800'
                 )} />
               ))}
            </div>

            <div className="space-y-4">
               <div className="bg-white/5 rounded-[2rem] border border-white/5 p-6 backdrop-blur-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-emerald-500" /> Положительные факторы
                  </h4>
                  <div className="space-y-4">
                     {positiveFactors.length > 0 ? positiveFactors.map((f, i) => (
                       <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="text-sm font-bold text-white">{f.label}</span>
                          <span className="text-xs font-black text-emerald-400">{f.value}</span>
                       </div>
                     )) : (
                       <p className="text-zinc-600 text-xs italic">Значимых факторов не обнаружено</p>
                     )}
                  </div>
               </div>

               <div className="bg-white/5 rounded-[2rem] border border-white/5 p-6 backdrop-blur-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                     <AlertCircle size={14} className="text-rose-500" /> Ограничивающие факторы
                  </h4>
                  <div className="space-y-4">
                     {negativeFactors.length > 0 ? negativeFactors.map((f, i) => (
                       <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="text-sm font-bold text-white">{f.label}</span>
                          <span className="text-xs font-black text-rose-400">{f.value}</span>
                       </div>
                     )) : (
                       <p className="text-zinc-600 text-xs italic">Продукт хорошо сбалансирован</p>
                     )}
                  </div>
               </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-white/10">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                     <Info size={20} />
                  </div>
                  <div>
                     <h5 className="text-sm font-bold text-white mb-1">Как мы считаем?</h5>
                     <p className="text-xs text-zinc-500 leading-relaxed">Система учитывает плотность белка и клетчатки относительно добавленного сахара, насыщенных жиров и общей калорийности на 100г.</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
               Закрыть отчет
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
