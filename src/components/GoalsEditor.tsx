import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, Save, Info, Percent, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../lib/useTranslation';

export const GoalsEditor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { profile, setProfile, calculatedTargets, updateTargetValue, adaptiveTDEE } = useStore();
  const { t } = useTranslation();
  const [useManual, setUseManual] = useState(profile.useManualMacros || false);
  const [activeTab, setActiveTab] = useState<'calories' | 'macros'>('calories');
  const [mode, setMode] = useState<'grams' | 'percent'>(profile.manualMacroTargets?.mode || 'percent');
  const [targets, setTargets] = useState(profile.manualMacroTargets || {
    mode: 'percent' as const,
    protein: 25,
    carbs: 50,
    fat: 25,
    fiber: 25,
    sugar: 50
  });

  const sum = targets.protein + targets.carbs + targets.fat;
  const isPercentError = mode === 'percent' && sum !== 100;

  const handleSave = () => {
    if (useManual && isPercentError) return;
    
    setProfile({
      useManualMacros: useManual,
      manualMacroTargets: {
        ...targets,
        mode
      }
    });
    onBack();
  };

  const updateTarget = (key: keyof typeof targets, val: number) => {
    setTargets(prev => ({ ...prev, [key]: val }));
    if (useManual) {
      updateTargetValue(key as any, val);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-display font-black tracking-tight">{t('profile.goals')}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={useManual && isPercentError}
          className={cn(
            "p-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50",
            (useManual && isPercentError) ? "bg-gray-300" : "bg-gray-900 text-white"
          )}
        >
          <Save size={20} />
        </button>
      </header>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-gray-100 shadow-sm mb-6">
           <button 
            onClick={() => setActiveTab('calories')}
            className={cn(
              "flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'calories' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400"
            )}
           >
             Calories
           </button>
           <button 
            onClick={() => setActiveTab('macros')}
            className={cn(
              "flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'macros' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400"
            )}
           >
             Macros
           </button>
        </div>

        {activeTab === 'calories' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                <div>
                   <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">Main Targets</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scientific Baseline</p>
                </div>
                
                <div className="space-y-6">
                   <TargetInput 
                    label="Current Maintenance (TDEE)" 
                    value={calculatedTargets.tdee} 
                    onChange={(v) => updateTargetValue('tdee', v)} 
                    unit="kcal" 
                    color="text-primary-600"
                   />
                   <TargetInput 
                    label="Goal Daily Calories" 
                    value={calculatedTargets.calories} 
                    onChange={(v) => updateTargetValue('calories', v)} 
                    unit="kcal" 
                    color="text-primary-600" 
                    highlight
                   />
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                <div>
                   <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">Daily Micro Targets</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Health Optimization</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <TargetInput label="Fiber" value={calculatedTargets.fiber} onChange={(v) => updateTargetValue('fiber', v)} unit="g" color="text-green-600" />
                   <TargetInput label="Sugar (Max)" value={calculatedTargets.sugar} onChange={(v) => updateTargetValue('sugar', v)} unit="g" color="text-rose-400" />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'macros' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-gray-900 tracking-tight">Manual Macro Override</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Detailed gram control</p>
                </div>
                <button 
                  onClick={() => setUseManual(!useManual)}
                  className={cn(
                    "w-14 h-8 rounded-full relative transition-all duration-300 p-1",
                    useManual ? "bg-gray-900" : "bg-gray-100"
                  )}
                >
                  <div className={cn("w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300", useManual ? "translate-x-6" : "translate-x-0")} />
                </button>
              </div>

              <AnimatePresence>
                {useManual ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-8 pt-6 border-t border-gray-50 overflow-hidden"
                  >
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      <button 
                        onClick={() => setMode('percent')}
                        className={cn(
                          "flex-1 py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                          mode === 'percent' ? "bg-white shadow-md text-primary-600" : "text-gray-400"
                        )}
                      >
                        <Percent size={14} /> {t('macro_editor.mode_percent')}
                      </button>
                      <button 
                        onClick={() => setMode('grams')}
                        className={cn(
                          "flex-1 py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                          mode === 'grams' ? "bg-white shadow-md text-primary-600" : "text-gray-400"
                        )}
                      >
                        <Database size={14} /> {t('macro_editor.mode_grams')}
                      </button>
                    </div>

                    <div className="grid gap-6">
                      <MacroInput 
                        label={t('dashboard.protein')} 
                        value={targets.protein} 
                        calculatedGrams={mode === 'percent' ? Math.round((calculatedTargets.calories * (targets.protein / 100)) / 4) : undefined}
                        onChange={v => updateTarget('protein', v)} 
                        unit={mode === 'percent' ? '%' : 'g'} 
                        color="text-blue-600" 
                      />
                      <MacroInput 
                        label={t('dashboard.carbs')} 
                        value={targets.carbs} 
                        calculatedGrams={mode === 'percent' ? Math.round((calculatedTargets.calories * (targets.carbs / 100)) / 4) : undefined}
                        onChange={v => updateTarget('carbs', v)} 
                        unit={mode === 'percent' ? '%' : 'g'} 
                        color="text-amber-600" 
                      />
                      <MacroInput 
                        label={t('dashboard.fat')} 
                        value={targets.fat} 
                        calculatedGrams={mode === 'percent' ? Math.round((calculatedTargets.calories * (targets.fat / 100)) / 9) : undefined}
                        onChange={v => updateTarget('fat', v)} 
                        unit={mode === 'percent' ? '%' : 'g'} 
                        color="text-rose-600" 
                      />
                    </div>

                    {isPercentError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-600"
                      >
                        <Info size={18} />
                        <span className="text-xs font-black">{t('macro_editor.sum_error')} ({sum}%)</span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="pt-6 border-t border-gray-50">
                     <div className="grid grid-cols-3 gap-3">
                        <StaticMacro val={calculatedTargets.protein} label="Protein" color="text-blue-600" bg="bg-blue-50" />
                        <StaticMacro val={calculatedTargets.carbs} label="Carbs" color="text-amber-600" bg="bg-amber-50" />
                        <StaticMacro val={calculatedTargets.fat} label="Fat" color="text-rose-600" bg="bg-rose-50" />
                     </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="p-8 bg-gray-900 rounded-[3rem] border border-gray-800 shadow-2xl flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Engine Result</p>
            <div className="text-4xl font-display font-black text-white">{Math.round(calculatedTargets.calories)} <span className="text-sm font-normal text-gray-500">kcal</span></div>
            <p className="text-[10px] text-gray-400 font-medium text-center mt-2 max-w-xs leading-relaxed uppercase tracking-widest">
              Targets recalculate instantly for consistency
            </p>
        </div>
      </div>
    </div>
  );
};

const TargetInput: React.FC<{ label: string, value: number, onChange: (v: number) => void, unit: string, color: string, highlight?: boolean }> = ({ label, value, onChange, unit, color, highlight }) => (
  <div className="flex flex-col gap-3">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className={cn(
      "relative group rounded-[1.5rem] overflow-hidden transition-all",
      highlight ? "ring-2 ring-primary-500/20" : ""
    )}>
      <input 
        type="number" 
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className={cn(
          "w-full bg-gray-50 p-6 text-xl font-black outline-none border-2 border-transparent focus:border-primary-100 focus:bg-white transition-all h-[76px] shadow-inner",
          color
        )}
      />
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black pointer-events-none group-focus-within:text-primary-200">{unit}</div>
    </div>
  </div>
);

const StaticMacro: React.FC<{ val: number, label: string, color: string, bg: string }> = ({ val, label, color, bg }) => (
  <div className={cn("p-4 rounded-2xl text-center", bg)}>
     <div className={cn("text-lg font-display font-black", color)}>{val}g</div>
     <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</div>
  </div>
);

const MacroInput: React.FC<{ label: string, value: number, calculatedGrams?: number, onChange: (v: number) => void, unit: string, color: string }> = ({ label, value, calculatedGrams, onChange, unit, color }) => (
  <div className="flex flex-col gap-3">
    <div className="flex justify-between items-end px-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</label>
      <div className="flex items-baseline gap-2">
         {calculatedGrams !== undefined && <span className="text-[10px] font-bold text-gray-300">({calculatedGrams}g)</span>}
         <span className={cn("text-base font-black", color)}>{value}{unit}</span>
      </div>
    </div>
    <div className="relative group">
      <input 
        type="number" 
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-50 rounded-[1.5rem] p-6 text-lg font-black outline-none border-2 border-transparent focus:border-primary-100 focus:bg-white transition-all h-[76px] shadow-inner"
      />
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black pointer-events-none group-focus-within:text-primary-200">{unit}</div>
    </div>
  </div>
);
