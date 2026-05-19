import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../lib/i18n';
import { db } from '../db/db';

interface UserProfile {
  name: string;
  goal: 'lose' | 'maintain' | 'gain';
  gender: 'male' | 'female' | 'other';
  age: number;
  birthDate?: string;
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: number;
  stepsPerDay: number;
  workoutsPerWeek: number;
  speedKgsPerWeek: number; 
  trainingType?: 'gym' | 'calisthenics' | 'mixed' | 'none';
  trainingFrequency?: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  hasCardio?: boolean;
  cardioFrequency?: number;
  stepsRange?: '<5000' | '5000-10000' | '10000-15000' | '15000+';
  lifestyle?: 'sedentary' | 'active' | 'very active';
  macroPreference: 'balanced' | 'high-protein' | 'low-fat' | 'custom';
  isAdaptiveEnabled: boolean;
  notificationsEnabled: boolean;
  language: Language;
  mealStructure: { id: string; name: string; icon: string; time: string }[];
  bodyFat: number;
  weightRecentTrend?: 'stable' | 'gaining' | 'losing' | 'fluctuating';
  theme: 'light' | 'dark' | 'system' | 'amoled';
  manualMacroTargets: {
    mode: 'grams' | 'percent';
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  useManualMacros: boolean;
}

interface AppState {
  isOnboarded: boolean;
  profile: UserProfile;
  activeTab: 'home' | 'diary' | 'analytics' | 'profile';
  activeDashboardTab: 'nutrition' | 'education';
  lastTDEECorrection: number;
  adaptiveTDEE: number;
  searchHistory: string[];
  recentFoods: any[];
  setProfile: (profile: Partial<UserProfile>) => void;
  confirmOnboarding: () => Promise<void>;
  addSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  removeSearchQuery: (query: string) => void;
  addRecentFood: (food: any) => void;
  setActiveTab: (tab: 'home' | 'diary' | 'analytics' | 'profile') => void;
  setActiveDashboardTab: (tab: 'nutrition' | 'education') => void;
  updateAdaptiveTDEE: (newTDEE: number) => void;
  setIsOnboarded: (status: boolean) => void;
  updateTargetValue: (key: 'bmr' | 'tdee' | 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar', value: number) => void;
  toggleFavorite: (type: 'food' | 'recipe', itemId: number) => Promise<void>;
  isFavorite: (type: 'food' | 'recipe', itemId: number) => Promise<boolean>;
  resetAll: () => void;
  calculatedTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    bmr: number;
    tdee: number;
  };
}

const DEFAULT_MEALS = [
  { id: 'breakfast', name: 'Breakfast', icon: '☀️', time: '08:00' },
  { id: 'lunch', name: 'Lunch', icon: '🍱', time: '13:00' },
  { id: 'dinner', name: 'Dinner', icon: '🍽️', time: '19:00' },
  { id: 'snack', name: 'Snacks', icon: '🍎', time: '16:00' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      activeTab: 'home',
      activeDashboardTab: 'nutrition',
      lastTDEECorrection: Date.now(),
      adaptiveTDEE: 2500,
      searchHistory: [],
      recentFoods: [],
      profile: {
        name: '',
        goal: 'maintain',
        gender: 'other',
        age: 25,
        height: 175,
        weight: 70,
        targetWeight: 70,
        activityLevel: 1.2,
        stepsPerDay: 5000,
        workoutsPerWeek: 3,
        speedKgsPerWeek: 0,
        bodyFat: 15,
        lifestyle: 'sedentary',
        macroPreference: 'balanced',
        isAdaptiveEnabled: true,
        notificationsEnabled: false,
        language: 'en',
        theme: 'light',
        mealStructure: DEFAULT_MEALS,
        useManualMacros: false,
        manualMacroTargets: {
          mode: 'percent',
          protein: 25,
          carbs: 50,
          fat: 25,
          fiber: 25,
          sugar: 50,
        }
      },
      calculatedTargets: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 25,
        sugar: 50,
        bmr: 1600,
        tdee: 2000,
      },
      setIsOnboarded: (status) => set({ isOnboarded: status }),
      confirmOnboarding: async () => {
        const { profile } = get();
        await db.weight.add({
          weight: profile.weight,
          timestamp: Date.now()
        });
        set({ isOnboarded: true });
      },
      addSearchQuery: (query) => {
        if (!query.trim()) return;
        const current = get().searchHistory;
        const filtered = current.filter(q => q.toLowerCase() !== query.toLowerCase());
        set({ searchHistory: [query, ...filtered].slice(0, 15) });
      },
      clearSearchHistory: () => set({ searchHistory: [] }),
      removeSearchQuery: (query) => set({ searchHistory: get().searchHistory.filter(q => q !== query) }),
      addRecentFood: (food) => {
        const current = get().recentFoods;
        const filtered = current.filter(f => f.name !== food.name || f.brand !== food.brand);
        set({ recentFoods: [food, ...filtered].slice(0, 15) });
      },
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),
      updateAdaptiveTDEE: (newTDEE) => {
        set({ adaptiveTDEE: Math.round(newTDEE) });
        get().setProfile({}); // Recalculate
      },
      resetAll: () => {
        set({ 
          isOnboarded: false,
          activeTab: 'home',
          activeDashboardTab: 'nutrition',
          adaptiveTDEE: 2500,
          profile: {
            name: '',
            goal: 'maintain',
            gender: 'other',
            age: 25,
            height: 175,
            weight: 70,
            targetWeight: 70,
            activityLevel: 1.2,
            stepsPerDay: 5000,
            workoutsPerWeek: 3,
            speedKgsPerWeek: 0,
            bodyFat: 15,
            lifestyle: 'sedentary',
            macroPreference: 'balanced',
            isAdaptiveEnabled: true,
            notificationsEnabled: false,
            language: 'en',
            theme: 'light',
            mealStructure: DEFAULT_MEALS,
            useManualMacros: false,
            manualMacroTargets: {
              mode: 'percent',
              protein: 25,
              carbs: 50,
              fat: 25,
              fiber: 25,
              sugar: 50,
            }
          }
        });
        localStorage.removeItem('nutrizen-storage');
      },
      updateTargetValue: (key, value) => {
        if (!Number.isFinite(value)) return;
        
        const current = get().calculatedTargets;
        const profile = get().profile;
        let { bmr, tdee, calories, protein, carbs, fat, fiber, sugar } = current;

        const val = Math.max(0, value);

        if (key === 'bmr') {
          bmr = val;
          tdee = bmr * 1.2; 
          calories = tdee + (profile.goal === 'lose' ? -500 : profile.goal === 'gain' ? 250 : 0);
        } else if (key === 'tdee') {
          tdee = val;
          calories = tdee + (profile.goal === 'lose' ? -500 : profile.goal === 'gain' ? 250 : 0);
          set({ adaptiveTDEE: Math.round(tdee) });
        } else if (key === 'calories') {
          calories = val;
          const totalCals = (protein * 4 + carbs * 4 + fat * 9) || 2000;
          const pRatio = (protein * 4) / totalCals;
          const fRatio = (fat * 9) / totalCals;
          const cRatio = (carbs * 4) / totalCals;
          
          protein = (calories * pRatio) / 4;
          fat = (calories * fRatio) / 9;
          carbs = (calories * cRatio) / 4;
        } else {
          if (key === 'protein') protein = val;
          else if (key === 'carbs') carbs = val;
          else if (key === 'fat') fat = val;
          else if (key === 'fiber') fiber = val;
          else if (key === 'sugar') sugar = val;
          
          calories = protein * 4 + carbs * 4 + fat * 9;
        }

        set({
          calculatedTargets: {
            ...current,
            bmr: Math.round(bmr || 1600),
            tdee: Math.round(tdee || 2000),
            calories: Math.round(calories || 2000),
            protein: Math.round(protein || 150),
            carbs: Math.round(carbs || 250),
            fat: Math.round(fat || 65),
            fiber: Math.round(fiber || 25),
            sugar: Math.round(sugar || 50)
          }
        });
      },
      toggleFavorite: async (type, itemId) => {
        const existing = await db.favorites.where({ type, itemId }).first();
        if (existing) {
          await db.favorites.delete(existing.id!);
        } else {
          await db.favorites.add({ type, itemId });
        }
        set({ lastTDEECorrection: Date.now() }); 
      },
      isFavorite: async (type, itemId) => {
        const fav = await db.favorites.where({ type, itemId }).first();
        return !!fav;
      },
      setProfile: async (newProfile) => {
        const currentProfile = get().profile;
        const updatedProfile = { ...currentProfile, ...newProfile };
        
        // Auto-calculate Age if birthDate changed
        if (newProfile.birthDate) {
          const birth = new Date(newProfile.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          updatedProfile.age = age;
        }

        const { weight = 70, height = 175, age = 25, gender = 'other', goal = 'maintain', trainingFrequency = 0, stepsRange, hasCardio, cardioFrequency = 0, experienceLevel, bodyFat = 15, lifestyle = 'sedentary' } = updatedProfile;
        
        // 1. BMR (Mifflin-St Jeor) - Ensure finite values
        let safeW = Number.isFinite(weight) ? weight : 70;
        let safeH = Number.isFinite(height) ? height : 175;
        let safeA = Number.isFinite(age) ? age : 25;

        let bmr = (10 * safeW) + (6.25 * safeH) - (5 * safeA);
        if (gender === 'male') bmr += 5;
        else if (gender === 'female') bmr -= 161;

        // 2. Base Activity Multiplier
        let multiplier = 1.2; // Sedentary
        if (lifestyle === 'very active') multiplier = 1.725;
        else if (lifestyle === 'active') multiplier = 1.55;
        
        // Refine with training frequency
        if (trainingFrequency >= 6) multiplier = Math.max(multiplier, 1.9); // Athlete
        else if (trainingFrequency >= 4) multiplier = Math.max(multiplier, 1.725);
        else if (trainingFrequency >= 3) multiplier = Math.max(multiplier, 1.55);
        else if (trainingFrequency >= 1) multiplier = Math.max(multiplier, 1.375);

        // 3. NEAT Adjustment (Steps)
        let stepAdj = 0;
        if (stepsRange === '5000-10000') stepAdj = 100;
        else if (stepsRange === '10000-15000') stepAdj = 200;
        else if (stepsRange === '15000+') stepAdj = 350;

        // 4. Cardio
        let cardioAdj = 0;
        if (hasCardio) {
          cardioAdj = cardioFrequency * 30; // ~30 calories per session average or fixed rate
        }

        // 5. Body Fat Correction Factor (Lean Factor)
        const leanFactor = 1 + (bodyFat - 15) * 0.005;

        let tdee = (bmr * multiplier * leanFactor) + stepAdj + cardioAdj;

        // 6. Target Calories based on Goal
        let targetCalories = tdee;
        if (goal === 'lose') targetCalories *= 0.8; // Stable 20% deficit
        else if (goal === 'gain') targetCalories *= 1.1; // 10% surplus

        // Security bounds
        const minCals = gender === 'female' ? 1200 : 1500;
        targetCalories = Math.max(targetCalories, minCals);

        let protein, carbs, fat, fiber, sugar;

        if (updatedProfile.useManualMacros && updatedProfile.manualMacroTargets) {
          const m = updatedProfile.manualMacroTargets;
          if (m.mode === 'grams') {
            protein = m.protein;
            carbs = m.carbs;
            fat = m.fat;
          } else {
            protein = (targetCalories * (m.protein / 100)) / 4;
            carbs = (targetCalories * (m.carbs / 100)) / 4;
            fat = (targetCalories * (m.fat / 100)) / 9;
          }
          fiber = m.fiber;
          sugar = m.sugar;
        } else {
          // Defaults based on goal/weight
          protein = weight * 2; // Default 2g/kg
          fat = weight * 0.8;    // Default 0.8g/kg
          carbs = (targetCalories - (protein * 4) - (fat * 9)) / 4;
          fiber = Math.min(Math.max(updatedProfile.weight * 0.4, 25), 50);
          sugar = 50;
        }

        set({ 
          profile: updatedProfile,
          adaptiveTDEE: Math.round(tdee),
          calculatedTargets: {
            calories: Math.round(targetCalories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            fiber: Math.round(fiber),
            sugar: Math.round(sugar),
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
          }
        });
      },
    }),
    {
      name: 'nutrizen-storage',
    }
  )
);
