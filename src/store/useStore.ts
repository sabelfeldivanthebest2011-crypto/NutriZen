import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  type: 'db' | 'custom' | 'recipe';
  brand?: string;
}

interface StoreState {
  user: any;
  setUser: (user: any) => void;
  profile: any;
  setProfile: (data: any) => void;
  activeTab: 'home' | 'diary' | 'analytics' | 'profile';
  setActiveTab: (tab: 'home' | 'diary' | 'analytics' | 'profile') => void;
  
  onboarding: {
    section: 'hub' | 'basics' | 'goal' | 'program' | 'completed';
    basicsStatus: 'todo' | 'completed';
    goalStatus: 'todo' | 'completed';
    programStatus: 'todo' | 'completed';
    answers: Record<string, any>;
  };
  updateOnboarding: (data: any) => void;
  setAnswer: (key: string, value: any) => void;

  favorites: string[];
  searchHistory: string[];
  recentFoods: FoodItem[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addSearchQuery: (q: string) => void;
  removeSearchQuery: (q: string) => void; // Добавлено
  clearSearchHistory: () => void; // Добавлено
  addRecentFood: (food: any) => void;
  removeRecentFood: (id: string) => void; // Добавлено
  
  loadProgress: (userId: string) => Promise<void>;
  saveProgress: (userId: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      profile: { language: 'en' },
      setProfile: (data) => set((state) => ({ profile: { ...state.profile, ...data } })),
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      onboarding: {
        section: 'hub',
        basicsStatus: 'todo',
        goalStatus: 'todo',
        programStatus: 'todo',
        answers: {},
      },
      updateOnboarding: (data) => set((state) => ({ 
        onboarding: { ...state.onboarding, ...data } 
      })),
      setAnswer: (key, value) => set((state) => ({
        onboarding: {
          ...state.onboarding,
          answers: { ...state.onboarding.answers, [key]: value }
        }
      })),

      favorites: [],
      searchHistory: [],
      recentFoods: [],
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id) ? state.favorites.filter(f => f !== id) : [...state.favorites, id]
      })),
      isFavorite: (id) => get().favorites.includes(id),
      addSearchQuery: (q) => set((state) => ({
        searchHistory: [q, ...state.searchHistory.filter(i => i !== q)].slice(0, 10)
      })),
      removeSearchQuery: (q) => set((state) => ({
        searchHistory: state.searchHistory.filter(i => i !== q)
      })),
      clearSearchHistory: () => set({ searchHistory: [] }),
      addRecentFood: (food) => set((state) => ({
        recentFoods: [food, ...state.recentFoods.filter(f => f.id !== food.id)].slice(0, 10)
      })),
      removeRecentFood: (id) => set((state) => ({
        recentFoods: state.recentFoods.filter(f => f.id !== id)
      })),

      loadProgress: async (userId) => {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        if (data) {
          set({ 
            onboarding: data.onboarding_data || get().onboarding,
            favorites: data.favorites || [],
            profile: { ...get().profile, ...data.profile_settings }
          });
        }
      },
      saveProgress: async (userId) => {
        const state = get();
        await supabase.from('user_profiles').upsert({
          id: userId,
          onboarding_data: state.onboarding,
          favorites: state.favorites,
          profile_settings: state.profile,
          updated_at: new Date()
        });
      }
    }),
    { name: 'nutrizen-unified-storage' }
  )
);