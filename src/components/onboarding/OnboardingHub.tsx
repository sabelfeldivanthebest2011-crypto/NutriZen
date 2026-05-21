import React from 'react';
import { useStore } from '../../store/useStore';
import { GlassCard, PrimaryButton } from '../ui/DesignSystem';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Импортируем потоки (создай эти файлы, если еще не сделал)
import { BasicsFlow } from './BasicsFlow';
import { GoalFlow } from './GoalFlow';
import { ProgramFlow } from './ProgramFlow';

export const OnboardingHub = () => {
  const { onboarding, updateOnboarding } = useStore();

  // Логика переключения экранов
  // Если раздел в сторе — 'basics', 'goal' или 'program', показываем соответствующий опрос
  if (onboarding.section === 'basics') return <BasicsFlow />;
  if (onboarding.section === 'goal') return <GoalFlow />;
  if (onboarding.section === 'program') return <ProgramFlow />;

  // Иначе показываем Главный экран Онбординга (Хаб)
  const sections = [
    { 
      id: 'basics', 
      title: 'Basics', 
      status: onboarding.basicsStatus, 
      desc: 'Personal metrics' 
    },
    { 
      id: 'goal', 
      title: 'Goal', 
      status: onboarding.goalStatus, 
      desc: 'Targets & Speed', 
      locked: onboarding.basicsStatus !== 'completed' 
    },
    { 
      id: 'program', 
      title: 'Program', 
      status: onboarding.programStatus, 
      desc: 'Lifestyle & Diet', 
      locked: onboarding.goalStatus !== 'completed' 
    },
  ];

  // Определяем, какую кнопку показывать внизу
  const getButtonText = () => {
    if (onboarding.basicsStatus === 'todo') return 'Go to Basics';
    if (onboarding.goalStatus === 'todo') return 'Go to Goal';
    if (onboarding.programStatus === 'todo') return 'Go to Program';
    return 'Finalize Program';
  };

  const handleMainAction = () => {
    if (onboarding.basicsStatus === 'todo') updateOnboarding({ section: 'basics' });
    else if (onboarding.goalStatus === 'todo') updateOnboarding({ section: 'goal' });
    else if (onboarding.programStatus === 'todo') updateOnboarding({ section: 'program' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8 flex flex-col">
      <div className="mt-12 mb-12">
        <h1 className="text-5xl font-black tracking-tighter leading-none mb-4">LET'S GET<br/>STARTED</h1>
        <p className="text-zinc-500 font-medium text-lg">Your personalized program awaits.</p>
      </div>

      <div className="flex-1 space-y-4">
        {sections.map((s, i) => (
          <GlassCard 
            key={s.id} 
            active={s.status === 'completed'}
            className={cn(
              "p-6 flex items-center gap-6 cursor-pointer transition-all active:scale-[0.98]",
              s.locked && "opacity-30 pointer-events-none"
            )}
            onClick={() => !s.locked && updateOnboarding({ section: s.id as any })}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-black transition-colors",
              s.status === 'completed' ? "bg-black text-white" : "bg-black/5 text-zinc-400"
            )}>
              {s.status === 'completed' ? <Check size={20}/> : i + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl">{s.title}</h3>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{s.desc}</p>
            </div>
            {!s.locked && <ArrowRight className="text-zinc-300" />}
          </GlassCard>
        ))}
      </div>

      <PrimaryButton 
        onClick={handleMainAction}
        className="mt-8"
      >
        {getButtonText()}
      </PrimaryButton>
    </div>
  );
};