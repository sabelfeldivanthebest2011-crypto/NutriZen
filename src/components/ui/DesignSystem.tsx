// components/ui/DesignSystem.tsx
import { cn } from '../../lib/utils';

export const GlassCard = ({ children, className, active }: any) => (
  <div className={cn(
    "rounded-[2rem] border-2 transition-all duration-300 backdrop-blur-md",
    active 
      ? "bg-white border-white shadow-xl shadow-black/5 scale-[1.02]" 
      : "bg-black/[0.03] border-transparent hover:bg-black/[0.05]",
    className
  )}>
    {children}
  </div>
);

export const PrimaryButton = ({ children, onClick, disabled, className }: any) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "w-full h-16 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg",
      disabled ? "bg-zinc-200 text-zinc-400" : "bg-black text-white hover:bg-zinc-800",
      className
    )}
  >
    {children}
  </button>
);