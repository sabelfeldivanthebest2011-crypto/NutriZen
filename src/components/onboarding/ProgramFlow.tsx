import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../../store/useStore';
import { PrimaryButton } from '../ui/DesignSystem';

export const ProgramFlow = () => {
  const [loading, setLoading] = useState(false);
  const { updateOnboarding } = useStore();

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateOnboarding({ programStatus: 'completed', section: 'completed' });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-12 text-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-4 border-black border-t-transparent rounded-full mb-8"
        />
        <h2 className="text-2xl font-black mb-2">Creating your program...</h2>
        <p className="text-zinc-400 font-medium">Cranking up the success likelihood</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8 flex flex-col animate-in fade-in duration-500">
       <h1 className="text-4xl font-black mb-12 tracking-tighter">Your macro plan is ready</h1>
       <div className="flex-1 bg-black text-white p-8 rounded-[3rem] shadow-2xl flex flex-col justify-between">
          <div className="flex justify-between items-end h-64 gap-2">
             {[0.7, 0.9, 0.8, 1, 0.85, 0.95, 0.75].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col gap-1">
                  <div className="bg-blue-400 w-full rounded-t-lg" style={{ height: `${h * 40}%` }} />
                  <div className="bg-orange-400 w-full" style={{ height: `${h * 20}%` }} />
                  <div className="bg-yellow-400 w-full rounded-b-lg" style={{ height: `${h * 30}%` }} />
               </div>
             ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center"><div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1"/> <span className="text-[8px] font-bold uppercase opacity-50">Protein</span></div>
            <div className="text-center"><div className="w-3 h-3 bg-orange-400 rounded-full mx-auto mb-1"/> <span className="text-[8px] font-bold uppercase opacity-50">Fat</span></div>
            <div className="text-center"><div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto mb-1"/> <span className="text-[8px] font-bold uppercase opacity-50">Carbs</span></div>
          </div>
       </div>
       <PrimaryButton onClick={handleFinish} className="mt-8">Done</PrimaryButton>
    </div>
  );
};