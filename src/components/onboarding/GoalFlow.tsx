import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { WheelPicker } from '../ui/WheelPicker';
import { GlassCard, PrimaryButton } from '../ui/DesignSystem';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GoalFlow = () => {
  const [step, setStep] = useState(0);
  const { onboarding, setAnswer, updateOnboarding } = useStore();
  
  // Берем текущий вес из ответов, чтобы рассчитать диапазон
  const currentWeight = Number(onboarding.answers.weight) || 75;
  const goalType = onboarding.answers.goalType || 'Lose Weight';

  const weightOptions = useMemo(() => {
    if (goalType === 'Lose Weight') {
      return Array.from({ length: 200 }, (_, i) => (currentWeight - i * 0.1).toFixed(1));
    } else if (goalType === 'Gain Weight') {
      return Array.from({ length: 200 }, (_, i) => (currentWeight + i * 0.1).toFixed(1));
    }
    return [currentWeight.toFixed(1)];
  }, [goalType, currentWeight]);

  const steps = [
    {
      title: "What is your goal?",
      content: (
        <div className="grid gap-4">
          {['Lose Weight', 'Maintain', 'Gain Weight'].map(g => (
            <GlassCard key={g} active={onboarding.answers.goalType === g} onClick={() => setAnswer('goalType', g)} className="p-6">
               <span className="font-black text-xl">{g}</span>
            </GlassCard>
          ))}
        </div>
      )
    },
    {
      title: "Target weight?",
      content: (
        <div className="flex flex-col items-center">
          <div className="text-6xl font-black mb-8">{onboarding.answers.targetWeight || currentWeight} <span className="text-xl">kg</span></div>
          <WheelPicker options={weightOptions} value={onboarding.answers.targetWeight || currentWeight.toFixed(1)} onChange={(v: any) => setAnswer('targetWeight', v)} />
        </div>
      )
    },
    {
      title: "Goal speed?",
      content: (
        <div className="space-y-8">
          <div className="text-center">
             <div className="text-4xl font-black">{onboarding.answers.speed || '0.5'}%</div>
             <div className="text-zinc-400 font-bold uppercase text-[10px]">Bodyweight per week</div>
          </div>
          <input 
            type="range" min="0.1" max="1.5" step="0.1" 
            value={onboarding.answers.speed || 0.5} 
            onChange={(e) => setAnswer('speed', e.target.value)}
            className="w-full accent-black h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else updateOnboarding({ goalStatus: 'completed', section: 'hub' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8 flex flex-col animate-in fade-in duration-500">
       <button onClick={() => step > 0 ? setStep(step - 1) : updateOnboarding({ section: 'hub' })} className="mb-8 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-black/5">
         <ChevronLeft size={20} />
       </button>
       <h1 className="text-4xl font-black mb-12 tracking-tighter">{steps[step].title}</h1>
       <div className="flex-1">{steps[step].content}</div>
       <PrimaryButton onClick={handleNext} className="mt-8">Next</PrimaryButton>
    </div>
  );
};