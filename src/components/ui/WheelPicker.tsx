import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export const WheelPicker = ({ options, value, onChange }: { options: (string | number)[], value: string | number, onChange: (val: any) => void }) => {
  const itemHeight = 60;
  const selectedIndex = options.indexOf(value);
  const y = useMotionValue(-selectedIndex * itemHeight);
  const springY = useSpring(y, { stiffness: 400, damping: 40 });

  // Добавлены типы для параметров info и _ (event)
  const onDragEnd = (_: any, info: any) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    const projectedY = currentY + velocity * 0.12; 
    
    const index = Math.round(Math.abs(projectedY / itemHeight));
    const finalIndex = Math.max(0, Math.min(options.length - 1, index));
    
    y.set(-finalIndex * itemHeight);
    onChange(options[finalIndex]);
    
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(8);
    }
  };

  return (
    <div className="relative h-[240px] w-full overflow-hidden flex items-center justify-center">
      {/* Selection Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="h-full bg-gradient-to-b from-[#FAFAF8] via-transparent to-[#FAFAF8]" />
        <div className="absolute top-1/2 left-0 w-full h-[60px] -translate-y-1/2 border-y-2 border-black/5" />
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: -(options.length - 1) * itemHeight, bottom: 0 }}
        style={{ y: springY }}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing w-full"
      >
        {options.map((opt, i) => (
          <div key={i} className="h-[60px] flex items-center justify-center text-2xl font-black text-black">
            {opt}
          </div>
        ))}
      </motion.div>
    </div>
  );
};