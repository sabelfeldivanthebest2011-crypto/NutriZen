import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { WheelPicker } from '../ui/WheelPicker';
import { GlassCard, PrimaryButton } from '../ui/DesignSystem';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export const BasicsFlow = () => {
  const [step, setStep] = useState(0);
  const { onboarding, setAnswer, updateOnboarding } = useStore();
  const answers = onboarding.answers;

  // Динамические диапазоны
  const heightOptions = useMemo(() => Array.from({length: 121}, (_, i) => i + 120), []); // 120 - 240
  const weightOptions = useMemo(() => Array.from({length: 1701}, (_, i) => (30 + i * 0.1).toFixed(1)), []); // 30 - 200

  const steps = [
    {
      id: 'gender',
      title: "What is your sex?",
      subtitle: "Helps calculate baseline metabolism",
      content: (
        <div className="grid grid-cols-1 gap-4">
          {['Female', 'Male'].map(s => (
            <div 
              key={s} 
              onClick={() => setAnswer('gender', s)}
              className="cursor-pointer"
            >
              <GlassCard 
                active={answers.gender === s} 
                className="p-6 flex justify-between items-center pointer-events-none"
              >
                <span className="font-black text-xl">{s}</span>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 transition-colors", 
                  answers.gender === s ? "bg-black border-black" : "border-zinc-200"
                )} />
              </GlassCard>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'birthday',
      title: "When were you born?",
      subtitle: "Age is a factor in adaptive logic",
      content: (
        <div className="flex gap-2">
          <WheelPicker options={Array.from({length: 31}, (_, i) => i + 1)} value={answers.birthDay || 15} onChange={(v) => setAnswer('birthDay', v)} />
          <WheelPicker options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']} value={answers.birthMonth || 'May'} onChange={(v) => setAnswer('birthMonth', v)} />
          <WheelPicker options={Array.from({length: 70}, (_, i) => 2010 - i)} value={answers.birthYear || 1995} onChange={(v) => setAnswer('birthYear', v)} />
        </div>
      )
    },
    {
      id: 'height',
      title: "What is your height?",
      subtitle: "Used for BMI and TDEE formulas",
      content: (
        <div className="flex flex-col items-center">
          <div className="text-6xl font-black mb-8">{answers.height || 160} <span className="text-xl">cm</span></div>
          <WheelPicker options={heightOptions} value={answers.height || 160} onChange={(v) => setAnswer('height', v)} />
        </div>
      )
    },
    {
      id: 'weight',
      title: "Current weight?",
      subtitle: "0.1 kg precision for accurate tracking",
      content: (
        <div className="flex flex-col items-center">
          <div className="text-6xl font-black mb-8">{answers.weight || "70.0"} <span className="text-xl">kg</span></div>
          <WheelPicker options={weightOptions} value={answers.weight || "70.0"} onChange={(v) => setAnswer('weight', v)} />
        </div>
      )
    }
  ];

  const handleNext = () => {
    // Исправлено: проверка по длине массива steps
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      updateOnboarding({ basicsStatus: 'completed', section: 'hub' });
    }
  };

  const handleBack = () => {
    if (step === 0) updateOnboarding({ section: 'hub' });
    else setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col p-8">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft />
        </button>
        <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-black transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }} 
          transition={{ duration: 0.3 }} 
          className="flex-1 flex flex-col"
        >
          <h1 className="text-4xl font-black mb-2 tracking-tighter leading-tight">{steps[step].title}</h1>
          <p className="text-zinc-500 mb-12 font-medium">{steps[step].subtitle}</p>
          <div className="flex-1">{steps[step].content}</div>
        </motion.div>
      </AnimatePresence>

      <PrimaryButton onClick={handleNext} className="mt-8">
        {step === steps.length - 1 ? 'Complete Basics' : 'Next'}
      </PrimaryButton>
    </div>
  );
};