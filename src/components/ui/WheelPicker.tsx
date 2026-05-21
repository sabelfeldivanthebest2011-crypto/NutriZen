import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, animate } from 'motion/react';

export const WheelPicker = ({ options, value, onChange }: { options: (string | number)[], value: string | number, onChange: (val: any) => void }) => {
  const itemHeight = 60;
  // Важно: приводим всё к строкам для точного сравнения indexOf
  const stringOptions = options.map(String);
  const selectedIndex = stringOptions.indexOf(String(value));
  
  const y = useMotionValue(selectedIndex !== -1 ? -selectedIndex * itemHeight : 0);
  const springY = useSpring(y, { stiffness: 400, damping: 40, mass: 0.8 });

  // Синхронизация, если значение изменилось извне
  useEffect(() => {
    const newIndex = stringOptions.indexOf(String(value));
    if (newIndex !== -1) {
      y.set(-newIndex * itemHeight);
    }
  }, [value, stringOptions, y]);

  const onDragEnd = (_: any, info: any) => {
    const currentY = y.get();
    // Рассчитываем инерцию
    const projectedY = currentY + info.velocity.y * 0.2; 
    
    // Находим ближайший индекс
    let index = Math.round(Math.abs(projectedY / itemHeight));
    // Ограничиваем диапазон
    index = Math.max(0, Math.min(stringOptions.length - 1, index));
    
    // Жесткая фиксация (snap)
    animate(y, -index * itemHeight, {
      type: "spring",
      stiffness: 500,
      damping: 50,
      velocity: info.velocity.y
    });

    // Вызываем колбэк только если индекс изменился
    onChange(options[index]);
    
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  return (
    <div className="relative h-[240px] w-full overflow-hidden flex items-center justify-center touch-none">
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="h-full bg-gradient-to-b from-[#FAFAF8] via-transparent to-[#FAFAF8]" />
        <div className="absolute top-1/2 left-0 w-full h-[60px] -translate-y-1/2 border-y-2 border-black/5" />
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: -(stringOptions.length - 1) * itemHeight, bottom: 0 }}
        dragElastic={0.2}
        style={{ y: springY }}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing w-full"
      >
        {stringOptions.map((opt, i) => (
          <div key={i} className="h-[60px] flex items-center justify-center text-2xl font-black text-black">
            {opt}
          </div>
        ))}
      </motion.div>
    </div>
  );
};