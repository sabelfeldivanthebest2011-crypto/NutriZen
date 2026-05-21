import React from 'react';
import { cn } from '../../lib/utils';

interface WeightSliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({
  value,
  onChange,
  min = 30,
  max = 200,
  step = 0.1,
  label
}) => {
  return (
    <div className="w-full space-y-4 py-4">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {label || 'Weight'}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-zinc-900">{value}</span>
          <span className="text-sm font-bold text-zinc-400">kg</span>
        </div>
      </div>
      
      <div className="relative h-12 flex items-center">
        {/* Кастомный трек слайдера */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-black"
        />
      </div>
      
      <div className="flex justify-between text-[9px] font-black text-zinc-300 uppercase tracking-tighter">
        <span>{min} kg</span>
        <span>{max} kg</span>
      </div>
    </div>
  );
};