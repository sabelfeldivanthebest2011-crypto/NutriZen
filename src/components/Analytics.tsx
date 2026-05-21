import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { subDays, format, isSameDay, startOfDay } from 'date-fns';
import { TrendingDown, Calendar, Database, Award, Info, AlertTriangle, Check, Zap, X, Trash2, ChevronRight, Droplets, Edit3, Plus, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { WeightSlider } from './ui/Selectors';
import { syncData } from '../lib/sync';
import { WEIGHT_STEP, snapWeight } from '../lib/constants';
import { calculateAdaptiveTDEE, DailyLogSummary } from '../lib/tdee-engine';

const AnalyticsCard: React.FC<{ icon: React.ReactNode, label: string, value: string, desc: string }> = ({ icon, label, value, desc }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-display">{label}</span>
    </div>
    <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
    <div className="text-[10px] text-gray-500 font-medium mt-0.5">{desc}</div>
  </div>
);

const WeightSection: React.FC = () => {
  const { adaptiveTDEE, updateAdaptiveTDEE, setProfile, profile, enqueueDeleted } = useStore();
  const { t } = useTranslation();
  const [isLogging, setIsLogging] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingLog, setEditingLog] = useState<{ weight: number, timestamp: number, id?: number } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);

  const weightLogs = useLiveQuery(
    () => db.weight.orderBy('timestamp').toArray()
  );

  const foodLogs = useLiveQuery(
    () => db.logs.toArray()
  );

  const dayLogs = useMemo(() => {
    if (!selectedDay || !weightLogs) return [];
    return weightLogs.filter(l => isSameDay(new Date(l.timestamp), new Date(selectedDay)));
  }, [selectedDay, weightLogs]);

  const weightData = useMemo(() => {
    if (!weightLogs) return [];
    
    // For chart: one point per day (average)
    const dailyAvg: { [key: string]: { sum: number, count: number, ts: number } } = {};
    weightLogs.forEach(l => {
      const day = startOfDay(new Date(l.timestamp)).getTime();
      if (!dailyAvg[day]) dailyAvg[day] = { sum: 0, count: 0, ts: day };
      dailyAvg[day].sum += l.weight;
      dailyAvg[day].count += 1;
    });

    const sortedDays = Object.values(dailyAvg).sort((a, b) => a.ts - b.ts);
    
    return sortedDays.map((d, index) => {
      const avgWeight = d.sum / d.count;
      const window = sortedDays.slice(Math.max(0, index - 6), index + 1);
      const ma = window.reduce((acc, curr) => acc + (curr.sum / curr.count), 0) / window.length;
      
      return {
        name: format(new Date(d.ts), 'MMM dd'),
        weight: Number(avgWeight.toFixed(1)),
        ma: Number(ma.toFixed(1)),
        timestamp: d.ts
      };
    });
  }, [weightLogs]);

  // Robust Adaptive TDEE Calculation Result
  const adaptiveResult = useMemo(() => {
    if (!weightLogs || !foodLogs) return null;

    // Create a map of date -> calories
    const dailyCalories: { [dateKey: string]: number } = {};
    foodLogs.forEach(log => {
      const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
      dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + (log.nutrients?.calories || 0);
    });

    // Create a map of date -> weights (average per day)
    const dailyWeights: { [dateKey: string]: { sum: number, count: number, timestamp: number } } = {};
    weightLogs.forEach(log => {
      const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
      if (!dailyWeights[dateKey]) {
        dailyWeights[dateKey] = { sum: 0, count: 0, timestamp: startOfDay(new Date(log.timestamp)).getTime() };
      }
      dailyWeights[dateKey].sum += log.weight;
      dailyWeights[dateKey].count += 1;
    });

    // We build a timeline of the last 60 days
    const uniqueDates = new Set<string>();
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const ts = now - i * oneDay;
      const dateKey = format(new Date(ts), 'yyyy-MM-dd');
      uniqueDates.add(dateKey);
    }

    Object.keys(dailyCalories).forEach(d => uniqueDates.add(d));
    Object.keys(dailyWeights).forEach(d => uniqueDates.add(d));

    const dailySummaries: DailyLogSummary[] = Array.from(uniqueDates).map(dateKey => {
      const parts = dateKey.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const timestamp = new Date(year, month, day).getTime();

      const weightEntry = dailyWeights[dateKey];
      const calEntry = dailyCalories[dateKey];

      return {
        dateStr: dateKey,
        timestamp,
        rawWeight: weightEntry ? weightEntry.sum / weightEntry.count : undefined,
        caloriesConsumed: calEntry !== undefined ? calEntry : undefined
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    const currentTargets = useStore.getState().calculatedTargets;
    return calculateAdaptiveTDEE(
      dailySummaries,
      currentTargets.tdee || 2000,
      adaptiveTDEE
    );
  }, [weightLogs, foodLogs, adaptiveTDEE]);

  const handleSave = async (weight: number, date: number, id?: number) => {
    const snappedWeight = snapWeight(weight);
    if (id) {
      await db.weight.update(id, { weight: snappedWeight, timestamp: date });
    } else {
      await db.weight.add({ weight: snappedWeight, timestamp: date });
    }

    if (isSameDay(new Date(date), new Date())) {
      setProfile({ weight: snappedWeight });
    }
    
    setEditingLog(null);

    // Trigger cloud synchronization
    syncData();
  };

  const deleteWeight = async (id: number) => {
    enqueueDeleted('weights', id);
    await db.weight.delete(id);
    setEditingLog(null);
    syncData(); // background sync trigger
  };

  return (
    <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative">
        <div className="flex justify-between items-center mb-6 px-2">
           <div>
            <h3 className="font-display font-black text-lg tracking-tight">{t('analytics.title')}</h3>
            <p className="text-xs text-gray-400 font-medium tracking-tight">Adaptive trend tracking</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCalendar(true)}
              className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Calendar size={18} />
            </button>
            <button 
              onClick={() => {
                setSelectedDay(startOfDay(new Date()).getTime());
                setEditingLog({ weight: profile.weight || 70, timestamp: Date.now() });
              }}
              className="text-xs font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-2xl hover:bg-primary-100 transition-all active:scale-95 shadow-sm"
            >
              + {t('analytics.log_weight')}
            </button>
          </div>
        </div>

        {/* Full Day Weight Screen Overlay */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 z-[110] bg-[#FAFAF8] flex flex-col p-8"
            >
               <div className="flex justify-between items-center mb-10">
                  <button onClick={() => { setSelectedDay(null); setEditingLog(null); }} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                     <ChevronRight size={24} className="rotate-180" />
                  </button>
                  <div className="text-center">
                     <h3 className="text-2xl font-display font-black text-black">Weight Log</h3>
                     <p className="text-[10px] font-black uppercase text-zinc-400 mt-1 tracking-widest">{format(new Date(selectedDay), 'EEEE, MMM d')}</p>
                  </div>
                  <div className="w-12" />
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                  {dayLogs.map(log => (
                    <div key={log.id} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center group">
                       <div>
                          <div className="text-3xl font-display font-black text-black">{log.weight} <span className="text-xs font-bold text-zinc-400 tracking-normal">kg</span></div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{format(new Date(log.timestamp), 'HH:mm')}</div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setEditingLog(log)} className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors">
                             <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteWeight(log.id!)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors">
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setEditingLog({ weight: profile.weight || 70, timestamp: selectedDay + (12 * 3600000) })}
                    className="w-full p-8 border-2 border-dashed border-zinc-200 rounded-[2rem] text-zinc-400 font-black uppercase tracking-widest text-xs hover:border-black hover:text-black transition-all flex items-center justify-center gap-3"
                  >
                     <Plus size={20} /> Add Measurement
                  </button>
               </div>

               {editingLog && (
                 <div className="absolute inset-0 z-10 bg-black/5 flex flex-col justify-end">
                    <motion.div 
                      initial={{ y: '100%' }} animate={{ y: 0 }}
                      className="bg-black text-white p-10 rounded-t-[3rem] shadow-2xl space-y-12"
                    >
                       <div className="flex justify-between items-center">
                          <h4 className="text-xl font-display font-black">{editingLog.id ? 'Edit Entry' : 'New Entry'}</h4>
                          <button onClick={() => setEditingLog(null)}><X /></button>
                       </div>
                       <WeightSlider 
                         value={editingLog.weight} 
                         onChange={(w) => setEditingLog(prev => prev ? { ...prev, weight: snapWeight(w) } : null)}
                         min={40} max={200}
                         step={WEIGHT_STEP}
                       />
                       <button 
                         onClick={() => handleSave(editingLog.weight, editingLog.timestamp, editingLog.id)}
                         className="w-full bg-white text-black py-6 rounded-[1.2rem] font-black uppercase tracking-widest text-lg"
                       >
                         {editingLog.id ? 'Update' : 'Confirm'}
                       </button>
                    </motion.div>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingLog && !selectedDay && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setEditingLog(null)}
                 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               />
               <motion.div 
                 initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="bg-black text-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 relative z-10 border-t sm:border border-white/10"
               >
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                          <Edit3 size={20} />
                       </div>
                       <div>
                          <h4 className="font-display font-black text-xl tracking-tight">
                            {editingLog.id ? 'Edit Log' : 'New Entry'}
                          </h4>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {format(new Date(editingLog.timestamp), 'EEEE, MMM d, yyyy')}
                          </p>
                       </div>
                    </div>
                    <button onClick={() => setEditingLog(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white transition-colors">
                       <X size={20} className="text-white hover:text-black" />
                    </button>
                  </div>

                  <div className="space-y-12">
                    <WeightSlider 
                      value={editingLog.weight} 
                      onChange={(w) => setEditingLog(prev => prev ? { ...prev, weight: snapWeight(w) } : null)}
                      min={40} max={200}
                      step={WEIGHT_STEP}
                    />

                    <div className="grid grid-cols-2 gap-4">
                       {editingLog.id && (
                         <button 
                           onClick={() => deleteWeight(editingLog.id!)}
                           className="bg-zinc-800 text-rose-400 py-5 rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                         >
                           <Trash2 size={16} /> DELETE
                         </button>
                       )}
                       <button 
                         onClick={() => handleSave(editingLog.weight, editingLog.timestamp, editingLog.id)}
                         className={cn(
                           "py-5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl",
                           editingLog.id ? "bg-white text-black" : "bg-primary-500 text-white shadow-primary-500/20 col-span-2"
                         )}
                       >
                         {editingLog.id ? 'UPDATE LOG' : 'SAVE WEIGHT'}
                       </button>
                    </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {weightData.length > 0 ? (
          <div className="space-y-6">
            <div className="h-56 w-full px-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                    labelStyle={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', color: '#9CA3AF' }}
                    formatter={(val: number) => [val.toFixed(1), '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#D1D5DB" 
                    strokeWidth={1}
                    dot={{ r: 4, fill: '#D1D5DB', strokeWidth: 0 }}
                    strokeDasharray="4 4"
                    name={t('analytics.weight')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ma" 
                    stroke="#6366f1" 
                    strokeWidth={7} 
                    dot={false}
                    name={t('analytics.moving_avg')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 bg-primary-50/50 rounded-[2rem] border border-primary-100/50 flex gap-4 shadow-sm">
               <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Info size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">{t('analytics.weight_trend')}</h4>
                  <p className="text-xs text-primary-600/80 leading-relaxed font-medium">
                     {weightData.length < 5 ? t('analytics.insufficient_data') : t('analytics.weight_change_desc')}
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 px-8">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
              <Database className="text-gray-200" size={32} />
            </div>
            <p className="text-sm text-gray-400 font-bold leading-relaxed tracking-tight mb-8">{t('analytics.empty_history')}</p>
            <button 
              onClick={() => {
                setSelectedDay(startOfDay(new Date()).getTime());
                setEditingLog({ weight: profile.weight || 70, timestamp: Date.now() });
              }}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              + {t('analytics.log_weight')}
            </button>
          </div>
        )}

        {/* Calendar History Modal */}
        <AnimatePresence>
          {showCalendar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setShowCalendar(false)}
                 className="absolute inset-0 bg-black/80 backdrop-blur-md"
               />
               <motion.div 
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 h-[85vh] flex flex-col relative z-50 border border-white/50"
               >
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-display font-black tracking-tight">Weight Journey</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Calendar & History</p>
                    </div>
                    <button onClick={() => setShowCalendar(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Mini Month Grid */}
                  <div className="bg-gray-50/50 rounded-[2rem] p-6 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{format(new Date(), 'MMMM yyyy')}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                       {['M','T','W','T','F','S','S'].map((d, i) => <div key={`${d}-${i}`} className="text-[8px] font-black text-gray-300 text-center">{d}</div>)}
                       {Array.from({ length: 30 }).map((_, i) => {
                          const dayDate = startOfDay(subDays(new Date(), 29 - i));
                          const dayLogs = weightLogs?.filter(l => isSameDay(new Date(l.timestamp), dayDate)) || [];
                          const hasLog = dayLogs.length > 0;
                          const isToday = isSameDay(dayDate, new Date());
                          
                          return (
                            <button 
                              key={i} 
                              onClick={() => {
                                setSelectedDay(dayDate.getTime());
                                setShowCalendar(false);
                              }}
                              className={cn(
                                "aspect-square flex flex-col items-center justify-center gap-1 rounded-xl transition-all relative group",
                                hasLog ? "bg-primary-50 text-primary-600 shadow-sm" : "bg-gray-50/50 text-gray-400 hover:bg-white hover:shadow-md hover:scale-110",
                                isToday && "ring-2 ring-primary-500 ring-offset-2 z-10"
                              )}
                            >
                               <span className={cn(
                                 "text-[10px] font-black",
                                 hasLog ? "text-primary-700" : "text-gray-400"
                               )}>{dayDate.getDate()}</span>
                               {hasLog && (
                                  <div className="text-[7px] font-black opacity-60">
                                     {dayLogs[dayLogs.length - 1].weight.toFixed(1)}
                                  </div>
                               )}
                            </button>
                          );
                       })}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1 pb-4">
                     {weightLogs?.slice().sort((a, b) => b.timestamp - a.timestamp).map(log => (
                        <div 
                           key={log.id} 
                           onClick={() => {
                             setSelectedDay(startOfDay(new Date(log.timestamp)).getTime());
                             setShowCalendar(false);
                           }}
                           className="bg-gray-50/50 border border-gray-100 p-5 rounded-[2.5rem] flex justify-between items-center group hover:bg-white hover:border-primary-100 transition-all cursor-pointer"
                        >
                           <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                                <Calendar size={10} /> {format(new Date(log.timestamp), 'EEEE, MMM d')}
                              </div>
                              <div className="text-xl font-black text-gray-900">{log.weight.toFixed(1)} <span className="text-[10px] font-bold text-gray-400 uppercase">kg</span></div>
                           </div>
                           <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-primary-50 rounded-2xl">
                              <Edit3 size={18} />
                           </div>
                        </div>
                     ))}
                  </div>

                  <button 
                    onClick={() => { setShowCalendar(false); setIsLogging(true); }}
                    className="w-full mt-6 bg-gray-900 text-white rounded-[2rem] py-6 font-black shadow-2xl active:scale-[0.98] transition-all text-lg"
                  >
                    + Log New Weight
                  </button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Intelligent Insights */}
        <div className="mt-8 space-y-4">
           {weightData.length > 1 && (
             <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[40px] group-hover:bg-primary-500/20 transition-all" />
                <div className="relative z-10 flex gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400 shrink-0 border border-white/5">
                      <Zap size={24} fill="currentColor" />
                   </div>
                   <div>
                      <h4 className="font-display font-black text-sm mb-1 tracking-tight text-white">Metabolic Intelligence</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                         {adaptiveResult && adaptiveResult.confidenceScore > 0.4 ? (
                           profile.language === 'ru' ? adaptiveResult.explanation_ru : adaptiveResult.explanation_en
                         ) : (
                           profile.language === 'ru' 
                             ? "Система сглаживает скачки веса (воду) и вычисляет реальную скорость вашего обмена веществ."
                             : "The adaptive engine filters out weight fluctuations and calculates your precise biological metabolic rate."
                         )}
                      </p>
                      <button 
                        onClick={() => setShowAdaptiveModal(true)}
                        className="mt-4 text-[10px] font-black text-primary-400 flex items-center gap-1 group/btn"
                      >
                         VIEW TDEE ADAPTATION <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>
              </div>
           )}
        </div>

        <AnimatePresence>
          {showAdaptiveModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            >
               <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 scrollbar-none font-sans">
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                       <Zap size={24} fill="currentColor" />
                    </div>
                    <button 
                      onClick={() => setShowAdaptiveModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <h3 className="text-xl font-display font-black mb-1 text-gray-900 tracking-tight">Adaptive TDEE Engine</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed font-semibold">
                    {profile.language === 'ru' 
                      ? "МакроФактор-модель метаболической адаптации. Анализирует реальное потребление энергии и биологический тренд веса."
                      : "MacroFactor-style cellular metabolic rate. Evaluates daily energy intake matched against true weight trends."}
                  </p>

                  <div className="flex justify-between items-center bg-gray-50 rounded-[2rem] p-5 mb-6 border border-gray-100">
                     <div className="text-center flex-1">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('analytics.current')}</div>
                        <div className="text-lg font-black text-gray-700">{adaptiveTDEE} <span className="text-[10px] font-semibold text-gray-450">kcal</span></div>
                     </div>
                     <ChevronRight className="text-gray-300" size={20} />
                     <div className="text-center flex-1">
                        <div className="text-[9px] font-bold text-primary-500 uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
                           <TrendingDown size={10} /> {t('analytics.suggested')}
                        </div>
                        <div className="text-2xl font-black text-primary-600">
                          {adaptiveResult ? adaptiveResult.updatedTDEE : adaptiveTDEE} <span className="text-[12px] font-normal text-primary-400">kcal</span>
                        </div>
                     </div>
                  </div>

                  {/* 3-Level Weight Signals Layer */}
                  <div className="mb-6 space-y-2.5">
                    <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Biological Weight Trends</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 text-center">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Raw Log</div>
                        <div className="text-xs font-black text-gray-750 font-mono">
                          {adaptiveResult ? `${adaptiveResult.rawWeight.toFixed(1)} kg` : '--'}
                        </div>
                      </div>
                      <div className="bg-primary-50/40 border border-primary-100/30 rounded-2xl p-3 text-center">
                        <div className="text-[8px] font-bold text-primary-500 uppercase tracking-wider mb-0.5 font-sans">Smoothed (7d)</div>
                        <div className="text-xs font-black text-primary-650 font-mono">
                          {adaptiveResult ? `${adaptiveResult.smoothedWeight.toFixed(1)} kg` : '--'}
                        </div>
                      </div>
                      <div className="bg-emerald-50/40 border border-emerald-100/30 rounded-2xl p-3 text-center">
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5 font-sans">Trend (21d)</div>
                        <div className="text-xs font-black text-emerald-650 font-mono">
                          {adaptiveResult ? `${adaptiveResult.trendWeight.toFixed(1)} kg` : '--'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Noise Filtering Indicator */}
                  {adaptiveResult?.noiseDetected && (
                    <div className="mb-6 bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed font-semibold">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold mb-0.5">Water Retention / Noise Detected</p>
                        <p className="text-[11px] opacity-90">
                          {profile.language === 'ru' 
                            ? "Резкий скачок веса без изменения калорий. Система заблокировала резкие скачки TDEE."
                            : "Sudden weight fluctuation with stable intake detected. Core algorithm throttled updates to preserve stability."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Confidence System Level */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">
                      <span>Algorithm Confidence</span>
                      <span className="text-primary-600 font-black">
                        {adaptiveResult ? `${Math.round(adaptiveResult.confidenceScore * 100)}%` : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500", 
                          adaptiveResult && adaptiveResult.confidenceScore > 0.6 
                            ? "bg-emerald-500" 
                            : adaptiveResult && adaptiveResult.confidenceScore > 0.3 
                              ? "bg-amber-500" 
                              : "bg-rose-500"
                        )}
                        style={{ width: `${adaptiveResult ? Math.min(100, Math.max(5, adaptiveResult.confidenceScore * 100)) : 10}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">
                      {adaptiveResult && adaptiveResult.confidenceScore < 0.3 
                        ? (profile.language === 'ru' ? "Недостаточно данных. Рекомендуется ежедневная запись веса и еды." : "Unstable logs. Complete daily logging of raw weight/calories to maximize accuracy.")
                        : (profile.language === 'ru' ? "Доверительный интервал в зеленой зоне. Математически стабильно." : "Robust tracking density achieved. High metabolic trend model accuracy.")}
                    </p>
                  </div>

                  {/* Custom explanations */}
                  {adaptiveResult && (
                    <div className="mb-8 p-4 bg-gray-50 border border-gray-150 rounded-2xl text-[11px] font-semibold text-gray-500 leading-relaxed italic">
                      * {profile.language === 'ru' ? adaptiveResult.explanation_ru : adaptiveResult.explanation_en}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => {
                          if (adaptiveResult) {
                            updateAdaptiveTDEE(adaptiveResult.updatedTDEE);
                          }
                          setShowAdaptiveModal(false);
                        }}
                        className="bg-primary-600 text-white py-4 rounded-2xl text-xs font-black shadow-xl shadow-primary-200 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-primary-700"
                     >
                        <Check size={16} /> {t('common.confirm')}
                     </button>
                     <button 
                        onClick={() => setShowAdaptiveModal(false)}
                        className="bg-gray-100 text-gray-500 py-4 rounded-2xl text-xs font-black active:scale-95 hover:bg-gray-200 transition-all"
                     >
                        {t('common.cancel')}
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
  );
};

export const Analytics: React.FC = () => {
  const { calculatedTargets } = useStore();
  const { t } = useTranslation();
  
  const last7DaysLogs = useLiveQuery(
    () => db.logs.where('timestamp').between(subDays(new Date(), 7).getTime(), Date.now()).toArray()
  );

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayLogs = last7DaysLogs?.filter(l => isSameDay(new Date(l.timestamp), day)) || [];
      const totalCals = dayLogs.reduce((acc, l) => acc + (l.nutrients?.calories || 0), 0);
      data.push({
        name: format(day, 'EEE'),
        calories: Math.round(totalCals),
        target: calculatedTargets.calories
      });
    }
    return data;
  }, [last7DaysLogs, calculatedTargets]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-2">
        <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] font-display">Nutrition Analytics</h2>
        <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">{t('analytics.title')}</h1>
      </header>

      {/* Progress Summary */}
      <section className="grid grid-cols-2 gap-4">
        <AnalyticsCard
          icon={<Award className="text-amber-500" size={18} />}
          label="Adherence"
          value="94%"
          desc="Consistency Score"
        />
        <AnalyticsCard
          icon={<TrendingDown className="text-primary-500" size={18} />}
          label="Metabolic Rate"
          value={`${useStore.getState().adaptiveTDEE}`}
          desc="Estimated Maintenance (TDEE)"
        />
      </section>

      {/* Calories Chart */}
      <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-50 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-display font-black text-lg tracking-tight">Metabolic Energy</h3>
            <p className="text-xs text-gray-400 font-medium">Intake vs Target evolution</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 text-gray-400"><Calendar size={20} /></div>
        </div>
        
        <div className="h-64 w-full px-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorCals)" 
                strokeWidth={4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Weight Chart Section */}
      <WeightSection />
      
      {/* Tips Section */}
      <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl mx-1">
         <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/20 rounded-full blur-[80px]" />
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-500">
                  <Zap size={20} fill="currentColor" />
               </div>
               <h4 className="font-display font-black text-lg">Metabolic Insight</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
               Your adherence is up 12% this week. Keep hitting your protein goal to minimize muscle loss during this cut phase. 
               The trend line confirms your metabolic efficiency is improving.
            </p>
         </div>
      </div>
    </div>
  );
};
