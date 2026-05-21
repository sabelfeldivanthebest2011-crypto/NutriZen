// src/components/search/GlobalSearch.tsx
import React, { useState, useEffect } from 'react'; // Добавлен импорт хуков
import { useStore } from '../../store/useStore'; // Путь исправлен для папки src/components/search/
import { Heart, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils'; // Добавлен импорт утилиты стилей

// Определяем интерфейс для элемента результата (соответствует FoodItem из стора)
interface SearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  type: 'db' | 'custom' | 'recipe';
}

export const GlobalSearch = ({ onClose }: { onClose?: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]); // Типизация массива результатов
  const { favorites, toggleFavorite } = useStore();

  // Логика поиска (запускается при изменении query)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Здесь должна быть ваша логика фильтрации из базы данных Dexie или API
    // Для примера создаем демонстрационную логику:
    const mockSearch = async () => {
      // Представим, что мы ищем по локальным данным
      // В будущем замените это на вызов db.foods.filter(...)
      console.log("Searching for:", query);
    };

    mockSearch();
  }, [query]);

  const handleSearch = (val: string) => {
    setQuery(val);
  };

  return (
    <div className="fixed inset-0 bg-[#FAFAF8] z-[100] flex flex-col animate-in fade-in duration-200">
      {/* Шапка поиска */}
      <div className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ArrowLeft className="text-zinc-900" size={24} />
        </button>
        
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            autoFocus
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-black/5 font-bold outline-none focus:bg-black/[0.08] transition-all"
            placeholder="Search products, brands, recipes..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Список результатов */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {query.length > 0 && results.length === 0 && (
          <div className="text-center py-20 text-zinc-400 font-medium">
            No results found for "{query}"
          </div>
        )}

        {results.map(item => {
          const isFav = favorites.includes(item.id);
          
          return (
            <div 
              key={item.id} 
              className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-zinc-900">{item.name}</h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-100 rounded text-zinc-400 tracking-widest">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-bold mt-1">
                  {item.calories} kcal · P: {item.protein}g
                </p>
              </div>
              
              <button 
                onClick={() => toggleFavorite(item.id)}
                className="p-2 transition-transform active:scale-125"
              >
                <Heart 
                  size={24}
                  fill={isFav ? "#000" : "none"} 
                  className={cn(
                    "transition-colors",
                    isFav ? "text-black" : "text-zinc-200"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};