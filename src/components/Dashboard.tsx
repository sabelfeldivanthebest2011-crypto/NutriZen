import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Target, TrendingUp, AlertCircle, Droplets, Info, ChevronDown, ChevronUp, BookOpen, Utensils, Languages } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { NutritionBasics } from './NutritionBasics';
import { WeightMiniBook } from './WeightMiniBook';
import { CalorieGuide } from './CalorieGuide';

interface CircularProgressProps {
  value: number;
  total: number;
  color: string;
  label: string;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, total, color, label, size = 180, strokeWidth = 14 }) => {
  const percentage = Math.min((value / total) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const diff = total - value;
  const isOver = diff < 0;
  const { t } = useTranslation();

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? "#f43f5e" : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          fill="transparent"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-3xl font-display font-bold tracking-tight", isOver && "text-rose-600")}>
          {Math.abs(Math.round(diff))}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
          {isOver ? t('dashboard.calories_over') : t('dashboard.calories_left')}
        </span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const { profile, calculatedTargets, setProfile, activeDashboardTab, setActiveDashboardTab } = useStore();
  const { t, lang } = useTranslation();
  const [showMicros, setShowMicros] = useState(false);
  const [isCalorieGuideOpen, setIsCalorieGuideOpen] = useState(false);
  
  const todayLogs = useLiveQuery(
    () => db.logs.where('timestamp').between(startOfDay(new Date()).getTime(), endOfDay(new Date()).getTime()).toArray()
  );

  const totals = useMemo(() => {
    const base = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, cholesterol: 0, b12: 0, calcium: 0, zinc: 0, vitD: 0, magnesium: 0, iron: 0, potassium: 0 };
    if (!todayLogs) return base;
    return (todayLogs as any[]).reduce((acc, log) => {
      const nuts = log.nutrients || {
        calories: (log.calories || 0) * ((log.amount || 100) / 100),
        protein: (log.protein || 0) * ((log.amount || 100) / 100),
        carbs: (log.carbs || 0) * ((log.amount || 100) / 100),
        fat: (log.fat || 0) * ((log.amount || 100) / 100),
        fiber: (log.fiber || 0) * ((log.amount || 100) / 100),
        sugar: (log.sugar || 0) * ((log.amount || 100) / 100),
        cholesterol_mg: (log.cholesterol || 0) * ((log.amount || 100) / 100),
        vitamin_b12_mcg: (log.b12 || 0) * ((log.amount || 100) / 100),
        calcium_mg: (log.calcium || 0) * ((log.amount || 100) / 100),
        zinc_mg: (log.zinc || 0) * ((log.amount || 100) / 100),
        vitamin_d_mcg: (log.vitD || 0) * ((log.amount || 100) / 100),
        magnesium_mg: (log.magnesium || 0) * ((log.amount || 100) / 100),
        iron_mg: (log.iron || 0) * ((log.amount || 100) / 100),
        potassium_mg: (log.potassium || 0) * ((log.amount || 100) / 100),
      };
      return {
        calories: acc.calories + (nuts.calories || 0),
        protein: acc.protein + (nuts.protein || 0),
        carbs: acc.carbs + (nuts.carbs || 0),
        fat: acc.fat + (nuts.fat || 0),
        fiber: acc.fiber + (nuts.fiber || 0),
        sugar: acc.sugar + (nuts.sugar || 0),
        cholesterol: acc.cholesterol + (nuts.cholesterol_mg || 0),
        b12: acc.b12 + (nuts.vitamin_b12_mcg || 0),
        calcium: acc.calcium + (nuts.calcium_mg || 0),
        zinc: acc.zinc + (nuts.zinc_mg || 0),
        vitD: acc.vitD + (nuts.vitamin_d_mcg || 0),
        magnesium: acc.magnesium + (nuts.magnesium_mg || 0),
        iron: acc.iron + (nuts.iron_mg || 0),
        potassium: acc.potassium + (nuts.potassium_mg || 0),
      };
    }, base);
  }, [todayLogs]);

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return t('dashboard.greeting_morning');
    if (hours < 18) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  }, [t]);

  const microsList = [
    { label: 'Potassium', key: 'potassium', unit: 'mg', target: 3500 },
    { label: 'Calcium', key: 'calcium', unit: 'mg', target: 1000 },
    { label: 'Iron', key: 'iron', unit: 'mg', target: 18 },
    { label: 'Magnesium', key: 'magnesium', unit: 'mg', target: 400 },
    { label: 'Zinc', key: 'zinc', unit: 'mg', target: 11 },
    { label: 'Vitamin D', key: 'vitD', unit: 'mcg', target: 15 },
    { label: 'Vitamin B12', key: 'b12', unit: 'mcg', target: 2.4 },
    { label: 'Cholesterol', key: 'cholesterol', unit: 'mg', target: 300 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Navigation Bar */}
      <nav className="glass sticky top-0 z-30 p-2 rounded-2xl flex items-center justify-between shadow-lg border-white/50 backdrop-blur-xl">
        <div className="flex bg-gray-100/50 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setActiveDashboardTab('nutrition')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeDashboardTab === 'nutrition' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            )}
          >
            <Utensils size={14} />
            {t('tabs.nutrition')}
          </button>
          <button 
            onClick={() => setActiveDashboardTab('education')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeDashboardTab === 'education' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            )}
          >
            <BookOpen size={14} />
            {t('tabs.education')}
          </button>
        </div>

        <button 
          onClick={() => setProfile({ language: lang === 'en' ? 'ru' : 'en' })}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Languages size={18} className="text-primary-600" />
        </button>
      </nav>

      <AnimatePresence mode="wait">
        <CalorieGuide isOpen={isCalorieGuideOpen} onClose={() => setIsCalorieGuideOpen(false)} />
        {activeDashboardTab === 'nutrition' ? (
          <motion.div 
            key="nutrition"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <header className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-gray-400 text-sm font-medium">{greeting}</h2>
                <h1 className="text-2xl font-display font-black text-gray-900">{profile.name || 'Champion'}!</h1>
              </div>
              <div className="w-12 h-12 rounded-[1.5rem] bg-primary-100 flex items-center justify-center shadow-inner">
                <Zap className="text-primary-600 fill-primary-600" size={24} />
              </div>
            </header>

            {/* Main Stats Card */}
            <section className="glass rounded-[3rem] p-8 flex flex-col items-center shadow-xl relative overflow-hidden group border-white/40">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100/30 rounded-full blur-[64px] opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <CircularProgress 
                value={totals.calories} 
                total={calculatedTargets.calories} 
                color="#22c55e" 
                label="kcal"
                size={220}
                strokeWidth={16}
              />
              
              <div className="grid grid-cols-3 w-full gap-4 mt-8">
                <MacroPill 
                  label={t('dashboard.protein')} 
                  value={totals.protein} 
                  target={calculatedTargets.protein} 
                  color="bg-blue-500" 
                  unit="g"
                />
                <MacroPill 
                  label={t('dashboard.carbs')} 
                  value={totals.carbs} 
                  target={calculatedTargets.carbs} 
                  color="bg-amber-500" 
                  unit="g"
                />
                <MacroPill 
                  label={t('dashboard.fat')} 
                  value={totals.fat} 
                  target={calculatedTargets.fat} 
                  color="bg-rose-500" 
                  unit="g"
                />
              </div>
            </section>

            {/* Mini Progress Bars for Fiber/Sugar */}
            <section className="grid grid-cols-2 gap-4">
              <MiniGoalCard 
                label={t('dashboard.fiber')}
                value={totals.fiber}
                target={calculatedTargets.fiber}
                color="text-emerald-600"
                bg="bg-emerald-50"
                barColor="bg-emerald-500"
              />
              <MiniGoalCard 
                label={t('dashboard.sugar')}
                value={totals.sugar}
                target={calculatedTargets.sugar}
                color="text-rose-600"
                bg="bg-rose-50"
                barColor="bg-rose-500"
                reversed
              />
            </section>

            {/* Micronutrients Expandable */}
            <section className="glass rounded-[2rem] border-white/50 overflow-hidden shadow-sm">
              <button 
                onClick={() => setShowMicros(!showMicros)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Target size={18} />
                  </div>
                  <span className="font-bold text-sm">{t('dashboard.micros')}</span>
                </div>
                {showMicros ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <AnimatePresence>
                {showMicros && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 grid grid-cols-2 gap-3"
                  >
                    {microsList.map(micro => (
                      <MicroItem 
                        key={micro.key}
                        label={micro.label}
                        value={(totals as any)[micro.key]}
                        target={micro.target}
                        unit={micro.unit}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Daily Intelligence */}
            <section className="space-y-4">
              <h3 className="font-display font-black text-lg px-2 text-gray-900 tracking-tight">Daily Intelligence</h3>
              <RecommendationItem 
                type="info"
                title={t('analytics.weight_trend') || 'Trend Analysis'}
                desc={t('analytics.weight_change_desc')}
              />
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="education"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <section className="grid gap-4">
              <button 
                onClick={() => onNavigate?.('basics')}
                className="glass p-6 rounded-[2.5rem] text-left border-white/60 shadow-lg flex items-center justify-between group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-primary-100 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">🧠</div>
                   <div>
                      <h4 className="font-display font-black text-lg text-gray-900 leading-tight">{t('education.basics.title')}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">{t('education.basics.desc')}</p>
                   </div>
                </div>
                <TrendingUp size={20} className="text-primary-600 opacity-20 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => onNavigate?.('weight-progress')}
                className="glass p-6 rounded-[2.5rem] text-left border-white/60 shadow-lg flex items-center justify-between group transition-all active:scale-[0.98]"
              >
                 <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-blue-100 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">⚖️</div>
                   <div>
                      <h4 className="font-display font-black text-lg text-gray-900 leading-tight">{t('education.weight.title')}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">{t('education.weight.desc')}</p>
                   </div>
                </div>
                <Droplets size={20} className="text-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => setIsCalorieGuideOpen(true)}
                className="bg-zinc-900 rounded-[2.5rem] p-8 text-left shadow-2xl flex items-center justify-between group transition-all active:scale-[0.98] border border-white/5 relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] group-hover:bg-amber-500/20 transition-all" />
                 <div className="relative z-10 flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-transform border border-white/10">⚡</div>
                   <div>
                      <h4 className="font-display font-black text-xl text-white tracking-tight leading-tight">{lang === 'en' ? 'Energy Balance' : 'Баланс энергии'}</h4>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1.5">{lang === 'en' ? 'THE CALORIE REVOLUTION' : 'РЕВОЛЮЦИЯ КАЛОРИЙ'}</p>
                   </div>
                </div>
                <Zap size={20} className="text-amber-500 relative z-10" />
              </button>
            </section>

            <section className="p-8 bg-zinc-950 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px]" />
              <h3 className="text-xl font-display font-black flex items-center gap-2 relative z-10">
                <Info className="text-primary-500" /> {lang === 'en' ? 'How to use NutriZen' : 'Как пользоваться NutriZen'}
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  { en: 'Type product in search', ru: 'Введите продукт в поиск' },
                  { en: 'Use Enter for advanced mode', ru: 'Используйте Enter для открытия расширенного режима' },
                  { en: 'Add products to diary', ru: 'Добавляйте продукты в дневник питания' },
                  { en: 'Create custom products', ru: 'Создавайте собственные продукты' },
                  { en: 'Create recipes', ru: 'Создавайте рецепты из продуктов' },
                  { en: 'Scan barcodes', ru: 'Сканируйте продукты через камеру' },
                  { en: 'Export to save data', ru: 'Используйте экспорт для сохранения данных' },
                  { en: 'Share recipes as text', ru: 'Копируйте рецепты как текст для обмена' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-400 font-medium font-sans">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white flex-shrink-0">{i+1}</div>
                    {lang === 'en' ? item.en : item.ru}
                  </li>
                ))}
              </ul>
            </section>

            <div className="p-8 bg-gray-900 rounded-[3rem] text-white space-y-4">
               <h3 className="text-xl font-display font-black flex items-center gap-2">
                  <Info className="text-primary-500" /> NutritiZone Academy
               </h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                  Learn how to master your body composition. We simplify complex physiological processes into actionable knowledge.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MicroItem: React.FC<{ label: string, value: number, target: number, unit: string }> = ({ label, value, target, unit }) => (
  <div className="p-3 bg-white/50 rounded-2xl border border-white/40">
    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{label}</div>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-sm font-black text-gray-900">{Math.round(value)}</span>
      <span className="text-[10px] text-gray-400">{unit}</span>
    </div>
    <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
      <div className="h-full bg-purple-500" style={{ width: `${Math.min((value/target)*100, 100)}%` }} />
    </div>
  </div>
);

const MiniGoalCard: React.FC<{ label: string, value: number, target: number, color: string, bg: string, barColor: string, reversed?: boolean }> = ({ label, value, target, color, bg, barColor, reversed }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const isOver = value > target;
  
  return (
    <div className={cn("p-5 rounded-[2rem] border border-white/50 shadow-sm", bg)}>
       <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
          <span className={cn("text-xs font-black", color)}>{Math.round(value)}/{target}g</span>
       </div>
       <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn("h-full", reversed && isOver ? "bg-rose-500" : barColor)}
          />
       </div>
    </div>
  );
};

const MacroPill: React.FC<{ label: string, value: number, target: number, color: string, unit: string }> = ({ label, value, target, color, unit }) => {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-1.5 bg-gray-100/50 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full shadow-sm", color)}
        />
      </div>
      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</span>
      <span className="text-sm font-black text-gray-900">{Math.round(value)}<span className="text-gray-400 font-normal text-[10px] ml-0.5">{unit}</span></span>
    </div>
  );
};

const RecommendationItem: React.FC<{ type: 'info' | 'warning', title: string, desc: string }> = ({ type, title, desc }) => (
  <div className={cn(
    "p-5 rounded-[2.5rem] border flex gap-4 transition-all hover:scale-[1.02] cursor-pointer group",
    type === 'info' ? "bg-white/50 border-white/50 shadow-sm" : "bg-rose-50/50 border-rose-100 shadow-sm"
  )}>
    <div className={cn(
      "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110",
      type === 'info' ? "bg-primary-100 text-primary-600" : "bg-rose-100 text-rose-600"
    )}>
      {type === 'info' ? <Zap size={20} fill="currentColor" /> : <AlertCircle size={20} />}
    </div>
    <div>
      <h4 className="font-display font-black text-sm text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const KnowledgeCard: React.FC<{ title: string, desc: string, icon: React.ReactNode, color: string, onClick?: () => void }> = ({ title, desc, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={cn("p-5 rounded-[2rem] border-transparent shadow-sm flex flex-col justify-between min-w-[160px] h-40 text-left transition-all active:scale-[0.98] active:shadow-inner", color)}
  >
    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <h4 className="font-display font-bold text-sm leading-tight">{title}</h4>
      <p className="text-[10px] text-gray-500 font-medium mt-1">{desc}</p>
    </div>
  </button>
);



const StatCard: React.FC<{ icon: React.ReactNode, label: string, val: string, unit: string, progress: number }> = ({ icon, label, val, unit, progress }) => (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex flex-col justify-between h-32">
    <div className="flex justify-between items-start">
      <div className="p-2 rounded-xl bg-gray-50">{icon}</div>
      <div className="text-right">
        <div className="text-xl font-display font-bold">{val}<span className="text-xs text-gray-400 font-normal ml-0.5">{unit}</span></div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</div>
      </div>
    </div>
    <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
      <div className="h-full bg-gray-200" style={{ width: `${progress}%` }} />
    </div>
  </div>
);


