import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Dumbbell, Activity, Zap, History, Footprints, ChefHat, Target, User, Languages, Check, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { WheelPicker, WeightSlider } from './ui/Selectors';
import { CalorieGuide } from './CalorieGuide';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { setProfile, profile, updateTargetValue, calculatedTargets, confirmOnboarding } = useStore();
  const { lang } = useTranslation();

  const weightChangeInfo = useMemo(() => {
    const weekly = profile.speedKgsPerWeek;
    const monthly = weekly * 4.345;
    const weight = profile.weight || 70;
    const percentWeekly = (weekly / weight) * 100;
    return {
      weekly: weekly.toFixed(2),
      monthly: monthly.toFixed(2),
      percent: percentWeekly.toFixed(2)
    };
  }, [profile.speedKgsPerWeek, profile.weight]);

  const steps = [
    {
      id: 'name',
      title: lang === 'en' ? 'What is your name?' : 'Как вас зовут?',
      subtitle: lang === 'en' ? 'Let’s start with the basics' : 'Начнем с основ',
      component: (
        <div className="mt-8">
          <Input label="Name" value={profile.name} onChange={(v) => setProfile({ name: v })} placeholder="Alex..." />
        </div>
      )
    },
    {
      id: 'gender',
      title: lang === 'en' ? 'Biological Gender' : 'Биологический пол',
      subtitle: lang === 'en' ? 'Helps calculate base metabolism' : 'Помогает рассчитать базовый метаболизм',
      component: (
        <div className="grid grid-cols-2 gap-4 mt-8">
           {(['male', 'female'] as const).map(g => (
             <button 
               key={g}
               onClick={() => setProfile({ gender: g })}
               className={cn(
                 "p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4",
                 profile.gender === g ? "bg-white border-white shadow-xl text-black" : "bg-black/5 border-transparent text-black/40 hover:bg-black/10"
               )}
             >
               <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-3xl">
                  {g === 'male' ? '♂️' : '♀️'}
               </div>
               <span className="font-black uppercase tracking-widest text-xs">{g}</span>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'weight',
      title: lang === 'en' ? 'Current Weight' : 'Текущий вес',
      subtitle: lang === 'en' ? 'Swipe to set your current weight' : 'Используйте слайдер для выбора веса',
      component: (
        <div className="mt-12 text-zinc-950 font-display">
          <WeightSlider 
            label={lang === 'en' ? 'Current Weight (kg)' : 'Текущий вес (кг)'} 
            min={30} 
            max={250} 
            value={profile.weight} 
            onChange={(v) => setProfile({ weight: v })} 
            step={0.1}
            isDark={false}
          />
        </div>
      )
    },
    {
      id: 'targetWeight',
      title: lang === 'en' ? 'Target Weight' : 'Желаемый вес',
      subtitle: lang === 'en' ? 'Swipe to set your ideal target weight' : 'Используйте слайдер для выбора желаемого веса',
      component: (
        <div className="mt-12 text-zinc-950 font-display">
          <WeightSlider 
            label={lang === 'en' ? 'Target Weight (kg)' : 'Желаемый вес (кг)'} 
            min={30} 
            max={250} 
            value={profile.targetWeight || 70} 
            onChange={(v) => setProfile({ targetWeight: v })} 
            step={0.1}
            isDark={false}
          />
        </div>
      )
    },
    {
      id: 'weightChangeRate',
      title: lang === 'en' ? 'Weight Change Rate' : 'Скорость изменения веса',
      subtitle: lang === 'en' ? 'Choose your weekly pacing rate' : 'Выберите желаемую еженедельную скорость',
      component: (
        <div className="mt-12 space-y-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            {lang === 'en' ? 'Weekly Rate (grams / week)' : 'Скорость в неделю (грамм / нед)'}
          </label>
          <WheelPicker 
            options={[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]} 
            value={Math.round((profile.speedKgsPerWeek || 0.25) * 1000)} 
            onChange={(v) => setProfile({ speedKgsPerWeek: Number(v) / 1000 })} 
            height={180}
          />
          <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-black/5 flex items-center justify-between text-zinc-800 font-bold">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
              {lang === 'en' ? 'Monthly Target' : 'Цель в месяц'}
            </span>
            <span className="text-xl text-black">
              {Math.round((profile.speedKgsPerWeek || 0.25) * 1000 * 4.345)} {lang === 'en' ? 'grams/month' : 'грамм/мес'}
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'proteinIntake',
      title: lang === 'en' ? 'Protein Intake Target' : 'Норма потребления белка',
      subtitle: lang === 'en' ? 'Choose protein grams per 1 kg of body weight' : 'Выберите граммы белка на 1 кг массы тела',
      component: (
        <div className="mt-12 space-y-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            {lang === 'en' ? 'Protein Coefficient (g/kg)' : 'Коэффициент белка (г/кг)'}
          </label>
          <WheelPicker 
            options={[1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0]} 
            value={profile.proteinPerKg || 2.0} 
            onChange={(v) => setProfile({ proteinPerKg: Number(v) })} 
            height={180}
          />
          <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-black/5 flex flex-col gap-2">
             <div className="flex justify-between items-center text-zinc-800 font-bold">
               <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                 {lang === 'en' ? 'Calculated Daily Protein' : 'Рассчитанный суточный белок'}
               </span>
               <span className="text-xl text-black font-display font-black">
                 {Math.round((profile.weight || 70) * (profile.proteinPerKg || 2.0))}g
               </span>
             </div>
             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">
               {lang === 'en' 
                 ? 'Active: 1.6–2.2 g/kg. Strength athletes: 2.0–2.4 g/kg.' 
                 : 'Активный образ жизни: 1.6–2.2 г/кг. Силовые тренировки: 2.0–2.4 г/кг.'}
             </p>
          </div>
        </div>
      )
    },
    {
      id: 'height',
      title: lang === 'en' ? 'Height' : 'Рост',
      subtitle: lang === 'en' ? 'Your stature affects BMR' : 'Ваш рост влияет на BMR',
      component: (
        <div className="mt-12 space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Height (cm)</label>
           <WheelPicker 
             options={Array.from({ length: 151 }, (_, i) => i + 100)} 
             value={profile.height} 
             onChange={(v) => setProfile({ height: Number(v) })} 
             height={180}
           />
        </div>
      )
    },
    {
      id: 'birthDate',
      title: lang === 'en' ? 'Date of Birth' : 'Дата рождения',
      subtitle: lang === 'en' ? 'Age is a factor in metabolism' : 'Возраст — важный фактор метаболизма',
      component: (
        <div className="mt-8 flex flex-col gap-10">
           <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">Day</label>
                 <WheelPicker 
                   options={Array.from({ length: 31 }, (_, i) => i + 1)} 
                   value={profile.birthDate ? new Date(profile.birthDate).getDate() : 1} 
                   onChange={(d) => {
                      const current = profile.birthDate ? new Date(profile.birthDate) : new Date();
                      current.setDate(Number(d));
                      setProfile({ birthDate: current.toISOString().split('T')[0] });
                   }}
                   height={160}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">Month</label>
                 <WheelPicker 
                   options={Array.from({ length: 12 }, (_, i) => i + 1)} 
                   value={profile.birthDate ? new Date(profile.birthDate).getMonth() + 1 : 1} 
                   onChange={(m) => {
                      const current = profile.birthDate ? new Date(profile.birthDate) : new Date();
                      current.setMonth(Number(m) - 1);
                      setProfile({ birthDate: current.toISOString().split('T')[0] });
                   }}
                   height={160}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">Year</label>
                 <WheelPicker 
                   options={Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 15 - i)} 
                   value={profile.birthDate ? new Date(profile.birthDate).getFullYear() : new Date().getFullYear() - 25} 
                   onChange={(y) => {
                      const current = profile.birthDate ? new Date(profile.birthDate) : new Date();
                      current.setFullYear(Number(y));
                      setProfile({ birthDate: current.toISOString().split('T')[0] });
                   }}
                   height={160}
                 />
              </div>
           </div>
           <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-black/5 flex items-center justify-between">
              <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Calculated Age</span>
              <span className="text-3xl font-display font-black text-black">{profile.age}</span>
           </div>
        </div>
      )
    },
    {
      id: 'bodyFat',
      title: lang === 'en' ? 'Body Fat %' : 'Процент жира',
      subtitle: lang === 'en' ? 'Helps estimate metabolic health' : 'Помогает оценить метаболическое здоровье',
      component: (
        <div className="grid grid-cols-2 gap-3 mt-8">
           {[
             { min: 3, max: 5, label: '3–5%' },
             { min: 5, max: 8, label: '5–8%' },
             { min: 8, max: 12, label: '8–12%' },
             { min: 13, max: 17, label: '13–17%' },
             { min: 18, max: 23, label: '18–23%' },
             { min: 24, max: 29, label: '24–29%' },
             { min: 30, max: 34, label: '30–34%' },
             { min: 35, max: 39, label: '35–39%' },
             { min: 40, max: 100, label: '40%+' },
           ].map(range => (
             <button 
               key={range.label}
               onClick={() => setProfile({ bodyFat: (range.min + (range.max === 100 ? range.min : range.max)) / 2 })}
               className={cn(
                 "p-5 rounded-[1.5rem] border-2 transition-all text-center",
                 profile.bodyFat >= range.min && profile.bodyFat < (range.max === 100 ? 101 : range.max + 1) ? "bg-white border-white shadow-lg text-black" : "bg-black/5 border-transparent text-zinc-400 hover:bg-black/10"
               )}
             >
               <span className="font-black text-lg">{range.label}</span>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'training-type',
      title: lang === 'en' ? 'Training Type' : 'Тип тренировок',
      subtitle: lang === 'en' ? 'Choose your primary activity' : 'Выберите основную активность',
      component: (
        <div className="grid gap-3 mt-8">
           {[
             { id: 'gym', label: 'Gym / Iron', icon: <Dumbbell /> },
             { id: 'calisthenics', label: 'Bodyweight', icon: <Activity /> },
             { id: 'mixed', label: 'Mixed / Crossfit', icon: <Zap /> },
             { id: 'none', label: 'No Training', icon: <History /> },
           ].map(t => (
             <button 
               key={t.id}
               onClick={() => setProfile({ trainingType: t.id as any })}
               className={cn(
                 "p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6",
                 profile.trainingType === t.id ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60 hover:opacity-100"
               )}
             >
               <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                  {t.icon}
               </div>
               <span className="font-black text-lg text-black">{t.label}</span>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'training-freq',
      title: lang === 'en' ? 'Sessions per Week' : 'Частота тренировок',
      subtitle: lang === 'en' ? 'How many times do you train?' : 'Сколько раз в неделю вы тренируетесь?',
      component: (
        <div className="mt-12">
           <WheelPicker 
             options={[0, 1, 2, 3, 4, 5, 6, 7]} 
             value={profile.trainingFrequency || 0} 
             onChange={(v) => setProfile({ trainingFrequency: Number(v) })} 
             height={200}
           />
        </div>
      )
    },
    {
      id: 'cardio',
      title: lang === 'en' ? 'Do you do cardio?' : 'Есть ли кардио?',
      subtitle: lang === 'en' ? 'Extra activity burns more' : 'Дополнительная активность сжигает больше',
      component: (
        <div className="grid gap-4 mt-8">
           <button 
             onClick={() => setProfile({ hasCardio: true })}
             className={cn(
               "p-8 rounded-[2rem] border-2 transition-all text-left",
               profile.hasCardio ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
             )}
           >
             <h4 className="font-black text-xl mb-1">Yes, I do cardio</h4>
             <p className="text-sm opacity-60">Running, swimming, cycling, etc.</p>
           </button>
           <button 
             onClick={() => setProfile({ hasCardio: false, cardioFrequency: 0 })}
             className={cn(
               "p-8 rounded-[2rem] border-2 transition-all text-left",
               !profile.hasCardio ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
             )}
           >
             <h4 className="font-black text-xl mb-1">No, only strength</h4>
             <p className="text-sm opacity-60">I focus on resistance only.</p>
           </button>
           
           {profile.hasCardio && (
             <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 block text-center">Sessions per week</label>
                <WheelPicker 
                  options={[1, 2, 3, 4, 5, 6, 7]} 
                  value={profile.cardioFrequency || 3} 
                  onChange={(v) => setProfile({ cardioFrequency: Number(v) })} 
                  height={120}
                />
             </div>
           )}
        </div>
      )
    },
    {
      id: 'experience',
      title: lang === 'en' ? 'Training Experience' : 'Опыт тренировок',
      subtitle: lang === 'en' ? 'Muscle mass affects metabolism' : 'Мышечная масса влияет на метаболизм',
      component: (
        <div className="grid gap-4 mt-8">
           {[
             { id: 'beginner', label: 'Beginner', desc: '< 1 Year Experience' },
             { id: 'intermediate', label: 'Intermediate', desc: '1–4 Years Experience' },
             { id: 'advanced', label: 'Advanced', desc: '4+ Years Experience' },
           ].map(exp => (
             <button 
               key={exp.id}
               onClick={() => setProfile({ experienceLevel: exp.id as any })}
               className={cn(
                 "p-6 rounded-[2rem] border-2 transition-all text-left",
                 profile.experienceLevel === exp.id ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
               )}
             >
               <h4 className="font-black text-xl mb-1">{exp.label}</h4>
               <p className="text-xs opacity-50 uppercase font-bold tracking-widest">{exp.desc}</p>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'steps',
      title: lang === 'en' ? 'Daily Steps' : 'Шаги в день',
      subtitle: lang === 'en' ? 'Your general lifestyle activity' : 'Ваш общий уровень активности',
      component: (
        <div className="grid gap-3 mt-8">
           {[
             { id: '<5000', label: 'Sedentary', desc: '< 5,000 steps' },
             { id: '5000-10000', label: 'Moderate', desc: '5,000 – 10,000 steps' },
             { id: '10000-15000', label: 'Active', desc: '10,000 – 15,000 steps' },
             { id: '15000+', label: 'Very Active', desc: '15,000+ steps' },
           ].map(s => (
             <button 
               key={s.id}
               onClick={() => setProfile({ stepsRange: s.id as any })}
               className={cn(
                 "p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between group",
                 profile.stepsRange === s.id ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
               )}
             >
               <div>
                  <h4 className="font-black text-xl mb-1 text-black">{s.label}</h4>
                  <p className="text-xs opacity-50 font-bold">{s.desc}</p>
               </div>
               <Footprints size={24} className={cn("transition-all", profile.stepsRange === s.id ? "text-primary-500 scale-125" : "text-black/10")} />
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'lifestyle',
      title: lang === 'en' ? 'Lifestyle' : 'Образ жизни',
      subtitle: lang === 'en' ? 'Your non-exercise activity' : 'Ваша внетренировочная активность',
      component: (
        <div className="grid gap-4 mt-8">
           {[
             { id: 'sedentary', label: 'Sedentary', desc: 'Office work, little movement' },
             { id: 'active', label: 'Active', desc: 'On your feet, light manual work' },
             { id: 'very active', label: 'Very Active', desc: 'Heavy manual labor, many steps' },
           ].map(l => (
             <button 
               key={l.id}
               onClick={() => setProfile({ lifestyle: l.id as any })}
               className={cn(
                 "p-6 rounded-[2rem] border-2 transition-all text-left",
                 profile.lifestyle === l.id ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
               )}
             >
               <h4 className="font-black text-xl mb-1">{l.label}</h4>
               <p className="text-xs opacity-50 uppercase font-bold tracking-widest">{l.desc}</p>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'goal',
      title: lang === 'en' ? 'What is your Goal?' : 'Какая ваша цель?',
      subtitle: lang === 'en' ? 'Lose weight, maintain, or gain' : 'Похудение, поддержка или набор',
      component: (
        <div className="grid gap-4 mt-8">
           {[
             { id: 'lose', label: 'Lose Fat', desc: 'Sustainable fat loss' },
             { id: 'maintain', label: 'Maintenance', desc: 'Stay at current weight' },
             { id: 'gain', label: 'Gain Muscle', desc: 'Building strength & size' },
           ].map(g => (
             <button 
               key={g.id}
               onClick={() => setProfile({ goal: g.id as any })}
               className={cn(
                 "p-8 rounded-[2.5rem] border-2 transition-all text-left",
                 profile.goal === g.id ? "bg-white border-white shadow-xl" : "bg-black/5 border-transparent opacity-60"
               )}
             >
               <h4 className="font-black text-2xl mb-1">{g.label}</h4>
               <p className="text-sm opacity-60">{g.desc}</p>
             </button>
           ))}
        </div>
      )
    },
    {
      id: 'summary',
      title: lang === 'en' ? 'Your Profile' : 'Ваш профиль',
      subtitle: lang === 'en' ? 'Metabolic summary & recommendations' : 'Метаболическое резюме и рекомендации',
      component: (
        <div className="mt-8 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-zinc-50 rounded-[2rem] border border-black/5">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance</span>
                 <div className="text-3xl font-display font-black mt-2 text-black">{calculatedTargets.tdee}</div>
                 <span className="text-[10px] font-bold text-zinc-400">kcal / day</span>
              </div>
              <div className="p-6 bg-primary-50 rounded-[2rem] border border-primary-100 shadow-sm">
                 <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Goal Target</span>
                 <div className="text-3xl font-display font-black mt-2 text-primary-900">{calculatedTargets.calories}</div>
                 <span className="text-[10px] font-bold text-primary-600">kcal / day</span>
              </div>
           </div>

           <div className="p-8 bg-zinc-900 rounded-[2.5rem] shadow-2xl space-y-8">
              <div className="flex justify-between items-center bg-zinc-800 p-1 rounded-xl">
                 {(['percent', 'grams'] as const).map(m => (
                    <button 
                      key={m}
                      onClick={() => setProfile({ manualMacroTargets: { ...profile.manualMacroTargets, mode: m } })}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        profile.manualMacroTargets.mode === m ? "bg-white text-black shadow-md" : "text-white/40"
                      )}
                    >
                      {m}
                    </button>
                 ))}
              </div>

              <WeightSlider label="Intake Adjustment" min={1000} max={5000} value={calculatedTargets.calories} onChange={(v) => updateTargetValue('calories', v)} unit="kcal" />
              
              <div className="grid grid-cols-3 gap-6">
                 {[
                   { id: 'protein', label: 'Protein', value: calculatedTargets.protein, color: 'text-blue-400' },
                   { id: 'fat', label: 'Fats', value: calculatedTargets.fat, color: 'text-rose-400' },
                   { id: 'carbs', label: 'Carbs', value: calculatedTargets.carbs, color: 'text-amber-400' },
                 ].map(m => (
                   <div key={m.id} className="space-y-2 text-center">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">{m.label}</label>
                      <input 
                        type="number"
                        value={profile.manualMacroTargets.mode === 'percent' 
                          ? Math.round((m.value * (m.id === 'fat' ? 9 : 4) / calculatedTargets.calories) * 100) 
                          : Math.round(m.value)
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (profile.manualMacroTargets.mode === 'percent') {
                             const grams = (calculatedTargets.calories * (val / 100)) / (m.id === 'fat' ? 9 : 4);
                             updateTargetValue(m.id as any, grams);
                          } else {
                             updateTargetValue(m.id as any, val);
                          }
                        }}
                        className={cn("w-full bg-transparent font-display font-black text-xl outline-none text-center", m.color)}
                      />
                      <span className="text-[10px] font-bold text-zinc-600 block">
                         {profile.manualMacroTargets.mode === 'percent' ? '%' : 'g'}
                      </span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      await confirmOnboarding();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col p-8 max-w-lg mx-auto relative overflow-hidden text-black">
      <CalorieGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
      {/* Header exactly like reference */}
      <div className="flex flex-col mb-12 relative z-10">
        <div className="flex items-center justify-between mb-4 h-10 px-0">
          <button 
            onClick={handlePrev} 
            className={cn("p-2 -ml-2 transition-colors", step > 0 ? "text-black" : "text-transparent pointer-events-none")}
          >
            <ChevronDown className="rotate-90" size={24} />
          </button>
          <div className="text-sm font-black tracking-tight text-zinc-400 uppercase tracking-widest">Assessment</div>
          <div className="w-10" />
        </div>
        <div className="h-[3px] bg-black/5 w-full overflow-hidden rounded-full font-black">
           <motion.div 
             initial={false}
             animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
             className="h-full bg-black rounded-full"
             transition={{ duration: 0.5 }}
           />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[2.2rem] font-display font-black text-black leading-[1.1] tracking-tight">
              {steps[step].title}
            </h1>
            <p className="text-zinc-500 mt-3 text-lg font-medium leading-[1.4]">
              {steps[step].subtitle}
            </p>
            
            <div className="flex-1 mt-6">
               {steps[step].component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-8 pt-10 relative z-10">
        <button
          onClick={handleNext}
          className="w-full bg-black text-white rounded-[1.2rem] py-6 px-10 font-black flex items-center justify-center transition-all active:scale-[0.97] shadow-xl shadow-black/10"
        >
          <span className="text-xl tracking-tight uppercase tracking-widest">{step === steps.length - 1 ? 'Finish' : 'Continue'}</span>
        </button>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string, value: any, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col">
    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">{label}</label>
    <input 
      type={type} 
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-6 text-lg rounded-[1rem] bg-white border border-zinc-200 text-black shadow-sm focus:border-black outline-none font-black transition-all h-[76px]"
    />
  </div>
);

const CalorieCard: React.FC<{ label: string, value: number, desc: string, color: string, bg: string, isHighlight?: boolean, onChange?: (v: number) => void }> = ({ label, value, desc, color, bg, isHighlight, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  React.useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all relative overflow-hidden", 
      isHighlight ? "bg-white border-white" : "bg-black/5 border-transparent"
    )}>
       <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
          <div className={cn("flex flex-col items-end", isHighlight ? "text-black" : color)}>
             {isEditing ? (
               <input 
                 autoFocus
                 type="number"
                 value={val}
                 onChange={(e) => setVal(Number(e.target.value))}
                 onBlur={() => {
                   setIsEditing(false);
                   onChange?.(val);
                 }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     setIsEditing(false);
                     onChange?.(val);
                   }
                 }}
                 className="w-24 bg-black/5 border-none outline-none font-display font-black text-2xl text-right rounded-lg px-2"
               />
             ) : (
               <div 
                 onClick={() => onChange && setIsEditing(true)}
                 className="text-2xl font-display font-black cursor-pointer px-2 rounded-lg transition-colors"
                >
                  {value}
                </div>
             )}
             <span className="text-[10px] uppercase font-bold text-zinc-500 pr-2">kcal</span>
          </div>
       </div>
       <p className={cn("text-[11px] font-medium leading-relaxed pr-8", isHighlight ? "text-zinc-500" : "text-zinc-400")}>{desc}</p>
    </div>
  );
};
