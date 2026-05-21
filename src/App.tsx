import React, { useState, useEffect, Component } from 'react';
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
import { WelcomeScreen } from './components/WelcomeScreen';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { seedDatabase } from './db/db';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { AuthUI } from './components/Auth';
import { syncData } from './lib/sync';
import { Loader2 } from 'lucide-react';

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
          <button onClick={() => window.location.replace('/')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Return Home</button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  const { isOnboarded, activeTab, setActiveTab, profile, user, setUser } = useStore();
  const store = useStore() as any; 
  
  const [subView, setSubView] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(false);

  const lang = profile.language || 'en';

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    setShowWelcome(onboardingCompleted !== 'true');
    const cookieAccepted = localStorage.getItem('cookieAccepted');
    if (!cookieAccepted) setShowCookieBanner(true);
  }, []);

  useEffect(() => {
    seedDatabase();

    const checkUserProfileInDatabase = async (userId: string) => {
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (userProfile && userProfile.is_onboarded) {
          localStorage.setItem('onboardingCompleted', 'true');
          setShowWelcome(false);

          if (typeof store.setIsOnboarded === 'function') store.setIsOnboarded(true);
          else if (typeof store.setOnboarded === 'function') store.setOnboarded(true);

          if (typeof store.setProfile === 'function') {
            store.setProfile({
              ...store.profile,
              ...userProfile,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching remote user profile:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    const checkAndAuthTelegramUser = async () => {
      const tg = window.Telegram?.WebApp;

      if (tg && tg.initDataUnsafe?.user) {
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe.user;
        const tgEmail = `tg_${tgUser.id}@nutrizen.bot`;
        const tgPassword = `tg_pass_secure_${tgUser.id}`;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: tgEmail,
          password: tgPassword,
        });

        if (signInError) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: tgEmail,
            password: tgPassword,
            options: {
              data: {
                display_name: tgUser.first_name,
                username: tgUser.username || '',
              }
            }
          });

          if (signUpError) {
            console.error("Telegram Auto-Signup Error:", signUpError.message);
            setAuthLoading(false);
          } else if (signUpData?.user) {
            setUser(signUpData.user);
            setAuthLoading(false);
          }
        } else if (signInData?.user) {
          setUser(signInData.user);
          await checkUserProfileInDatabase(signInData.user.id);
          syncData();
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkUserProfileInDatabase(session.user.id);
          syncData();
        } else {
          setAuthLoading(false);
        }
      }
    };

    checkAndAuthTelegramUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkUserProfileInDatabase(session.user.id);
        syncData();
      } else {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowWelcome(false);
  };

  if (showWelcome === null) return null;
  if (showWelcome) return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  if (authLoading) return (
    <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center p-8 text-center text-zinc-100">
      <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
    </div>
  );

  if (!user) return <AuthUI />;
  if (!isOnboarded) return <Onboarding />;

  const renderSubView = () => {
    switch (subView) {
      case 'basics': return <NutritionBasics onBack={() => setSubView(null)} />;
      case 'goals': return <GoalsEditor onBack={() => setSubView(null)} />;
      case 'meal-structure': return <MealStructureSettings onBack={() => setSubView(null)} />;
      case 'weight-guide': return <WeightMiniBook onBack={() => setSubView(null)} />;
      case 'privacy': return <PrivacyPolicy onBack={() => setSubView(null)} />;
      case null: return null;
      default: return null;
    }
  };

  const subViewContent = renderSubView();
  if (subViewContent) return <ErrorBoundary>{subViewContent}</ErrorBoundary>;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 relative">
      <main className="max-w-md mx-auto px-4 pt-8">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
             {activeTab === 'home' && <motion.div key="home"><Dashboard onNavigate={setSubView} /></motion.div>}
             {activeTab === 'diary' && <motion.div key="diary"><Diary /></motion.div>}
             {activeTab === 'analytics' && <motion.div key="analytics"><Analytics /></motion.div>}
             {activeTab === 'profile' && <motion.div key="profile"><Profile onNavigate={setSubView} setActiveTab={setActiveTab} /></motion.div>}
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      
      {!subView && <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />}

      <AnimatePresence>
        {showCookieBanner && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-28 left-4 right-4 max-w-sm mx-auto bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-5 rounded-[2rem] shadow-2xl z-[200]">
            <p className="text-[11px] text-zinc-300 font-medium mb-4">
              {lang === 'ru' ? 'Мы используем cookie для авторизации. Оставаясь на сайте, вы соглашаетесь с Политикой конфиденциальности.' : 'We use cookies to keep you logged in. By remaining on this system, you agree to our Privacy Policy.'}
            </p>
            <button onClick={() => { localStorage.setItem('cookieAccepted', 'true'); setShowCookieBanner(false); }} className="w-full py-3 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl">
              {lang === 'ru' ? 'Принять' : 'Accept'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}