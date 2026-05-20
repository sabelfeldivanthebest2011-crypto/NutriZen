import React, { useState } from 'react';
import { searchFood } from '../search';

interface ProductSearchProps {
  onBack: () => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onBack }) => {
  const [results, setResults] = useState(searchFood(''));

  const handleSearch = (text: string) => {
    const foundItems = searchFood(text);
    setResults(foundItems);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4">
      <button 
        onClick={onBack} 
        className="mb-6 text-gray-600 font-medium flex items-center gap-2"
      >
        ← Назад
      </button>

      <input 
        autoFocus
        type="text"
        placeholder="Введите название продукта..."
        className="w-full p-4 mb-6 rounded-2xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-gray-900"
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="space-y-3">
        {results.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* ИСПРАВЛЕННОЕ МЕСТО: используем name_ru вместо item.name */}
            <h3 className="font-bold text-gray-900">{item.name_ru || item.name_en}</h3>
            <p className="text-sm text-gray-500">{item.brand || 'Без бренда'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};