import React, { useState, useEffect, Component } from 'react';
import { useStore } from './store/useStore';
import { OnboardingHub } from './components/onboarding/OnboardingHub'; // Новый хаб
import { Dashboard } from './components/Dashboard';
import { Diary } from './components/Diary';
import { Analytics } from './components/Analytics';
import { Profile } from './components/Profile';
import { NutritionBasics } from './components/NutritionBasics';
import { GoalsEditor } from './components/GoalsEditor';
import { MealStructureSettings } from './components/MealStructureSettings';
import { WeightMiniBook } from './components/WeightMiniBook';
import { Navigation } from './components/Navigation';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { seedDatabase } from './db/db';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { AuthUI } from './components/Auth';
import { Loader2 } from 'lucide-react';

// Error Boundary для предотвращения белого экрана
class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-8 text-center">
          <h1 className="font-black text-2xl mb-4">Something went wrong</h1>
          <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-2xl font-bold">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Используем новую структуру стора
  const { onboarding, user, setUser, loadProgress, profile, activeTab, setActiveTab } = useStore();
  
  const [subView, setSubView] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  const lang = profile.language || 'en';

  useEffect(() => {
    seedDatabase();
    
    // Проверка первого входа (Welcome Screen)
    const welcomeDone = localStorage.getItem('welcomeCompleted');
    setShowWelcome(welcomeDone !== 'true');

    // Инициализация сессии
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProgress(session.user.id); // Загружаем прогресс онбординга и избранное
      }
      setAuthLoading(false);
    };

    initAuth();

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProgress(session.user.id);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, loadProgress]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    setShowWelcome(false);
  };

  // 1. Загрузка
  if (authLoading || showWelcome === null) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  // 2. Экран приветствия (только один раз)
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // 3. Если не авторизован — экран входа
  if (!user) {
    return <AuthUI />;
  }

  // 4. Если авторизован, но онбординг не завершен — новый OnboardingHub
  if (onboarding.section !== 'completed') {
    return (
      <ErrorBoundary>
        <OnboardingHub />
      </ErrorBoundary>
    );
  }

  // 5. Основное приложение (Дашборд и т.д.)
  const renderSubView = () => {
    switch (subView) {
      case 'basics': return <NutritionBasics onBack={() => setSubView(null)} />;
      case 'goals': return <GoalsEditor onBack={() => setSubView(null)} />;
      case 'meal-structure': return <MealStructureSettings onBack={() => setSubView(null)} />;
      case 'weight-guide': return <WeightMiniBook onBack={() => setSubView(null)} />;
      case 'privacy': return <PrivacyPolicy onBack={() => setSubView(null)} />;
      default: return null;
    }
  };

  const currentSubView = renderSubView();
  if (currentSubView) return <ErrorBoundary>{currentSubView}</ErrorBoundary>;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <main className="max-w-md mx-auto px-4 pt-8">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Dashboard onNavigate={setSubView} />
              </motion.div>
            )}
            {activeTab === 'diary' && (
              <motion.div key="diary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Diary />
              </motion.div>
            )}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Analytics />
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Profile onNavigate={setSubView} setActiveTab={setActiveTab} />
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}