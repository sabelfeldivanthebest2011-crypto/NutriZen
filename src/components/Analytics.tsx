import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { subDays, format, isSameDay, startOfDay } from 'date-fns';
import { TrendingDown, Calendar, Database, Award, Info, AlertTriangle, Check, Zap, X, Trash2, ChevronRight, Droplets, Edit3, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { WeightSlider } from './ui/Selectors';
import { syncData } from '../lib/sync';

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
  const [suggestedTDEE, setSuggestedTDEE] = useState(0);

  const weightLogs = useLiveQuery(
    () => db.weight.orderBy('timestamp').toArray()
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

  const handleSave = async (weight: number, date: number, id?: number) => {
    if (id) {
      await db.weight.update(id, { weight, timestamp: date });
    } else {
      await db.weight.add({ weight, timestamp: date });
    }

    if (isSameDay(new Date(date), new Date())) {
      setProfile({ weight });
    }
    
    setEditingLog(null);

    // Trigger cloud synchronization
    syncData();

    // Adaptive logic (only for current/recent logs)
    if (weightData.length >= 4) {
       const firstWeight = weightData[0].weight;
       const days = weightData.length;
       const weightChange = weight - firstWeight;
       const adjustment = (weightChange * 7700) / days;
       setSuggestedTDEE(adaptiveTDEE + adjustment);
    }
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
                         onChange={(w) => setEditingLog(prev => prev ? { ...prev, weight: w } : null)}
                         min={40} max={200}
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
                      onChange={(w) => setEditingLog(prev => prev ? { ...prev, weight: w } : null)}
                      min={40} max={200}
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
              onClick={() => setIsLogging(true)}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
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
                      <h4 className="font-display font-black text-sm mb-1 tracking-tight">Metabolic Intelligence</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                         {weightData[weightData.length - 1].weight > weightData[weightData.length - 2].weight 
                           ? "Scale is up, but don't panic. Based on your intake, this is likely water retention from sodium or glycogen storage."
                           : "The trend confirms fat loss. Your metabolic rate is responding well to the current calorie deficit."}
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

        {/* Adaptive TDEE Modal */}
        <AnimatePresence>
          {showAdaptiveModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-md flex items-center justify-center p-4 rounded-[2.5rem]"
            >
               <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-primary-50 w-full animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 mb-6 shadow-inner">
                     <Zap size={28} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-display font-black mb-2 text-gray-900 tracking-tight">{t('analytics.intelligence')}</h3>
                  <p className="text-xs text-gray-500 mb-8 leading-relaxed font-medium">
                    {t('analytics.weight_change_desc')}
                  </p>
                  
                  <div className="flex justify-between items-center bg-gray-50 rounded-[2rem] p-5 mb-8 border border-gray-100">
                     <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('analytics.current')}</div>
                        <div className="text-lg font-black text-gray-700">{adaptiveTDEE} <span className="text-xs font-normal">kcal</span></div>
                     </div>
                     <ChevronRight className="text-gray-200" size={24} />
                     <div className="text-center">
                        <div className="text-[10px] font-bold text-primary-500 uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
                           <TrendingDown size={10} /> {t('analytics.suggested')}
                        </div>
                        <div className="text-2xl font-black text-primary-600">{Math.round(suggestedTDEE)} <span className="text-xs font-normal">kcal</span></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => {
                          updateAdaptiveTDEE(suggestedTDEE);
                          setShowAdaptiveModal(false);
                        }}
                        className="bg-primary-600 text-white py-4 rounded-2xl text-xs font-black shadow-xl shadow-primary-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                     >
                        <Check size={16} /> {t('common.confirm')}
                     </button>
                     <button 
                        onClick={() => setShowAdaptiveModal(false)}
                        className="bg-gray-100 text-gray-500 py-4 rounded-2xl text-xs font-black active:scale-95 transition-all"
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
