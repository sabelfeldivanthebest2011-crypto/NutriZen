import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { WheelPicker } from '../ui/WheelPicker';
import { GlassCard, PrimaryButton } from '../ui/DesignSystem';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils'; // ИСПРАВЛЕН ИМПОРТ

export const BasicsFlow = () => {
  const [step, setStep] = useState(0);
  const { onboarding, setAnswer, updateOnboarding } = useStore();
  const answers = onboarding.answers;

  const handleNext = () => {
    if (step < 4) setStep(step + 1); // Настрой количество шагов под себя
    else {
      updateOnboarding({ basicsStatus: 'completed', section: 'hub' });
    }
  };

  const handleBack = () => {
    if (step === 0) updateOnboarding({ section: 'hub' });
    else setStep(step - 1);
  };

  const steps = [
    {
      title: "What is your sex?",
      subtitle: "Helps calculate baseline metabolism",
      content: (
        <div className="grid grid-cols-1 gap-4">
          {['Female', 'Male'].map(s => (
            <GlassCard key={s} active={answers.gender === s} onClick={() => setAnswer('gender', s)} className="p-6 flex justify-between items-center">
              <span className="font-black text-xl">{s}</span>
              <div className={cn("w-6 h-6 rounded-full border-2", answers.gender === s ? "bg-black border-black" : "border-zinc-200")} />
            </GlassCard>
          ))}
        </div>
      )
    },
    {
      title: "When were you born?",
      subtitle: "Age is a factor in adaptive logic",
      content: (
        <div className="flex gap-2">
          {/* ТИПИЗАЦИЯ (v: any) исправляет ошибки TypeScript */}
          <WheelPicker options={Array.from({length: 31}, (_, i) => i + 1)} value={answers.birthDay || 15} onChange={(v: any) => setAnswer('birthDay', v)} />
          <WheelPicker options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']} value={answers.birthMonth || 'May'} onChange={(v: any) => setAnswer('birthMonth', v)} />
          <WheelPicker options={Array.from({length: 80}, (_, i) => 2010 - i)} value={answers.birthYear || 1995} onChange={(v: any) => setAnswer('birthYear', v)} />
        </div>
      )
    },
    {
        title: "What is your height?",
        subtitle: "Used for BMI and TDEE formulas",
        content: <WheelPicker options={Array.from({length: 120}, (_, i) => i + 120)} value={answers.height || 175} onChange={(v: any) => setAnswer('height', v)} />
    },
    {
        title: "Current weight?",
        subtitle: "0.1 kg precision for accurate tracking",
        content: (
            <div className="flex flex-col items-center">
                <div className="text-6xl font-black mb-8">{answers.weight || 75.0} <span className="text-xl">kg</span></div>
                <WheelPicker options={Array.from({length: 2000}, (_, i) => (30 + i * 0.1).toFixed(1))} value={answers.weight || "75.0"} onChange={(v: any) => setAnswer('weight', v)} />
            </div>
        )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft />
        </button>
        <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-black transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
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