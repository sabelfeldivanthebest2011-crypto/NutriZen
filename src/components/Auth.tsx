import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, AtSign, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export const AuthUI: React.FC = () => {
  const { profile, setProfile } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkEmailSent, setCheckEmailSent] = useState(false);

  const lang = profile.language || 'en';

  // Quick manual language switcher for onboarding or sign-in state
  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ru' : 'en';
    setProfile({ language: nextLang });
  };

  const text = {
    en: {
      title: 'NutriZen Intelligence',
      sub: 'Your premium offline-first metabolic sandbox with secure cloud sync.',
      signIn: 'Sign In',
      signUp: 'Create Account',
      email: 'Email address',
      password: 'Password',
      fullName: 'Full Name',
      submitting: 'Processing...',
      noAccount: 'Don\'t have an account?',
      hasAccount: 'Already have an account?',
      mandatory: 'Authentication is required to synchronize metrics and goals safely.',
      successMsg: 'Verification email sent if registered! You can now log in.',
      checkEmailTitle: 'Verify Your Inbox',
      checkEmailSub: 'We have dispatched a secure authorization link to your address:',
      checkEmailInfo: 'Please click the link in that email to activate your account. You can return to this screen and sign in once confirmed.',
      backToSignIn: 'Back to Sign In'
    },
    ru: {
      title: 'Интеллект NutriZen',
      sub: 'Ваш премиальный автономный метаболический трекер с синхронизацией.',
      signIn: 'Войти в аккаунт',
      signUp: 'Создать аккаунт',
      email: 'Электронная почта',
      password: 'Пароль',
      fullName: 'Ваше имя',
      submitting: 'Обработка...',
      noAccount: 'Ещё нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      mandatory: 'Авторизация обязательна для безопасного сохранения ваших показателей.',
      successMsg: 'Ссылка для подтверждения отправлена! Теперь вы можете войти.',
      checkEmailTitle: 'Подтвердите Ваш Email',
      checkEmailSub: 'Мы отправили безопасную ссылку для авторизации на ваш адрес:',
      checkEmailInfo: 'Перейдите по ссылке в письме, чтобы активировать аккаунт. После этого вы сможете войти в систему.',
      backToSignIn: 'Назад к авторизации'
    }
  };

  const t = text[lang];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        console.log('[SignUp] Starting registration for:', email);
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || undefined,
            },
          },
        });

        console.log('[SignUp] Supabase response payload:', data);
        if (error) {
          console.error('[SignUp] Error response from Supabase:', error);
          throw error;
        }

        // Move to verification instructions screen instead of unauthenticated profile upsert
        setCheckEmailSent(true);
      } else {
        console.log('[SignIn] Starting sign-in for:', email);
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[SignIn] Error response from Supabase:', error);
          throw error;
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error handled:', err);
      let localizedErr = err.message;
      
      // Parse common error strings for neat error prompts
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('email already')) {
        localizedErr = lang === 'ru' 
          ? 'Этот адрес электронной почты уже зарегистрирован.' 
          : 'This email is already registered and in use.';
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        localizedErr = lang === 'ru' 
          ? 'Неверный пароль или адрес электронной почты.' 
          : 'Invalid email or password credentials.';
      } else if (msg.includes('should be at least') || msg.includes('weak password') || msg.includes('password should be')) {
        localizedErr = lang === 'ru' 
          ? 'Слишком слабый пароль. Нужно минимум 6 символов.' 
          : 'Password is too weak. It must be at least 6 characters.';
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
        localizedErr = lang === 'ru' 
          ? 'Ошибка сетевого подключения. Проверьте интернет.' 
          : 'Network connection error. Please verify your connection.';
      } else if (msg.includes('email rate limit') || msg.includes('rate limit exceeded') || msg.includes('rate_limit')) {
        localizedErr = lang === 'ru'
          ? 'Превышен лимит отправки писем. Пожалуйста, подождите 1–2 минуты, проверьте папку "Спам" на наличие предыдущих писем или войдите в систему, если вы уже подтвердили адрес.'
          : 'Email rate limit exceeded. To prevent spam, Supabase limits how often confirmation emails can be sent. Please wait 1–2 minutes, check your inbox/spam folder for any previous activation links, or sign in if you already confirmed your account.';
      } else if (msg.includes('security purposes') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('only request this after')) {
        const secondsMatch = err.message.match(/\d+/);
        const seconds = secondsMatch ? secondsMatch[0] : '';
        if (lang === 'ru') {
          localizedErr = seconds 
            ? `В целях безопасности пожалуйста подождите ${seconds} сек. перед повторной попыткой.`
            : 'Слишком много попыток. В целях безопасности пожалуйста подождите некоторое время.';
        } else {
          localizedErr = seconds
            ? `For security purposes, please wait ${seconds} seconds before trying again.`
            : 'Too many requests. For security purposes, please wait a moment.';
        }
      } else if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed') || msg.includes('confirm your email')) {
        localizedErr = lang === 'ru'
          ? 'Ваш email не подтвержден. Пожалуйста, найдите письмо от NutriZen и завершите регистрацию.'
          : 'Your email address is not confirmed yet. Please check your inbox and verify your account first.';
      }

      setErrorMessage(localizedErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center p-6 text-zinc-100 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleLanguage}
          className="bg-zinc-900 border border-zinc-800 text-[10px] font-black tracking-widest uppercase text-zinc-400 hover:text-white px-3 py-2 rounded-xl transition-all"
        >
          {lang === 'en' ? 'RU 🇷🇺' : 'EN 🇬🇧'}
        </button>
      </div>

      <div className="w-full max-w-md bg-zinc-950/40 border border-zinc-900 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
        
        {checkEmailSent ? (
          /* Check Email Instructions Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
              <Mail size={32} />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-black text-white tracking-tight">
                {t.checkEmailTitle}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {t.checkEmailSub}
              </p>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 px-4 font-mono text-xs text-emerald-400 select-all truncate">
                {email}
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              {t.checkEmailInfo}
            </p>

            <button
              onClick={() => {
                setCheckEmailSent(false);
                setIsSignUp(false);
                setErrorMessage(null);
                setPassword('');
              }}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              {t.backToSignIn}
            </button>
          </motion.div>
        ) : (
          /* Sign In & Sign Up Form */
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-emerald-950/50 shadow-lg">
                <Sparkles className="text-black" size={24} />
              </div>
              <h1 className="text-3xl font-display font-black tracking-tight text-white bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {t.sub}
              </p>
            </div>

            {/* Error / Alert notice */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed border ${
                    errorMessage.includes('sent') || errorMessage.includes('Verification') || errorMessage.includes('отправлена')
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] uppercase tracking-wider font-black text-zinc-500 ml-1">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800/60 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-display"
                      placeholder="Alex Smith"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-black text-zinc-500 ml-1">
                  {t.email}
                </label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-display"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-black text-zinc-500 ml-1">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded-2xl py-4 pl-12 pr-12 text-white text-sm font-bold outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-display"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 py-4.5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin text-black" size={18} />
                ) : (
                  isSignUp ? t.signUp : t.signIn
                )}
              </button>
            </form>

            {/* Account Switch Toggler */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                {isSignUp ? t.hasAccount : t.noAccount}{' '}
                <span className="text-emerald-500 underline ml-1">{isSignUp ? t.signIn : t.signUp}</span>
              </button>
            </div>

            {/* Security / Notice */}
            <p className="text-[10px] text-zinc-600 font-bold tracking-wider text-center pt-2 leading-relaxed">
              {t.mandatory}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
