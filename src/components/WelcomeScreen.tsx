import React, { useState } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

// Убедись, что здесь написано именно "export const WelcomeScreen"
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
        
        {/* Иконка / Логотип */}
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-200">
          <span className="text-white text-3xl font-bold">🌱</span>
        </div>

        {/* Заголовки */}
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          NutriZen
        </h1>
        <p className="text-lg font-medium text-green-700 mb-4">
          Balance Your Nutrition, Simplify Your Life.
        </p>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Добро пожаловать! NutriZen поможет вам легко отслеживать калории, макронутриенты (КБЖУ) и контролировать вес в удобном интерфейсе.
        </p>

        {/* Кнопка Старта */}
        <button
          onClick={onComplete}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-green-600/20 mb-6"
        >
          Get Started
        </button>

        {/* Ссылка на Политику */}
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="text-xs text-slate-400 hover:text-green-600 underline transition duration-150"
          >
            {showPrivacy ? 'Скрыть политику конфиденциальности' : 'Политика конфиденциальности'}
          </button>
        </div>

        {/* Раскрывающийся текст Политики */}
        {showPrivacy && (
          <div className="mt-4 text-left bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto text-[11px] text-slate-500 leading-normal">
            <p className="font-bold mb-1 text-slate-700 text-xs text-center">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</p>
            <p className="text-center mb-2">Дата вступления в силу: 20 мая 2026 г.</p>
            <p className="mb-2"><strong>Разработчик:</strong> Сабельфельд И. (контакты: sabelfeld.i@icloud.com).</p>
            <p className="mb-2"><strong>Какие данные собираются:</strong> Прямые данные, вводимые пользователем (email при авторизации через Supabase, текущий вес, рост, возраст, пол, записи съеденных продуктов и КБЖУ). Автоматические данные (cookie-файлы сессии для удержания входа).</p>
            <p className="mb-2"><strong>Цели:</strong> Расчет индивидуальной нормы калорий, отображение графиков прогресса на экране Trend, поиск продуктов через USDA API.</p>
            <p className="mb-2"><strong>Передача третьим лицам:</strong> Данные не продаются и не передаются в коммерческих целях. Передача идет исключительно техническим провайдерам инфраструктуры для обеспечения работы приложения (Supabase, Vercel, GitHub Pages).</p>
            <p className="mb-2"><strong>Права пользователя:</strong> Вы имеете полное право изменить свои данные или безвозвратно удалить свой аккаунт со всеми записями из базы данных. По вопросам поддержки писать на sabelfeld.i@icloud.com.</p>
          </div>
        )}

      </div>
    </div>
  );
};