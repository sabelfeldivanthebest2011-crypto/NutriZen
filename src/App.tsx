import React, { useState, useEffect, Component, ReactNode } from 'react';
import { useStore } from './store/useStore';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Diary } from './components/Diary';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { NutritionBasics } from './components/NutritionBasics';
import { GoalsEditor } from './components/GoalsEditor';
import { MealStructureSettings } from './components/MealStructureSettings';
import { WeightMiniBook } from './components/WeightMiniBook';
import { Navigation } from './components/Navigation';
import { FoodSearchModal } from './components/FoodSearchModal';
import { WelcomeScreen } from './components/WelcomeScreen'; // Импортируем новый экран
import { seedDatabase } from './db/db';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { AuthUI } from './components/Auth';
import { syncData } from './lib/sync';
import { Loader2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("App Crash:", error, errorInfo); }
  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center text-[#1A1A1A]">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl text-rose-500">⚠️</span>
          </div>
          <h1 className="font-display font-black text-2xl mb-2">Section Not Available</h1>
          <p className="text-gray-500 mb-8 max-w-xs">Something went wrong while loading this screen. Your progress is safe.</p>
          <button 
            onClick={() => window.location.replace('/')}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
          >
            Return Home
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  const { isOnboarded, activeTab, setActiveTab, profile, user, setUser } = useStore();
  const [subView, setSubView] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Состояние для отображения приветственного экрана (по умолчанию null, пока проверяем localStorage)
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  // Проверка localStorage при первой загрузке приложения
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    seedDatabase();

    // Check active session and initialize with robust error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user) {
          syncData();
        }
      })
      .catch((err) => {
        console.error('[Auth] Initial session resolution failed:', err);
        setAuthLoading(false);
      });

    // Setup listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        syncData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  // Handle background auto-sync when online
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      syncData();
    }, 60000); // 60s background sync
    return () => clearInterval(interval);
  }, [user]);

  // Fallback redirect if activeTab gets into 'library' state
  useEffect(() => {
    if ((activeTab as string) === 'library') {
      setActiveTab('home');
    }
  }, [activeTab, setActiveTab]);

  // Notification Logic
  useEffect(() => {
    if (!profile.notificationsEnabled) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const meal = profile.mealStructure?.find(m => m.time === currentHHMM);
      if (meal) {
        // Trigger notification
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("NutriZen", { body: `Time for ${meal.name}! 🍲` });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
          }
        }
        console.log(`[Notification] Time for ${meal.name}!`);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [profile.notificationsEnabled, profile.mealStructure]);

  // Экшен завершения приветственного экрана
  const handleWelcomeComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowWelcome(false);
  };

  // 1. Пока проверяется состояние локального хранилища — возвращаем пустой экран (защита от моргания интерфейса)
  if (showWelcome === null) {
    return null;
  }

  // 2. Если пользователь зашел в первый раз — рендерим только WelcomeScreen
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // 3. Если приветственный экран пройден — включается стандартная логика авторизации и загрузки
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center p-8 text-center text-zinc-100">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-xs uppercase tracking-widest font-black text-zinc-500">Initializing Core Intel...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthUI />;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  // Safe navigation Layer
  const renderSubView = () => {
    switch (subView) {
      case 'basics': return <NutritionBasics onBack={() => setSubView(null)} />;
      case 'goals': return <GoalsEditor onBack={() => setSubView(null)} />;
      case 'meal-structure': return <MealStructureSettings onBack={() => setSubView(null)} />;
      case 'weight-guide': return <WeightMiniBook onBack={() => setSubView(null)} />;
      
      // ИСПРАВЛЕНО: Добавлен подэкран для просмотра политики из профиля
      case 'privacy': return <WelcomeScreen onComplete={() => setSubView(null)} />;
      
      case null: return null;
      default: 
        return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 text-3xl">⚠️</div>
            <h1 className="font-display font-black text-2xl mb-2">Section Not Available</h1>
            <p className="text-gray-400 mb-8 max-w-xs">The requested module is under maintenance or has been moved.</p>
            <button onClick={() => setSubView(null)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Go Home</button>
          </div>
        );
    }
  };

  const subViewContent = renderSubView();
  if (subViewContent) return <ErrorBoundary>{subViewContent}</ErrorBoundary>;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <main className="max-w-md mx-auto px-4 pt-8">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard onNavigate={(view) => {
                  if (view === 'basics') setSubView('basics');
                  else if (view === 'weight-progress') setSubView('weight-guide');
                  else if (view === 'analytics') setActiveTab('analytics');
                  else setSubView(view); // Safe nav: let switch handle unknown views
                }} />
              </motion.div>
            )}
            {activeTab === 'diary' && (
              <motion.div
                key="diary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Diary />
              </motion.div>
            )}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Analytics />
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Profile onNavigate={setSubView} setActiveTab={setActiveTab} />
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      
      {!subView && <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}