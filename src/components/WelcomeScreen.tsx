import React, { useState } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

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
          <div className="mt-4 text-left bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto text-[11px] text-slate-500 leading-relaxed">
            <p className="font-bold mb-1 text-slate-700 text-xs text-center">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</p>
            <p className="text-center mb-3 text-[10px]">Дата последнего обновления: 20 мая 2026 г.</p>
            <p className="mb-3"><strong>Разработчик:</strong> Сабельфельд И. (контактный email: sabelfeld.i@icloud.com).</p>
            
            <p className="font-semibold text-slate-700 mb-1">1. Какие данные мы собираем и обрабатываем:</p>
            <ul className="list-disc pl-4 mb-3 space-y-1">
              <li><strong>Данные, предоставляемые пользователем:</strong> Email-адрес (используется для аутентификации), а также физические параметры: текущий вес, рост, возраст, пол, и пользовательские записи о съеденных продуктах (включая КБЖУ).</li>
              <li><strong>Автоматически собираемые данные:</strong> Технические cookie-файлы сессии, необходимые исключительно для поддержания авторизации пользователя в системе.</li>
            </ul>

            <p className="font-semibold text-slate-700 mb-1">2. Цели сбора и использования данных:</p>
            <p className="mb-1">Все собираемые данные используются исключительно для обеспечения корректной работы сервиса, а именно:</p>
            <ul className="list-disc pl-4 mb-3 space-y-1">
              <li>Расчет индивидуальной суточной нормы калорий и макронутриентов.</li>
              <li>Визуализация графиков прогресса пользователя на экране трендов (Trend).</li>
              <li>Синхронизация данных пользователя между устройствами.</li>
            </ul>

            <p className="font-semibold text-slate-700 mb-1">3. Передача данных третьим лицам:</p>
            <p className="mb-2">Мы не продаем, не обмениваем и не передаем ваши личные данные третьим лицам в коммерческих целях. Передача данных осуществляется исключительно в технических целях для обеспечения работоспособности инфраструктуры приложения следующим доверенным провайдерам:</p>
            <ul className="list-disc pl-4 mb-3 space-y-1">
              <li><strong>Supabase</strong> (хранение базы данных и аутентификация).</li>
              <li><strong>Vercel / GitHub Pages</strong> (хостинг и доставка интерфейса приложения).</li>
              <li>Для работы функции поиска продуктов используется <strong>USDA API</strong> (при этом ваши персональные данные в сервис USDA не передаются).</li>
            </ul>

            <p className="font-semibold text-slate-700 mb-1">4. Права пользователя и удаление данных:</p>
            <p className="mb-2">Вы имеете полное право в любой момент изменить свои личные данные, а также запросить полное и безвозвратное удаление вашего аккаунта вместе со всей историей записей из базы данных. Вы можете сделать это через настройки профиля в приложении или обратившись в службу поддержки по адресу: <span className="underline">sabelfeld.i@icloud.com</span>.</p>
          </div>
        )}

      </div>
    </div>
  );
};