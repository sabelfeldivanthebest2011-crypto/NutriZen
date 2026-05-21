import React, { useState, useEffect } from 'react';
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

// --- TRANSLITERATION AND MORPHOLOGY HELPERS ---

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

  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'my-food'>(initialTab);
  const [myFoodSubTab, setMyFoodSubTab] = useState<'recipes' | 'products' | 'favorites'>(initialSubTab);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'recipe' | 'product' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState(editingLog ? Math.round(editingLog.amount) : 100);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    setDisplayLimit(25);
  }, [debouncedQuery, activeCategory, activeTab, myFoodSubTab]);

  const { t, lang } = useTranslation();

  // ИСПРАВЛЕННЫЙ БЛОК STORE
  const { 
    searchHistory, 
    recentFoods, 
    addSearchQuery, 
    clearSearchHistory, 
    removeSearchQuery, 
    addRecentFood, 
    isFavorite, 
    removeRecentFood,
    toggleFavorite 
  } = useStore();

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

              const isExact = ru === cleanQuery || en === cleanQuery;
              const startsWithQuery = ru.startsWith(cleanQuery) || en.startsWith(cleanQuery);

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
              let tier = 4;
              if (isExact) tier = 1;
              else if (startsWithQuery && matchFraction >= 0.75) tier = 1;
              else if (matchFraction === 1.0) tier = 2;
              else if (matchFraction >= 0.49) tier = 3;
              else if (matchFraction > 0) tier = 4;

              let priorityScore = 0;
              if (item.isFav) priorityScore += 1000;
              if (item.usage_count > 0) priorityScore += Math.min(10, item.usage_count) * 20;
              if (item.type === 'user') priorityScore += 500;
              if (item.brand === 'Recipe') priorityScore += 250;

              const rankingScore = (matchFraction * 800) + priorityScore + (item.quality_score || 80);

              return { ...item, tier, rankingScore, matchFraction };
            });

            const hasGoodMatches = scoredPool.some(it => it.tier <= 2);
            let filteredResults = hasGoodMatches ? scoredPool.filter(it => it.tier <= 3) : scoredPool.filter(it => it.matchFraction > 0);

            filteredResults.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : (b.rankingScore || 0) - (a.rankingScore || 0));
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
               id: r.id, name_en: r.name, name_ru: r.name, brand: 'Recipe', nutrients_100g: r.total_nutrients, isFav: true, sourceLabel: 'Recipe'
            }));
            result = [...favProducts, ...favRecipes];
         } else if (myFoodSubTab === 'recipes') {
            result = recipes.map(r => ({
               id: r.id, name_en: r.name, name_ru: r.name, brand: 'Recipe', nutrients_100g: r.total_nutrients, isFav: favRecipeIds.has(r.id!), sourceLabel: 'Recipe'
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ (РЕШАЕТ ОШИБКУ ts(2740))
  const handleSaveLog = async (food: FoodItem, amount: number) => {
    const timestamp = selectedDate && isSameDay(selectedDate, new Date()) ? Date.now() : startOfDay(selectedDate || new Date()).getTime() + 12 * 60 * 60 * 1000; 
    const safeAmount = Math.max(0, amount);
    const multiplier = safeAmount / 100;

    const n100 = food.nutrients_100g || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const payload: FoodLog = {
      foodId: food.id,
      name_en: food.name_en || '',
      name_ru: food.name_ru || '',
      brand: food.brand,
      amount: safeAmount,
      mealType: mealType,
      timestamp: editingLog ? editingLog.timestamp : timestamp,
      source: food.source,
      // МЫ ПЕРЕДАЕМ ВСЕ ПОЛЯ, КОТОРЫЕ ТРЕБУЕТ ТИП FoodLog
      nutrients: {
        calories: (n100.calories || 0) * multiplier,
        protein: (n100.protein || 0) * multiplier,
        carbs: (n100.carbs || 0) * multiplier,
        fat: (n100.fat || 0) * multiplier,
        fiber: (n100.fiber || 0) * multiplier,
        sugar: (n100.sugar || 0) * multiplier,
        potassium_mg: (n100.potassium_mg || 0) * multiplier,
        calcium_mg: (n100.calcium_mg || 0) * multiplier,
        iron_mg: (n100.iron_mg || 0) * multiplier,
        magnesium_mg: (n100.magnesium_mg || 0) * multiplier,
        zinc_mg: (n100.zinc_mg || 0) * multiplier,
        vitamin_d_mcg: (n100.vitamin_d_mcg || 0) * multiplier,
        vitamin_b12_mcg: (n100.vitamin_b12_mcg || 0) * multiplier,
        cholesterol_mg: (n100.cholesterol_mg || 0) * multiplier,
        sodium_mg: (n100.sodium_mg || 0) * multiplier,
      }
    };

    if (editingLog) {
      await db.logs.update(editingLog.id!, payload);
    } else {
      await db.logs.add(payload);
      if (food.id) await db.foods.update(food.id, { usage_count: (food.usage_count || 0) + 1, last_used: Date.now() });
      addRecentFood(payload as any);
      addSearchQuery(query);
    }
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={cn("bg-[#FAFAF8] w-full shadow-2xl transition-all duration-300 flex flex-col overflow-hidden", isFullscreen ? "fixed inset-0 h-screen max-w-none rounded-none" : "max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] h-[95vh] border border-gray-100")}>
        
        <div className="p-6 border-b border-gray-100 bg-white shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
                <button onClick={() => isFullscreen ? setIsFullscreen(false) : onClose()} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
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
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-3 px-4 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all", activeTab === tab ? "bg-black text-white shadow-lg" : "text-gray-400")}>
                  {tab === 'search' ? t('diary.global_search') : t('diary.my_ecosystem')}
                </button>
             ))}
          </div>

          {activeTab === 'my-food' && (
            <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="flex gap-2">
                 {(['favorites', 'recipes', 'products'] as const).map((sub) => (
                  <button key={sub} onClick={() => setMyFoodSubTab(sub)} className={cn("flex-1 py-3 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all border flex flex-col items-center gap-1", myFoodSubTab === sub ? "bg-black text-white border-black shadow-lg" : "bg-white text-gray-400 border-gray-100")}>
                    {t(`diary.${sub}`)}
                    <div className="text-[8px] opacity-60">
                       {sub === 'favorites' ? totalFavs : sub === 'recipes' ? totalRecipes : totalProducts}
                    </div>
                  </button>
                 ))}
               </div>
               {myFoodSubTab !== 'favorites' && (
                 <button onClick={() => setEditorMode(myFoodSubTab === 'recipes' ? 'recipe' : 'product')} className="w-full bg-white text-gray-900 py-4 rounded-xl border border-gray-100 text-[10px] font-black uppercase flex items-center justify-center gap-2">
                    <Plus size={16} /> {myFoodSubTab === 'recipes' ? t('diary.add_custom_recipe') : t('diary.add_custom_product')}
                 </button>
               )}
            </div>
          )}
          
          {activeTab === 'search' && !editingLog && !editorMode && (
            <div className="relative mb-4">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                autoFocus 
                className="w-full bg-gray-50 rounded-2xl py-5 pl-14 pr-6 outline-none text-gray-900 font-bold text-lg border border-gray-100"
                placeholder={t('diary.search_food')}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIsSearching(true); }}
                onKeyDown={(e) => e.key === 'Enter' && setIsFullscreen(true)}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <Toast isVisible={toast.isVisible} message={toast.message} onUndo={toast.onUndo} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
          
          {editorMode === 'recipe' && <RecipeEditor recipe={editingItem} onClose={() => setEditorMode(null)} />}
          {editorMode === 'product' && <ProductEditor product={editingItem} onClose={() => setEditorMode(null)} />}

          {!editorMode && (selectedFood || editingLog) ? (() => {
             const activeItem = selectedFood || editingLog;
             const name = lang === 'ru' ? (activeItem?.name_ru || (activeItem as any)?.name_en || '') : ((activeItem as any)?.name_en || activeItem?.name_ru || '');
             const n100 = selectedFood?.nutrients_100g || { calories: 0, protein: 0, carbs: 0, fat: 0 };

             return (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-8">
                   <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-black text-gray-900 leading-tight">{name}</h3>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{t('diary.per_100g')}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl text-center min-w-[80px] border border-gray-100">
                         <div className="text-xl font-black text-gray-900">{Math.round((n100.calories * customAmount) / 100)}</div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase">ккал</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <MacroDetail val={Number(((n100.protein * customAmount) / 100).toFixed(1))} label={t('dashboard.protein')} color="text-blue-500" />
                      <MacroDetail val={Number(((n100.carbs * customAmount) / 100).toFixed(1))} label={t('dashboard.carbs')} color="text-amber-500" />
                      <MacroDetail val={Number(((n100.fat * customAmount) / 100).toFixed(1))} label={t('dashboard.fat')} color="text-rose-500" />
                   </div>

                   <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setCustomAmount(Math.max(0, customAmount - 10))} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-gray-900 font-bold shadow-sm">-</button>
                        <input type="number" value={customAmount} onChange={(e) => setCustomAmount(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none font-display font-black text-4xl text-gray-900 text-center" />
                        <button onClick={() => setCustomAmount(customAmount + 10)} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-gray-900 font-bold shadow-sm">+</button>
                      </div>
                   </div>

                   <button onClick={() => handleSaveLog((selectedFood || editingLog) as any, customAmount)} className="w-full bg-black text-white rounded-[1.5rem] py-5 font-black text-lg shadow-xl active:scale-[0.98] transition-all">
                    {editingLog ? t('diary.update_entry') : t('diary.add_to_diary')}
                  </button>
                  <button onClick={() => setSelectedFood(null)} className="w-full text-zinc-400 uppercase font-black text-[10px] tracking-widest mt-2">Назад</button>
                </div>
             </div>
             );
          })() : (
            <div className="space-y-6">
              {!query && !activeCategory && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {searchHistory.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">История поиска</h4>
                      <div className="flex flex-wrap gap-2">
                         {searchHistory.map((q: string, i: number) => (
                           <button key={i} onClick={() => setQuery(q)} className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full border border-gray-100 flex items-center gap-2">
                             <History size={12} className="text-gray-300" /> {q}
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  {recentFoods.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Недавно добавлено</h4>
                      {recentFoods.slice(0, 5).map((food: any, i: number) => (
                        <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                           <button onClick={() => setSelectedFood(food)} className="flex-1 text-left font-bold text-gray-900 text-sm">{food.name_ru || food.name_en || food.name}</button>
                           <button onClick={() => removeRecentFood(food.id)} className="p-2 text-gray-300"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchResults?.slice(0, displayLimit).map((food: any) => (
                <div key={food.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                  <button onClick={() => { setSelectedFood(food); addSearchQuery(query); }} className="flex-1 text-left">
                    <div className="font-black text-gray-900">{lang === 'ru' ? food.name_ru : food.name_en}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      {(food.nutrients_100g?.calories ?? food.calories ?? 0)} ккал · {food.brand || food.source}
                    </div>
                  </button>
                  <button onClick={() => toggleFavorite(food.id!)} className={cn("p-2", isFavorite(food.id!) ? "text-rose-500" : "text-gray-200")}>
                    <Plus size={24} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const MacroDetail: React.FC<{ val: number, label: string, color: string }> = ({ val, label, color }) => (
  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center flex flex-col items-center">
    <div className={cn("text-lg font-display font-black", color)}>{val}g</div>
    <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{label}</div>
  </div>
);