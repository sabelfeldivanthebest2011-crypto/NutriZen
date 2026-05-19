import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, FoodLog, FoodItem } from '../db/db';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, ChevronRight, X, User, Flame, Clock, Calendar, Trash2, Edit2, ChevronLeft, Droplets, Target, BookOpen, History, RotateCcw, Filter, Check } from 'lucide-react';
import { startOfDay, endOfDay, format, addDays, subDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { searchAliases, categoryAliases } from '../lib/searchAliases';
import { englishToRussian } from '../lib/searchMapping';
import { RecipeEditor } from './RecipeEditor';
import { ProductEditor } from './ProductEditor';

export const Diary: React.FC = () => {
  const { profile, setProfile } = useStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string>(profile.mealStructure?.[0]?.id || 'breakfast');
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);

  const dayLogs = useLiveQuery(
    () => db.logs.where('timestamp').between(startOfDay(selectedDate).getTime(), endOfDay(selectedDate).getTime()).toArray(),
    [selectedDate]
  );

  const handleAddClick = (mealId: string) => {
    setSelectedMealId(mealId);
    setEditingLog(null);
    setIsSearchOpen(true);
  };

  const handleEditClick = (log: FoodLog) => {
    setEditingLog(log);
    setSelectedMealId(log.mealType);
    setIsSearchOpen(true);
  };

  const deleteLog = async (id: number) => {
    await db.logs.delete(id);
  };

  const logsByMeal = (mealId: string) => dayLogs?.filter(l => l.mealType === mealId) || [];
  
  const totalCals = dayLogs?.reduce((acc, l) => acc + (l.calories * (l.amount / 100)), 0) || 0;

  if (!profile || !profile.mealStructure || profile.mealStructure.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] glass rounded-[3rem] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-inner">🍎</div>
        <p className="text-gray-900 font-black text-xl mb-2 tracking-tight">{t('diary.meal_structure')}</p>
        <p className="text-gray-400 text-sm mb-10 max-w-[200px]">Initial setting required to start tracking.</p>
        <button 
          onClick={() => setProfile({ mealStructure: [
            { id: 'breakfast', name: 'Breakfast', icon: '☀️', time: '08:00' },
            { id: 'lunch', name: 'Lunch', icon: '🍱', time: '13:00' },
            { id: 'dinner', name: 'Dinner', icon: '🍽️', time: '19:00' },
            { id: 'snack', name: 'Snacks', icon: '🍎', time: '16:00' },
          ] })}
          className="bg-gray-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-95 transition-all"
        >
          {t('common.confirm')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end px-2">
        <div>
          <div className="flex items-center gap-1 mb-2">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronLeft size={16} /></button>
            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-white/50">
               <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-[10px] tracking-widest uppercase">
                  {isSameDay(selectedDate, new Date()) ? t('common.today') : format(selectedDate, 'MMM d')}
               </span>
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronRight size={16} /></button>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">{t('diary.title')}</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-black text-gray-900 leading-none">{Math.round(totalCals)}</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">{t('dashboard.calories_left').split(' ')[1]} total</div>
        </div>
      </header>

      <div className="space-y-5">
        {profile.mealStructure.map((section) => (
          <div key={section.id} className="glass rounded-[2.5rem] p-6 border-white/60 shadow-lg flex flex-col gap-6 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                   <div className="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-gray-900">{section.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Flame size={12} className="text-rose-500" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                       {Math.round(logsByMeal(section.id).reduce((acc, l) => acc + (l.calories * (l.amount / 100)), 0))} kcal
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleAddClick(section.id)}
                className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-md active:scale-90"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {logsByMeal(section.id).map((log) => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-white/40 rounded-3xl border border-white/50 group/item hover:bg-white transition-all scroll-m-2">
                  <div className="flex-1">
                    <div className="font-black text-[15px] text-gray-900 leading-tight">{log.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-primary-600 bg-primary-100/50 px-1.5 py-0.5 rounded-md">{Math.round(log.amount)}g</span>
                      <span>P: {Math.round(log.protein * (log.amount/100))}g</span>
                      <span>C: {Math.round(log.carbs * (log.amount/100))}g</span>
                      <span>F: {Math.round(log.fat * (log.amount/100))}g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-sm font-black text-gray-900 whitespace-nowrap">{Math.round(log.calories * (log.amount/100))} <span className="text-[10px] font-bold text-gray-400">kcal</span></div>
                     <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(log)} className="p-2 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => deleteLog(log.id!)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                     </div>
                  </div>
                </div>
              ))}
              {logsByMeal(section.id).length === 0 && (
                <div className="text-center py-6 bg-white/30 rounded-[2rem] border-2 border-dashed border-white/40 group-hover:border-primary-100/50 transition-colors">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('diary.no_logs')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <FoodSearchModal 
            onClose={() => setIsSearchOpen(false)} 
            mealType={selectedMealId} 
            editingLog={editingLog}
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FoodSearchModal: React.FC<{ onClose: () => void, mealType: string, editingLog: FoodLog | null, selectedDate: Date }> = ({ onClose, mealType, editingLog, selectedDate }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'my-food'>('search');
  const [myFoodSubTab, setMyFoodSubTab] = useState<'recipes' | 'products' | 'favorites'>('favorites');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'recipe' | 'product' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState(editingLog ? Math.round(editingLog.amount) : 100);
  const { t, lang } = useTranslation();
  const { searchHistory, recentFoods, addSearchQuery, clearSearchHistory, removeSearchQuery, addRecentFood, toggleFavorite, isFavorite } = useStore();

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
      const all = await db.foods.toArray();
      const recipes = await db.recipes.toArray();
      const favorites = await db.favorites.toArray();
      
      let filtered: (FoodItem & { isFav?: boolean, rank?: number, sourceLabel?: string })[] = [];
      
      const favIds = new Set(favorites.filter(f => f.type === 'food').map(f => f.itemId));
      const qOrig = query.toLowerCase().trim();
      const qTranslated = englishToRussian[qOrig] || qOrig;
      const q = qTranslated;

      if (activeTab === 'search') {
         if (!q && !activeCategory) return [];

         // Bilingual mapping & Aliases
         const possibleAliases = Object.keys(searchAliases)
            .filter(key => key.includes(q))
            .flatMap(key => [key, ...searchAliases[key]]);
            
         const catSearch = categoryAliases[q] || (activeCategory || '');
         
         filtered = all.map(f => {
            const name = f.name.toLowerCase();
            const brand = f.brand?.toLowerCase() || '';
            const category = f.category?.toLowerCase() || '';
            
            const isFav = favIds.has(f.id!);
            let rank = 10;

            const nameMatch = name.includes(q) || possibleAliases.some(term => name.includes(term.toLowerCase()));
            const brandMatch = brand.includes(q);
            const categoryMatch = catSearch ? category === catSearch : false;

            if (!nameMatch && !brandMatch && !categoryMatch) return null;

            // Priority Ranking
            if (isFav) rank -= 8; // Favorites ALWAYS high priority
            if (name === q) rank -= 5;
            else if (name.startsWith(q)) rank -= 4;
            else if (name.split(' ').some(word => word === q)) rank -= 3;
            else if (brand.includes(q)) rank -= 1;
            
            if (recentFoods.some(rf => rf.name === f.name)) rank -= 1;

            return { ...f, isFav, rank, sourceLabel: f.isCustom ? 'Custom' : 'DB' };
         }).filter(f => f !== null) as any;

         // Rank recipes too
         const recipeResults = recipes.map(r => {
            const name = r.name.toLowerCase();
            if (name.includes(q)) {
               const isFav = favIds.has(r.id!);
               return {
                  id: r.id,
                  name: r.name,
                  calories: r.caloriesPer100g,
                  protein: r.proteinPer100g,
                  carbs: r.carbsPer100g,
                  fat: r.fatPer100g,
                  servingSize: 100,
                  servingUnit: 'g',
                  isFav,
                  rank: isFav ? 2 : 6,
                  sourceLabel: 'Recipe'
               };
            }
            return null;
         }).filter(r => r !== null) as any;

         filtered = [...filtered, ...recipeResults];
         filtered.sort((a, b) => (a.rank || 10) - (b.rank || 10));
      } else {
         // My Ecosystem Tab
         if (myFoodSubTab === 'products') {
            filtered = all.filter(f => f.isCustom).map(f => ({...f, isFav: favIds.has(f.id!), sourceLabel: 'Custom'}));
         } else if (myFoodSubTab === 'favorites') {
            const favProductIds = favorites.filter(f => f.type === 'food').map(f => f.itemId);
            filtered = all.filter(f => favProductIds.includes(f.id!)).map(f => ({ ...f, isFav: true, sourceLabel: f.isCustom ? 'Custom' : 'DB' }));
            
            const favRecipeIds = favorites.filter(f => f.type === 'recipe').map(f => f.itemId);
            const favRecipes = recipes.filter(r => favRecipeIds.includes(r.id!)).map(r => ({
               id: r.id,
               name: r.name,
               calories: r.caloriesPer100g,
               protein: r.proteinPer100g,
               carbs: r.carbsPer100g,
               fat: r.fatPer100g,
               servingSize: 100,
               servingUnit: 'g',
               isFav: true,
               sourceLabel: 'Recipe'
            }));
            filtered = [...filtered, ...favRecipes];
         } else if (myFoodSubTab === 'recipes') {
            filtered = recipes.map(r => ({
               id: r.id,
               name: r.name,
               calories: r.caloriesPer100g,
               protein: r.proteinPer100g,
               carbs: r.carbsPer100g,
               fat: r.fatPer100g,
               servingSize: 100,
               servingUnit: 'g',
               isFav: favIds.has(r.id!),
               sourceLabel: 'Recipe'
            }));
         }
      }
      
      return filtered;
    },
    [query, recentFoods, activeTab, myFoodSubTab]
  );
  
  const totalFavs = useLiveQuery(() => db.favorites.count()) || 0;
  const totalRecipes = useLiveQuery(() => db.recipes.count()) || 0;
  const totalProducts = useLiveQuery(() => db.foods.where('isCustom').equals(1).count()) || 0;


  const handleSaveLog = async (food: FoodItem | FoodLog, amount: number) => {
    const timestamp = isSameDay(selectedDate, new Date()) ? Date.now() : startOfDay(selectedDate).getTime() + 12 * 60 * 60 * 1000; 
    
    // Ensure negative values are NOT allowed
    const safeAmount = Math.max(0, amount);

    const payload: any = {
      foodId: (food as any).id,
      name: food.name,
      brand: food.brand,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: (food as any).fiber || 0,
      sugar: (food as any).sugar || 0,
      sugarAdded: (food as any).sugarAdded || 0,
      sugarNatural: (food as any).sugarNatural || 0,
      cholesterol: (food as any).cholesterol || 0,
      b12: (food as any).b12 || 0,
      calcium: (food as any).calcium || 0,
      zinc: (food as any).zinc || 0,
      vitD: (food as any).vitD || 0,
      magnesium: (food as any).magnesium || 0,
      iron: (food as any).iron || 0,
      potassium: (food as any).potassium || 0,
      amount: safeAmount,
      mealType: mealType,
      timestamp: editingLog ? editingLog.timestamp : timestamp,
      sourceLabel: (food as any).sourceLabel
    };

    if (editingLog) {
      await db.logs.update(editingLog.id!, payload);
    } else {
      await db.logs.add(payload);
      addRecentFood(payload);
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
        className="bg-[#FAFAF8] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl h-[95vh] flex flex-col overflow-hidden border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100 text-gray-400">
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
                  {tab === 'search' ? 'Global Search' : 'My Ecosystem'}
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
                    {sub}
                    <div className={cn("text-[8px] opacity-60", myFoodSubTab === sub ? "text-gray-400" : "text-gray-500")}>
                       {sub === 'favorites' ? totalFavs : sub === 'recipes' ? totalRecipes : totalProducts} ITEMS
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
                       <Plus size={16} /> Add {myFoodSubTab === 'recipes' ? 'Recipe' : 'Product'}
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
                placeholder={t('diary.search_food') || "Search brands, names, aliases..."}
                value={query ?? ''}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsSearching(true);
                }}
                className="w-full bg-gray-50 rounded-2xl py-5 pl-14 pr-6 outline-none text-gray-900 font-bold text-lg border border-gray-100 focus:border-gray-200 focus:bg-white transition-all shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
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

          {!editorMode && (selectedFood || editingLog) ? (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                {!editingLog && (
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="mb-6 text-[10px] font-black text-gray-400 flex items-center gap-1 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl uppercase tracking-widest bg-white shadow-sm border border-gray-100"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-8">
                   <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-black text-gray-900 tracking-tight">{(selectedFood || editingLog)!.name}</h3>
                        {((selectedFood || editingLog) as any).brand && <div className="text-xs text-gray-400 font-bold mb-2 tracking-tight">{((selectedFood || editingLog) as any).brand}</div>}
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-2">
                          <Check size={12} className="text-green-500" /> Per 100g serving
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
                               EDIT RECIPE
                             </button>
                          )}
                          {((selectedFood || editingLog) as any).isCustom && (
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const p = await db.foods.get((selectedFood || editingLog)!.id!);
                                 setEditingItem(p);
                                 setEditorMode('product');
                               }}
                               className="ml-2 text-primary-600 hover:underline"
                             >
                               EDIT PRODUCT
                             </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl text-center min-w-[80px] border border-gray-100 shadow-inner">
                         <div className="text-xl font-display font-black text-gray-900">{Math.round(((selectedFood || editingLog)!.calories * customAmount) / 100)}</div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">kcal</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <MacroDetail val={Number((((selectedFood || editingLog)!.protein * customAmount) / 100).toFixed(1))} label="Protein" color="text-blue-500" />
                      <MacroDetail val={Number((((selectedFood || editingLog)!.carbs * customAmount) / 100).toFixed(1))} label="Carbs" color="text-amber-500" />
                      <MacroDetail val={Number((((selectedFood || editingLog)!.fat * customAmount) / 100).toFixed(1))} label="Fat" color="text-rose-500" />
                   </div>

                   <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (grams)</label>
                        <div className="text-xs font-bold text-gray-900">total: {customAmount}g</div>
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
                    {editingLog ? 'Update Entry' : 'Add to Diary'}
                  </button>
                </div>
             </div>
          ) : (
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
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Recently Added</h4>
                      <div className="grid grid-cols-1 gap-2">
                         {recentFoods.slice(0, 5).map((food, i) => (
                           <button 
                             key={i}
                             onClick={() => setSelectedFood(food)}
                             className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-left flex justify-between items-center hover:bg-gray-50 transition-colors group shadow-sm"
                            >
                             <div>
                               <div className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                                  {food.name}
                               </div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{food.calories} kcal • {Math.round(food.amount || 100)}g</div>
                             </div>
                             <RotateCcw size={16} className="text-gray-200 group-hover:text-gray-900 transition-colors" />
                           </button>
                         ))}
                      </div>
                    </div>
                  )}
                  
                  {searchHistory.length === 0 && recentFoods.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                       <Search size={40} className="mx-auto mb-4 text-gray-900" />
                       <p className="text-xs font-black uppercase tracking-[0.2em]">Start typing to find foods</p>
                    </div>
                  )}
                </div>
              )}

              {searchResults?.map((food) => (
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
                      {food.name}
                      {food.sourceLabel === 'Recipe' && <span className="bg-primary-50 text-primary-600 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black">Recipe</span>}
                      {food.isCustom && <span className="bg-amber-50 text-amber-600 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black">Custom</span>}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-2">
                      <span className="text-gray-300 font-black">{food.brand || 'DATABASE'}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span className="text-gray-600">{food.calories} kcal</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span>{food.protein}g P</span>
                      <div className="w-1 h-1 rounded-full bg-gray-100" />
                      <span>{food.carbs}g C</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const type = food.sourceLabel === 'Recipe' ? 'recipe' : 'food';
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

              {query && searchResults?.length === 0 && (
                <div className="text-center py-20 animate-in fade-in duration-500">
                  <p className="text-gray-900 font-black text-lg">No Results Found</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-[200px] mx-auto font-medium">"{query}" is not in our database yet.</p>
                  <button 
                    onClick={() => {
                        const custom: FoodItem = { 
                          id: 0, 
                          name: query, 
                          calories: 100, 
                          protein: 10, 
                          carbs: 10, 
                          fat: 2, 
                          category: 'snacks',
                          servingSize: 100,
                          servingUnit: 'g',
                          isCustom: true
                        };
                        setSelectedFood(custom);
                    }}
                    className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
                  >
                    + CREATE CUSTOM FOOD
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

const MacroDetail: React.FC<{ val: number, label: string, color: string }> = ({ val, label, color }) => (
  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center flex flex-col items-center shadow-inner">
    <div className={cn("text-lg font-display font-black", color)}>{val}g</div>
    <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{label}</div>
  </div>
);

const MacroBox: React.FC<{ val: number, label: string, color: string, text: string }> = ({ val, label, color, text }) => (
  <div className={cn("p-5 rounded-[2rem] text-center shadow-lg border border-white/50", color)}>
    <div className={cn("text-xl font-display font-black", text)}>{val}{label === 'kcal' ? '' : 'g'}</div>
    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{label}</div>
  </div>
);
