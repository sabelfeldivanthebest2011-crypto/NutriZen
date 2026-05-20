import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, ChevronLeft, Check, History, Trash2, RotateCcw } from 'lucide-react';
import { db, FoodItem, FoodLog } from '../db/db';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { useStore } from '../store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import Fuse from 'fuse.js';
import { fuseOptions } from '../search';
import { startOfDay, isSameDay } from 'date-fns';
import { Toast } from './ui/Toast';
import { RecipeEditor } from './RecipeEditor';
import { ProductEditor } from './ProductEditor';

// --- TRANSLITERATION AND MORPHOLOGY HELPERS FOR REAL-TIME SEARCH ENGINE ---

function transliterate(word: string): string {
  const map: Record<string, string> = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'z': 'з', 'i': 'и',
    'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с',
    't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'ц', 'ch': 'ч', 'sh': 'ш', 'shh': 'щ',
    'y': 'ы', 'yo': 'ё', 'zh': 'ж', 'kh': 'х', 'ts': 'ц', 'yu': 'ю', 'ya': 'я'
  };
  let res = '';
  let i = 0;
  while (i < word.length) {
    if (i + 2 < word.length && map[word.substr(i, 3)]) {
      res += map[word.substr(i, 3)];
      i += 3;
    } else if (i + 1 < word.length && map[word.substr(i, 2)]) {
      res += map[word.substr(i, 2)];
      i += 2;
    } else if (map[word[i]]) {
      res += map[word[i]];
      i += 1;
    } else {
      res += word[i];
      i += 1;
    }
  }
  return res;
}

function getRussianStem(word: string): string {
  let w = word.toLowerCase().trim().replace(/ё/g, 'е');
  if (w.length <= 3) return w;
  
  const suffixes = [
    /^(.*?)(ыми|ими|ыми|ого|его|ому|ему|ыми|ами|ями|ов|ев|ей|их|ых|ую|юю|ым|им|ом|ем|ой|ей|ах|ях)$/,
    /^(.*?)(ый|ий|ое|ее|ая|яя|ые|ие|ть|ет|ут|ют|ит|ат|ят|ел|ла|ли|ti|ы|и|а|я|о|е|у|ю|ь)$/
  ];

  for (const regex of suffixes) {
    const match = w.match(regex);
    if (match && match[1] && match[1].length >= 3) {
      w = match[1];
      break;
    }
  }

  if (w.startsWith('говяж')) return 'говяд';
  if (w.startsWith('курин')) return 'куриц';
  if (w.startsWith('яблоч')) return 'яблок';
  if (w.startsWith('творож')) return 'творог';
  
  return w;
}

function getEnglishStem(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length <= 3) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export const FoodSearchModal: React.FC<{ 
  onClose: () => void, 
  mealType: string, 
  editingLog?: FoodLog | null, 
  selectedDate?: Date,
  initialTab?: 'search' | 'my-food',
  initialSubTab?: 'recipes' | 'products' | 'favorites'
}> = ({ onClose, mealType, editingLog, selectedDate, initialTab = 'search', initialSubTab = 'favorites' }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(25);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    setDisplayLimit(25);
  }, [debouncedQuery, activeCategory, activeTab, myFoodSubTab]);

  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'my-food'>(initialTab);
  const [myFoodSubTab, setMyFoodSubTab] = useState<'recipes' | 'products' | 'favorites'>(initialSubTab);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'recipe' | 'product' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState(editingLog ? Math.round(editingLog.amount) : 100);
  const { t, lang } = useTranslation();
  const { searchHistory, recentFoods, addSearchQuery, clearSearchHistory, removeSearchQuery, addRecentFood, toggleFavorite, isFavorite, removeRecentFood } = useStore();
  const [toast, setToast] = useState<{ message: string, onUndo?: () => void, isVisible: boolean }>({ message: '', isVisible: false });

  const categories = [
    { id: 'meat', label: lang === 'en' ? 'Meat' : 'Мясо', icon: '🥩' },
    { id: 'fish', label: lang === 'en' ? 'Fish' : 'Рыба', icon: '🐟' },
    { id: 'dairy', label: lang === 'en' ? 'Dairy' : 'Молочка', icon: '🥛' },
    { id: 'grain', label: lang === 'en' ? 'Grains' : 'Крупы', icon: '🌾' },
    { id: 'veggies', label: lang === 'en' ? 'Veggies' : 'Овощи', icon: '🥦' },
    { id: 'fruit', label: lang === 'en' ? 'Fruit' : 'Фрукты', icon: '🍎' },
    { id: 'fats', label: lang === 'en' ? 'Fats' : 'Жиры', icon: '🥑' },
    { id: 'snacks', label: lang === 'en' ? 'Snacks' : 'Снеки', icon: '🍿' },
  ];

  const searchResults = useLiveQuery(
    async () => {
      const allFoods = await db.foods.toArray();
      const recipes = await db.recipes.toArray();
      const favorites = await db.favorites.toArray();
      
      console.log('[DEBUG INDEXEDDB] products.length (allFoods):', allFoods.length);
      console.log('[DEBUG INDEXEDDB] recipes.length:', recipes.length);
      console.log('[DEBUG INDEXEDDB] favorites.length:', favorites.length);
      console.log('[DEBUG SEARCH_QUERY] query (debounced):', debouncedQuery);
      
      const favIds = new Set(favorites.filter(f => f.type === 'food').map(f => f.itemId));
      const favRecipeIds = new Set(favorites.filter(f => f.type === 'recipe').map(f => f.itemId));

      let result: any[] = [];

      if (activeTab === 'search') {
         if (!debouncedQuery.trim() && !activeCategory) return [];

         const mappedRecipes = recipes.map(r => ({
           id: r.id,
           name_en: r.name,
           name_ru: r.name,
           brand: 'Recipe',
           type: 'system',
           source: 'BRAND',
           nutrients_100g: r.total_nutrients,
           quality_score: r.quality_score,
           usage_count: r.usage_count,
           category: r.category,
           isFav: favRecipeIds.has(r.id!)
         } as any));

         const combined = [
           ...allFoods.map(f => ({ ...f, isFav: favIds.has(f.id!) })),
           ...mappedRecipes
         ];

         let pool = activeCategory 
            ? combined.filter(item => item.category?.toLowerCase() === activeCategory.toLowerCase())
            : combined;

         if (debouncedQuery.trim()) {
            const cleanQuery = debouncedQuery.toLowerCase().trim();
            const rawTokens = cleanQuery.split(/[\s—,./()%\-+]+/);
            const transliteratedTokens = rawTokens.map(t => transliterate(t));
            const queryNums = cleanQuery.match(/\d+(\.\d+)?/g)?.map(Number) || [];

            const scoredPool = pool.map(item => {
              const ru = (item.name_ru || '').toLowerCase();
              const en = (item.name_en || '').toLowerCase();
              const br = (item.brand || '').toLowerCase();
              const aliases = item.aliases || [];

              const isExactRu = ru === cleanQuery;
              const isExactEn = en === cleanQuery;
              const isExact = isExactRu || isExactEn;

              const startsWithQueryRu = ru.startsWith(cleanQuery);
              const startsWithQueryEn = en.startsWith(cleanQuery);
              const startsWithQuery = startsWithQueryRu || startsWithQueryEn;

              let matchedWords = 0;
              const uniqueWords = Array.from(new Set([...rawTokens, ...transliteratedTokens]));
              const significantWords = uniqueWords.filter(w => w.length > 1 || uniqueWords.length === 1);

              significantWords.forEach(qw => {
                const qwStem = getRussianStem(qw);
                const qwEnStem = getEnglishStem(qw);
                let matched = false;

                if (ru.includes(qw) || en.includes(qw) || br.includes(qw)) {
                  matched = true;
                } else if (aliases.some((al: string) => {
                  const alLower = al.toLowerCase();
                  return alLower === qw || alLower === qwStem || alLower === qwEnStem || alLower.includes(qw);
                })) {
                  matched = true;
                } else {
                  const itemParts = [...ru.split(/[\s—,./()%\-+]+/), ...en.split(/[\s—,./()%\-+]+/)];
                  for (const ip of itemParts) {
                    if (ip.length > 1) {
                      const ipStem = getRussianStem(ip);
                      const ipEnStem = getEnglishStem(ip);
                      if (ip === qw || ipStem === qwStem || ipEnStem === qwEnStem || ip.startsWith(qw) || ipStem.startsWith(qwStem)) {
                        matched = true;
                        break;
                      }
                    }
                  }
                }

                if (matched) matchedWords++;
              });

              const matchFraction = significantWords.length > 0 ? (matchedWords / significantWords.length) : 0;

              // Percentage awareness matching
              let numericBonus = 0;
              if (queryNums.length > 0) {
                const itemNums = ru.match(/\d+(\.\d+)?/g)?.map(Number) || [];
                const matchedAnyNum = queryNums.some(qn => itemNums.includes(qn));
                if (matchedAnyNum) {
                  numericBonus = 0.5;
                }
              } else {
                if (ru.includes('масло сливочное') || ru.includes('сливочное масло')) {
                  if (ru.includes('82.5')) numericBonus = 0.08;
                  else if (ru.includes('72.5')) numericBonus = 0.04;
                } else if (ru.includes('творог')) {
                  if (ru.includes('5%') || ru.includes(' 5')) numericBonus = 0.08;
                  else if (ru.includes('9%') || ru.includes(' 9')) numericBonus = 0.06;
                } else if (ru.includes('молоко') || ru.includes('кефир')) {
                  if (ru.includes('2.5%') || ru.includes(' 2.5')) numericBonus = 0.08;
                  else if (ru.includes('3.2%') || ru.includes(' 3.2')) numericBonus = 0.07;
                }
              }

              // Set discrete relevance tiers
              let tier = 4; // default fuzzy or weak Match
              if (isExact) {
                tier = 1;
              } else if (startsWithQuery && matchFraction >= 0.75) {
                tier = 1;
              } else if (matchFraction === 1.0) {
                tier = 2;
              } else if (matchFraction >= 0.49) {
                tier = 3;
              } else if (matchFraction > 0) {
                tier = 4;
              }

              let priorityScore = 0;
              if (item.isFav) priorityScore += 1000;
              if (item.usage_count > 0) priorityScore += Math.min(10, item.usage_count) * 20;
              if (item.type === 'user') priorityScore += 500;
              if (item.brand === 'Recipe') priorityScore += 250;
              if (item.source === 'BRAND') priorityScore += 100;
              if (item.source === 'USDA') priorityScore += 50;

              // Combined multi-dimensional score
              const rankingScore = (matchFraction * 800) + priorityScore + (numericBonus * 1000) + (item.quality_score || 80);

              return {
                ...item,
                tier,
                rankingScore,
                matchFraction
              };
            });

            // If we have items in Tier 1 or Tier 2, completely suppress Tier 4 weak fuzzy slop!
            const hasGoodMatches = scoredPool.some(it => it.tier <= 2);
            let filteredResults = scoredPool;
            if (hasGoodMatches) {
              filteredResults = scoredPool.filter(it => it.tier <= 3);
            } else {
              filteredResults = scoredPool.filter(it => it.matchFraction > 0);
            }

            // Fallback to Fuse if still empty
            if (filteredResults.length === 0) {
               const fuse = new Fuse(pool, {
                  ...fuseOptions,
                  shouldSort: false,
                  threshold: 0.45,
                  keys: ['name_en', 'name_ru']
               });
               const fuseResults = fuse.search(debouncedQuery.trim());
               filteredResults = fuseResults.map(r => ({
                  ...r.item,
                  tier: 4,
                  rankingScore: (1 - (r.score || 0)) * 50,
                  matchFraction: 0.1
               }));
            }

            // Sort by Tier, then by score
            filteredResults.sort((a, b) => {
              if (a.tier !== b.tier) {
                return a.tier - b.tier; // T1 > T2 > T3 > T4
              }
              return (b.rankingScore || 0) - (a.rankingScore || 0);
            });

            result = filteredResults;
         } else {
            result = pool.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
         }

      } else {
         if (myFoodSubTab === 'products') {
            result = allFoods.filter(f => f.type === 'user').map(f => ({...f, isFav: favIds.has(f.id!), sourceLabel: 'Custom'}));
         } else if (myFoodSubTab === 'favorites') {
            const favProducts = allFoods.filter(f => favIds.has(f.id!)).map(f => ({ ...f, isFav: true, sourceLabel: f.type === 'user' ? 'Custom' : 'DB' }));
            const favRecipes = recipes.filter(r => favRecipeIds.has(r.id!)).map(r => ({
               id: r.id,
               name_en: r.name,
               name_ru: r.name,
               brand: 'Recipe',
               type: 'system' as const,
               source: 'BRAND' as const,
               nutrients_100g: r.total_nutrients || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
               quality_score: r.quality_score,
               usage_count: r.usage_count,
               category: r.category,
               isFav: true,
               sourceLabel: 'Recipe'
            }));
            result = [...favProducts, ...favRecipes];
         } else if (myFoodSubTab === 'recipes') {
            result = recipes.map(r => ({
               id: r.id,
               name_en: r.name,
               name_ru: r.name,
               brand: 'Recipe',
               type: 'system' as const,
               source: 'BRAND' as const,
               nutrients_100g: r.total_nutrients || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
               quality_score: r.quality_score,
               usage_count: r.usage_count,
               category: r.category,
               isFav: favRecipeIds.has(r.id!),
               sourceLabel: 'Recipe'
            }));
         }
      }
      
      return result;
    },
    [debouncedQuery, recentFoods, activeTab, myFoodSubTab, activeCategory]
  );
  
  const totalFavs = useLiveQuery(() => db.favorites.count()) || 0;
  const totalRecipes = useLiveQuery(() => db.recipes.count()) || 0;
  const totalProducts = useLiveQuery(() => db.foods.where('type').equals('user').count()) || 0;


  const handleSaveLog = async (food: FoodItem, amount: number) => {
    const timestamp = selectedDate && isSameDay(selectedDate, new Date()) ? Date.now() : startOfDay(selectedDate || new Date()).getTime() + 12 * 60 * 60 * 1000; 
    const safeAmount = Math.max(0, amount);
    const multiplier = safeAmount / 100;

    const nut100 = food.nutrients_100g || {
      calories: (food as any).calories || 0,
      protein: (food as any).protein || 0,
      carbs: (food as any).carbs || 0,
      fat: (food as any).fat || 0,
      fiber: (food as any).fiber || 0,
      sugar: (food as any).sugar || 0,
      potassium_mg: (food as any).potassium_mg || 0,
      calcium_mg: (food as any).calcium_mg || 0,
      iron_mg: (food as any).iron_mg || 0,
      magnesium_mg: (food as any).magnesium_mg || 0,
      zinc_mg: (food as any).zinc_mg || 0,
      vitamin_d_mcg: (food as any).vitamin_d_mcg || 0,
      vitamin_b12_mcg: (food as any).vitamin_b12_mcg || 0,
      cholesterol_mg: (food as any).cholesterol_mg || 0,
      sodium_mg: (food as any).sodium_mg || 0,
    };

    const payload: FoodLog = {
      foodId: food.id,
      name_en: food.name_en,
      name_ru: food.name_ru,
      brand: food.brand,
      nutrients: {
        calories: nut100.calories * multiplier,
        protein: nut100.protein * multiplier,
        carbs: nut100.carbs * multiplier,
        fat: nut100.fat * multiplier,
        fiber: (nut100.fiber || 0) * multiplier,
        sugar: (nut100.sugar || 0) * multiplier,
        potassium_mg: (nut100.potassium_mg || 0) * multiplier,
        calcium_mg: (nut100.calcium_mg || 0) * multiplier,
        iron_mg: (nut100.iron_mg || 0) * multiplier,
        magnesium_mg: (nut100.magnesium_mg || 0) * multiplier,
        zinc_mg: (nut100.zinc_mg || 0) * multiplier,
        vitamin_d_mcg: (nut100.vitamin_d_mcg || 0) * multiplier,
        vitamin_b12_mcg: (nut100.vitamin_b12_mcg || 0) * multiplier,
        cholesterol_mg: (nut100.cholesterol_mg || 0) * multiplier,
        sodium_mg: (nut100.sodium_mg || 0) * multiplier,
      },
      amount: safeAmount,
      mealType: mealType,
      timestamp: editingLog ? editingLog.timestamp : timestamp,
      source: food.source
    };

    if (editingLog) {
      await db.logs.update(editingLog.id!, payload);
    } else {
      await db.logs.add(payload);
      if (food.id) {
        await db.foods.update(food.id, { 
          usage_count: (food.usage_count || 0) + 1,
          last_used: Date.now()
        });
      }
      addRecentFood(payload as any);
      addSearchQuery(query);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 lg:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={cn(
          "bg-[#FAFAF8] w-full shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
          isFullscreen 
            ? "fixed inset-0 z-[120] h-screen max-w-none rounded-none" 
            : "max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] h-[95vh] border border-gray-100"
        )}
      >
        <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (isFullscreen) {
                      setIsFullscreen(false);
                    } else {
                      onClose();
                    }
                  }} 
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100 text-gray-400"
                >
                  <ChevronLeft size={24} />
                </button>
                <div>
                   <h2 className="text-xl font-display font-black text-gray-900 tracking-tight">{editingLog ? t('common.edit') : t('diary.search_food')}</h2>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{mealType}</span>
                </div>
             </div>
          </div>
          
          <div className="flex bg-gray-50 p-1 rounded-2xl mb-4 border border-gray-100">
             {(['search', 'my-food'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                    activeTab === tab ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-gray-900"
                  )}
                >
                  {tab === 'search' ? t('diary.global_search') : t('diary.my_ecosystem')}
                </button>
             ))}
          </div>

          {activeTab === 'my-food' && (
            <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="flex gap-2">
                 {(['favorites', 'recipes', 'products'] as const).map((sub) => (
                  <button 
                    key={sub}
                    onClick={() => setMyFoodSubTab(sub)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all border relative flex flex-col items-center gap-1",
                      myFoodSubTab === sub ? "bg-black text-white border-black shadow-lg" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {t(`diary.${sub}`)}
                    <div className={cn("text-[8px] opacity-60", myFoodSubTab === sub ? "text-gray-400" : "text-gray-500")}>
                       {sub === 'favorites' ? totalFavs : sub === 'recipes' ? totalRecipes : totalProducts} {t('diary.items_count')}
                    </div>
                  </button>
                 ))}
               </div>

               {myFoodSubTab !== 'favorites' && (
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setEditorMode(myFoodSubTab === 'recipes' ? 'recipe' : 'product')}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-900 py-4 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                       <Plus size={16} /> {myFoodSubTab === 'recipes' ? t('diary.add_custom_recipe') : t('diary.add_custom_product')}
                    </button>
                 </div>
               )}
            </div>
          )}
          
          {activeTab === 'search' && !editingLog && !editorMode && (
            <div className={cn(
               "relative mb-4 group transition-all",
               isSearching ? "scale-100" : "scale-[0.98]"
            )}>
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
              <input 
                autoFocus
                type="text"
                inputMode="search"
                placeholder={t('diary.search_food') || "Search brands, names, aliases..."}
                value={query ?? ''}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsSearching(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsFullscreen(true);
                  }
                }}
                className="w-full bg-gray-50 rounded-2xl py-5 pl-14 pr-6 outline-none text-gray-900 font-bold text-lg border border-gray-100 focus:border-gray-200 focus:bg-white transition-all shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <Toast 
            isVisible={toast.isVisible} 
            message={toast.message} 
            onUndo={toast.onUndo} 
            onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
          />
          {editorMode === 'recipe' && (
            <RecipeEditor 
              recipe={editingItem} 
              onClose={() => { setEditorMode(null); setEditingItem(null); }} 
            />
          )}
          {editorMode === 'product' && (
            <ProductEditor 
              product={editingItem} 
              onClose={() => { setEditorMode(null); setEditingItem(null); }} 
            />
          )}

          {!editorMode && (selectedFood || editingLog) ? (() => {
             const activeItem = selectedFood || editingLog;
             const name = lang === 'ru' 
               ? (activeItem?.name_ru || (activeItem as any)?.name_en || (activeItem as any)?.name || '')
               : ((activeItem as any)?.name_en || activeItem?.name_ru || (activeItem as any)?.name || '');

             let activeNutrients100g = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
             if (selectedFood) {
               activeNutrients100g = selectedFood.nutrients_100g || activeNutrients100g;
             } else if (editingLog) {
               if (editingLog.nutrients) {
                 const amt = editingLog.amount || 100;
                 const factor = 100 / amt;
                 activeNutrients100g = {
                   calories: (editingLog.nutrients.calories || 0) * factor,
                   protein: (editingLog.nutrients.protein || 0) * factor,
                   carbs: (editingLog.nutrients.carbs || 0) * factor,
                   fat: (editingLog.nutrients.fat || 0) * factor,
                   fiber: (editingLog.nutrients.fiber || 0) * factor,
                   sugar: (editingLog.nutrients.sugar || 0) * factor,
                 };
               } else {
                 activeNutrients100g = {
                   calories: (editingLog as any).calories || 0,
                   protein: (editingLog as any).protein || 0,
                   carbs: (editingLog as any).carbs || 0,
                   fat: (editingLog as any).fat || 0,
                   fiber: (editingLog as any).fiber || 0,
                   sugar: (editingLog as any).sugar || 0,
                 };
               }
             }

             return (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                {!editingLog && (
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="mb-6 text-[10px] font-black text-white flex items-center gap-1 hover:text-white transition-colors px-4 py-2 rounded-xl uppercase tracking-widest bg-white/5 border border-white/10"
                  >
                    <ChevronLeft size={16} /> Назад
                  </button>
                )}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-8">
                   <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-black text-gray-900 tracking-tight">
                           {name}
                        </h3>
                        {((selectedFood || editingLog) as any).brand && <div className="text-xs text-gray-400 font-bold mb-2 tracking-tight">{((selectedFood || editingLog) as any).brand}</div>}
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-2">
                          <Check size={12} className="text-green-500" /> {t('diary.per_100g')}
                          {((selectedFood || editingLog) as any).sourceLabel === 'Recipe' && (
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const r = await db.recipes.get((selectedFood || editingLog)!.id!);
                                 setEditingItem(r);
                                 setEditorMode('recipe');
                               }}
                               className="ml-2 text-primary-600 hover:underline"
                             >
                               {t('diary.edit_recipe')}
                             </button>
                          )}
                          {((selectedFood || editingLog) as any).type === 'user' && (
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const p = await db.foods.get((selectedFood || editingLog)!.id!);
                                 setEditingItem(p);
                                 setEditorMode('product');
                               }}
                               className="ml-2 text-primary-600 hover:underline"
                             >
                               {t('diary.edit_product')}
                             </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl text-center min-w-[80px] border border-gray-100 shadow-inner">
                         <div className="text-xl font-display font-black text-gray-900">{Math.round((activeNutrients100g.calories * customAmount) / 100)}</div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ккал</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <MacroDetail val={Number(((activeNutrients100g.protein * customAmount) / 100).toFixed(1))} label={t('dashboard.protein')} color="text-blue-500" />
                      <MacroDetail val={Number(((activeNutrients100g.carbs * customAmount) / 100).toFixed(1))} label={t('dashboard.carbs')} color="text-amber-500" />
                      <MacroDetail val={Number(((activeNutrients100g.fat * customAmount) / 100).toFixed(1))} label={t('dashboard.fat')} color="text-rose-500" />
                   </div>

                   <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('diary.amount_g')}</label>
                        <div className="text-xs font-bold text-gray-900">{t('diary.total')}: {customAmount}g</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setCustomAmount(Math.max(0, customAmount - 10))} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-gray-900 text-xl font-bold border border-gray-100 shadow-sm">-</button>
                        <input 
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                          className="flex-1 bg-transparent border-none outline-none font-display font-black text-4xl text-gray-900 text-center"
                        />
                        <button onClick={() => setCustomAmount(customAmount + 10)} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-gray-900 text-xl font-bold border border-gray-100 shadow-sm">+</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-8">
                         {[50, 100, 200, 500].map(val => (
                            <button 
                              key={val}
                              onClick={() => setCustomAmount(val)}
                              className={cn(
                                "py-3 rounded-xl text-[10px] font-black transition-all border",
                                customAmount === val ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100"
                              )}
                            >
                               {val}g
                            </button>
                         ))}
                      </div>
                   </div>

                   <button 
                    onClick={() => handleSaveLog((selectedFood || editingLog)!, customAmount)}
                    className="w-full bg-black text-white rounded-[1.5rem] py-5 font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {editingLog ? t('diary.update_entry') : t('diary.add_to_diary')}
                  </button>
                </div>
             </div>
             );
          })() : (
            <div className="space-y-6">
              {!query && !activeCategory && (
                <div className="space-y-8 animate-in fade-in duration-500 text-gray-900">
                  {searchHistory.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Searches</h4>
                        <button onClick={clearSearchHistory} className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors">Clear All</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {searchHistory.map((q, i) => (
                           <button 
                             key={i} 
                             onClick={() => setQuery(q)}
                             className="bg-white hover:bg-gray-50 text-gray-900 text-xs font-bold px-4 py-2 rounded-full border border-gray-100 transition-colors flex items-center gap-2 group shadow-sm"
                           >
                             <History size={12} className="text-gray-300 group-hover:text-gray-900" />
                             {q}
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  {recentFoods.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Недавно добавлено</h4>
                      <div className="grid grid-cols-1 gap-2">
                         {recentFoods.slice(0, 5).map((food, i) => (
                           <div 
                             key={i}
                             className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center group shadow-sm"
                            >
                             <button 
                               onClick={() => setSelectedFood(food)}
                               className="flex-1 text-left"
                             >
                               <div className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                                  {food.name}
                               </div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{food.calories} ккал • {Math.round(food.amount || 100)}г</div>
                             </button>
                             <div className="flex items-center gap-2">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   removeRecentFood(food.name);
                                   setToast({
                                     message: 'Удалено из недавних',
                                     isVisible: true,
                                     onUndo: () => addRecentFood(food)
                                   });
                                 }}
                                 className="w-10 h-10 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-white transition-all shadow-sm"
                               >
                                 <Trash2 size={16} />
                               </button>
                               <RotateCcw size={16} className="text-gray-200" />
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {searchResults?.slice(0, displayLimit).map((food: any) => (
                <div 
                  key={food.id}
                  className="w-full p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center group transition-all hover:border-primary-100 shadow-sm active:scale-[0.99] relative"
                >
                  <button 
                    onClick={() => {
                      setSelectedFood(food);
                      addSearchQuery(query);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-tight flex items-center gap-2">
                      {lang === 'ru' ? food.name_ru : food.name_en}
                      {food.source === 'BRAND' && food.type === 'system' && <span className="bg-primary-50 text-primary-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Бренд</span>}
                      {food.type === 'user' && <span className="bg-amber-50 text-amber-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Свой</span>}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-2">
                      <span className="text-gray-300 font-black">{food.brand || food.source}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span className="text-gray-600 font-black text-xs">{food.quality_score} IQ</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span className="text-gray-600">{(food.nutrients_100g?.calories ?? food.calories ?? 0)} ккал</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span>{(food.nutrients_100g?.protein ?? food.protein ?? 0)}г Б</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span>{(food.nutrients_100g?.carbs ?? food.carbs ?? 0)}г У</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const type = food.brand === 'Recipe' ? 'recipe' : 'food';
                        toggleFavorite(type, food.id!);
                      }}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        food.isFav ? "text-rose-500 bg-rose-50" : "text-gray-200 hover:text-rose-500 hover:bg-rose-50"
                      )}
                    >
                      <motion.div whileTap={{ scale: 0.8 }}>
                        <svg 
                          width="20" height="20" viewBox="0 0 24 24" 
                          fill={food.isFav ? "currentColor" : "none"} 
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </motion.div>
                    </button>
                    <button 
                      onClick={() => setSelectedFood(food)}
                      className="p-2 text-gray-200 hover:text-black transition-colors"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              ))}

              {searchResults && searchResults.length > displayLimit && (
                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => setDisplayLimit(prev => prev + 25)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                  >
                    {lang === 'ru' ? 'Показать еще' : 'Load More'} ({searchResults.length - displayLimit} {lang === 'ru' ? 'осталось' : 'remaining'})
                  </button>
                </div>
              )}

              {query && searchResults?.length === 0 && (
                <div className="text-center py-20 animate-in fade-in duration-500">
                  <p className="text-gray-900 font-black text-lg">{t('diary.no_results_found')}</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-[200px] mx-auto font-medium">"{query}" {t('diary.not_in_db')}</p>
                  <button 
                    onClick={() => {
                        const custom: FoodItem = { 
                           id: 0, 
                           name_en: query, 
                           name_ru: query,
                           brand: t('diary.create_custom'),
                           type: 'user',
                           source: 'USER',
                           nutrients_100g: {
                             calories: 100,
                             protein: 10,
                             carbs: 10,
                             fat: 2,
                             sugar: 0,
                             fiber: 0
                           },
                           quality_score: 100,
                           usage_count: 0,
                           category: 'snacks'
                         };
                        setSelectedFood(custom);
                    }}
                    className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
                  >
                    + {t('diary.create_custom')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const MacroDetail: React.FC<{ val: number, label: string, color: string }> = ({ val, label, color }) => (
  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center flex flex-col items-center shadow-inner">
    <div className={cn("text-lg font-display font-black", color)}>{val}g</div>
    <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{label}</div>
  </div>
);

export const MacroBox: React.FC<{ val: number, label: string, color: string, text: string }> = ({ val, label, color, text }) => (
  <div className={cn("p-5 rounded-[2rem] text-center shadow-lg border border-white/50", color)}>
    <div className={cn("text-xl font-display font-black", text)}>{val}{label === 'kcal' ? '' : 'g'}</div>
    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{label}</div>
  </div>
);
