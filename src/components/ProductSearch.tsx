import React, { useState } from 'react';
import { searchFood } from '../search'; // Подключаем наш поиск

interface ProductSearchProps {
  onBack: () => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onBack }) => {
  const [results, setResults] = useState(searchFood('')); // Изначально показываем топ-20

  const handleSearch = (text: string) => {
    // Вызываем функцию поиска, которую мы создали ранее
    const foundItems = searchFood(text);
    setResults(foundItems);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4">
      {/* Кнопка "Назад" */}
      <button 
        onClick={onBack} 
        className="mb-6 text-gray-600 font-medium flex items-center gap-2"
      >
        ← Назад
      </button>

      {/* Поле ввода */}
      <input 
        autoFocus
        type="text"
        placeholder="Введите название продукта..."
        className="w-full p-4 mb-6 rounded-2xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-gray-900"
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Список результатов */}
      <div className="space-y-3">
        {results.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.brand}</p>
          </div>
        ))}
      </div>
    </div>
  );
};