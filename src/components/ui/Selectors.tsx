import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

// --- Wheel Picker ---
interface WheelPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  height?: number;
  itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ 
  options, 
  value, 
  onChange, 
  height = 200, 
  itemHeight = 50 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.indexOf(value);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (index >= 0 && index < options.length && options[index] !== value) {
      onChange(options[index]);
    }
  };

  useEffect(() => {
    if (containerRef.current && selectedIndex !== -1) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex, itemHeight]);

  return (
    <div 
      className="relative overflow-hidden bg-zinc-900/50 rounded-2xl border border-white/5" 
      style={{ height }}
    >
      {/* Selection Highlight */}
      <div 
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[50px] bg-white/10 pointer-events-none rounded-xl" 
      />
      
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory px-4"
        style={{ scrollPaddingTop: (height - itemHeight) / 2, scrollPaddingBottom: (height - itemHeight) / 2 }}
      >
        <div style={{ height: (height - itemHeight) / 2 }} />
        {options.map((opt, i) => (
          <div
            key={i}
            className={cn(
              "h-[50px] flex items-center justify-center snap-center transition-all duration-300",
              opt === value ? "text-white text-2xl font-black scale-110" : "text-white/20 text-lg font-bold"
            )}
            style={{ height: itemHeight }}
          >
            {opt}
          </div>
        ))}
        <div style={{ height: (height - itemHeight) / 2 }} />
      </div>
    </div>
  );
};

// --- Horizontal Weight Slider ---
interface WeightSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  unit = 'kg'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Constants
  const stepWidth = 12; // Width between ticks
  const range = max - min;
  const step = range > 500 ? 1 : 0.1; // Use 1.0 increments for large ranges like calories (range > 500)
  const totalSteps = Math.round(range / step);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollLeft = ((value - min) / step) * stepWidth;
      scrollRef.current.scrollLeft = scrollLeft;
      setIsReady(true);
    }
  }, [min, step, stepWidth]); // Added dependencies for safety

  const handleScroll = () => {
    if (!scrollRef.current || !isReady) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const newValue = min + (scrollLeft / stepWidth) * step;
    const rounded = Math.round(newValue * (1 / step)) / (1 / step);
    if (rounded >= min && rounded <= max && rounded !== value) {
      onChange(rounded);
    }
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex justify-between items-end px-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-display font-black text-white">{step === 1 ? Math.round(value) : value.toFixed(1)}</span>
             <span className="text-xs font-bold text-zinc-500">{unit}</span>
          </div>
        </div>
      )}
      
      <div className="relative h-24 overflow-hidden bg-zinc-900/40 rounded-[2rem] border border-white/5">
        {/* Center Indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-primary-500 z-10 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
        
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-x-scroll no-scrollbar snap-x snap-mandatory flex items-end pb-4"
          style={{ paddingLeft: '50%', paddingRight: '50%' }}
        >
          <div className="flex items-end gap-0" style={{ width: totalSteps * stepWidth }}>
             {Array.from({ length: totalSteps + 1 }).map((_, i) => {
               const val = min + i * step;
               const isMajor = range > 500 ? i % 100 === 0 : i % 10 === 0;
               const isMid = range > 500 ? i % 50 === 0 : i % 5 === 0;
               
               return (
                 <div 
                   key={i} 
                   className="flex flex-col items-center flex-shrink-0 snap-center"
                   style={{ width: stepWidth }}
                 >
                    {isMajor && (
                      <span className="text-[9px] font-black text-zinc-600 mb-2">{Math.round(val)}</span>
                    )}
                    <div className={cn(
                      "w-0.5 rounded-full transition-colors",
                      isMajor ? "h-6 bg-zinc-400" : isMid ? "h-4 bg-zinc-600" : "h-2 bg-zinc-800"
                    )} />
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};
