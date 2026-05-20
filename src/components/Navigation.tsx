import React from 'react';
import { Home, Notebook, BarChart2, User, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: 'home' | 'diary' | 'analytics' | 'profile' | 'library';
  setActiveTab: (tab: 'home' | 'diary' | 'analytics' | 'profile' | 'library') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'diary', icon: Notebook, label: 'Diary' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-4 rounded-[2rem] transition-all duration-300 relative",
              isActive ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {isActive && (
              <div className="absolute inset-0 bg-primary-100 rounded-[2rem] -z-10" />
            )}
            <Icon size={22} className={cn("transition-transform", isActive && "scale-110")} />
            <span className="text-[10px] font-medium mt-1 font-display uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
