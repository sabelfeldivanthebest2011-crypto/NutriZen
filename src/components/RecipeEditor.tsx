import React, { useState, useMemo } from 'react';
import { db, Recipe, FoodItem } from '../db/db';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2, Search, ChevronLeft, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { syncData } from '../lib/sync';

import { searchInItems, fuseOptions } from '../search';
import Fuse from 'fuse.js';

interface RecipeEditorProps {
  onClose: () => void;
  recipe?: Recipe;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ onClose, recipe }) => {
  const [step, setStep] = useState<'details' | 'ingredients'>('details');
  const [name, setName] = useState(recipe?.name || '');
  const [servings, setServings] = useState(recipe?.servings || 1);
  const [cookedWeight, setCookedWeight] = useState(recipe?.totalWeight || 0);
  const [ingredients, setIngredients] = useState<Recipe['ingredients']>(recipe?.ingredients || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editorMode, setEditorMode] = useState<'recipe' | 'product' | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<FoodItem | null>(null);
  const [ingredientAmount, setIngredientAmount] = useState(100);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totals = useMemo(() => {
    return ingredients.reduce((acc, ing) => ({
      calories: acc.calories + (ing.calories * ing.amount / 100),
      protein: acc.protein + (ing.protein * ing.amount / 100),
      fat: acc.fat + (ing.fat * ing.amount / 100),
      carbs: acc.carbs + (ing.carbs * ing.amount / 100),
      fiber: acc.fiber + (ing.fiber * ing.amount / 100),
      sugar: acc.sugar + (ing.sugar * ing.amount / 100),
      weight: acc.weight + ing.amount
    }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, weight: 0 });
  }, [ingredients]);

  const rawWeight = totals.weight;
  const finalWeight = cookedWeight || rawWeight;

  const per100g = useMemo(() => {
    const factor = finalWeight > 0 ? 100 / finalWeight : 0;
    return {
      calories: Math.round(totals.calories * factor),
      protein: Number((totals.protein * factor).toFixed(1)),
      fat: Number((totals.fat * factor).toFixed(1)),
      carbs: Number((totals.carbs * factor).toFixed(1)),
      fiber: Number((totals.fiber * factor).toFixed(1)),
      sugar: Number((totals.sugar * factor).toFixed(1))
    };
  }, [totals, finalWeight]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const all = await db.foods.toArray();
    const fuse = new Fuse(all, {
      ...fuseOptions,
      keys: ['name_ru', 'name_en', 'brand']
    });
    const results = fuse.search(q).map(r => r.item).slice(0, 10);
    setSearchResults(results);
  };

  const confirmIngredient = () => {
    if (!selectedIngredient) return;

    const newIng = {
      foodId: selectedIngredient.id!,
      name: selectedIngredient.name_ru || selectedIngredient.name_en || '',
      amount: ingredientAmount,
      calories: selectedIngredient.nutrients_100g?.calories ?? 0,
      protein: selectedIngredient.nutrients_100g?.protein ?? 0,
      fat: selectedIngredient.nutrients_100g?.fat ?? 0,
      carbs: selectedIngredient.nutrients_100g?.carbs ?? 0,
      fiber: selectedIngredient.nutrients_100g?.fiber ?? 0,
      sugar: selectedIngredient.nutrients_100g?.sugar ?? 0
    };

    if (editingIndex !== null) {
      const newIngs = [...ingredients];
      newIngs[editingIndex] = newIng;
      setIngredients(newIngs);
    } else {
      setIngredients([...ingredients, newIng]);
    }

    setSelectedIngredient(null);
    setEditingIndex(null);
    setIsSearching(false);
    setSearchQuery('');
    setStep('details');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientAmount = (index: number, amount: number) => {
    const newIngs = [...ingredients];
    newIngs[index].amount = Math.max(0, amount);
    setIngredients(newIngs);
  };

  const { enqueueDeleted, profile } = useStore();
  const isEn = profile.language === 'en';

  const handleSave = async () => {
    if (!name || ingredients.length === 0) return;

    const finalRecipe: Recipe = {
      name,
      category: 'custom',
      servings,
      totalWeight: finalWeight,
      ingredients,
      caloriesPer100g: per100g.calories,
      proteinPer100g: per100g.protein,
      carbsPer100g: per100g.carbs,
      fatPer100g: per100g.fat,
      fiberPer100g: per100g.fiber,
      sugarPer100g: per100g.sugar,
      total_nutrients: {
        calories: per100g.calories,
        protein: per100g.protein,
        carbs: per100g.carbs,
        fat: per100g.fat,
        fiber: per100g.fiber,
        sugar: per100g.sugar
      },
      quality_score: 100,
      usage_count: recipe?.usage_count || 0,
      timestamp: Date.now()
    };

    if (recipe?.id) {
      await db.recipes.put({ ...finalRecipe, id: recipe.id });
    } else {
      await db.recipes.add(finalRecipe);
    }
    syncData(); // Trigger cloud sync
    onClose();
  };

  const handleDelete = async () => {
    if (!recipe?.id) return;
    if (confirm(isEn ? 'Are you sure you want to delete this recipe?' : 'Вы уверены, что хотите удалить этот рецепт?')) {
      enqueueDeleted('recipes', recipe.id);
      await db.recipes.delete(recipe.id);
      syncData(); // Trigger cloud sync
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col p-6 overflow-y-auto no-scrollbar"
    >
      <div className="flex justify-between items-center bg-zinc-950/80 sticky top-0 z-10 pb-4 backdrop-blur-md -mx-6 px-6">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>
           <h3 className="text-2xl font-display font-black text-white">{recipe ? (isEn ? 'Edit Recipe' : 'Изменить рецепт') : (isEn ? 'New Recipe' : 'Новый рецепт')}</h3>
        </div>
        <button onClick={handleSave} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">{isEn ? 'Save' : 'Сохранить'}</button>
      </div>

      <AnimatePresence mode="wait">
        {selectedIngredient ? (
          <motion.div 
            key="params"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 animate-in fade-in duration-300"
          >
             <button 
              onClick={() => setSelectedIngredient(null)}
              className="text-[10px] font-black text-zinc-500 flex items-center gap-1 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} /> {isEn ? 'Back to search' : 'Назад к поиску'}
            </button>

            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-display font-black text-white tracking-tight">{selectedIngredient.name_ru || selectedIngredient.name_en || ''}</h3>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">{isEn ? 'Ingredient nutrients' : 'Параметры ингредиента'}</div>
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-2xl text-center min-w-[80px]">
                     <div className="text-xl font-display font-black text-white">{Math.round(((selectedIngredient.nutrients_100g?.calories ?? 0) * ingredientAmount) / 100)}</div>
                     <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{isEn ? 'kcal' : 'ккал'}</div>
                  </div>
               </div>

               <div className="p-8 bg-zinc-950 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isEn ? 'Amount (grams)' : 'Количество (граммы)'}</label>
                    <div className="text-xl font-black text-white">{ingredientAmount}g</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIngredientAmount(Math.max(0, ingredientAmount - 10))} className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold border border-white/5 shadow-sm">-</button>
                    <input 
                      type="number"
                      value={ingredientAmount}
                      onChange={(e) => setIngredientAmount(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-transparent border-none outline-none font-display font-black text-5xl text-white text-center"
                    />
                    <button onClick={() => setIngredientAmount(ingredientAmount + 10)} className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold border border-white/5 shadow-sm">+</button>
                  </div>
               </div>

               <button 
                onClick={confirmIngredient}
                className="w-full bg-white text-black rounded-[1.5rem] py-6 font-black text-lg shadow-xl active:scale-[0.98] transition-all"
              >
                {editingIndex !== null ? (isEn ? 'Update in recipe' : 'Обновить в рецепте') : (isEn ? 'Add to recipe' : 'Добавить в рецепт')}
              </button>
            </div>
          </motion.div>
        ) : step === 'details' ? (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{isEn ? 'Recipe Name' : 'Название рецепта'}</label>
                   <input 
                     value={name} onChange={e => setName(e.target.value)}
                     className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-white/20 transition-all font-display text-lg"
                     placeholder={isEn ? "E.g. Homemade Soup" : "Напр: Борщ домашний"}
                   />
                </div>

                <div className="bg-zinc-900 p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-lg">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isEn ? 'Cooked Weight' : 'Готовый вес'}</label>
                      <div className="flex bg-zinc-950 p-2 rounded-xl border border-white/5 gap-2 items-center">
                         <input 
                            type="number" 
                            value={cookedWeight || rawWeight} 
                            onChange={e => setCookedWeight(Number(e.target.value))}
                            className="w-20 bg-transparent text-right font-black text-white outline-none" 
                         />
                         <span className="text-[10px] font-black text-zinc-600 uppercase">g</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                      {isEn ? 'Specify if weight changed after cooking. Raw weight: ' : 'Укажите, если вес изменился после готовки (уварка/разварка). Сырой вес: '}{Math.round(rawWeight)}g
                   </p>
                </div>
             </div>

             <div className="p-6 bg-zinc-900 rounded-[2rem] border border-white/5 space-y-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-xs font-black uppercase tracking-widest text-white">{isEn ? 'Ingredients' : 'Ингредиенты'}</h4>
                   <button onClick={() => setStep('ingredients')} className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">{isEn ? 'Add components' : 'Добавить компоненты'} <Plus size={14} /></button>
                </div>

                <div className="space-y-3">
                   {ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-zinc-950 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                         <button 
                            onClick={() => {
                               setEditingIndex(i);
                               setSelectedIngredient({
                                  id: ing.foodId,
                                  name_en: ing.name,
                                  name_ru: ing.name,
                                  type: 'user',
                                  source: 'USER',
                                  nutrients_100g: {
                                     calories: ing.calories,
                                     protein: ing.protein,
                                     carbs: ing.carbs,
                                     fat: ing.fat,
                                     fiber: ing.fiber,
                                     sugar: ing.sugar
                                  },
                                  quality_score: 100,
                                  usage_count: 0
                                });
                               setIngredientAmount(ing.amount);
                            }}
                            className="flex-1 text-left"
                         >
                            <div className="text-sm font-bold text-white leading-tight">{ing.name}</div>
                            <div className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">{ing.amount}g • {Math.round(ing.calories * ing.amount / 100)} {isEn ? 'kcal' : 'ккал'}</div>
                         </button>
                         <button onClick={() => removeIngredient(i)} className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                   ))}
                   {ingredients.length === 0 && (
                      <button 
                        onClick={() => setStep('ingredients')}
                        className="w-full py-12 border-2 border-dashed border-zinc-805 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-[10px] hover:border-zinc-500 hover:text-zinc-500 transition-all"
                      >
                         {isEn ? 'No ingredients added yet' : 'Ингредиенты не добавлены'}
                      </button>
                   )}
                </div>
             </div>

             <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px]" />
                <div className="flex justify-between items-end mb-6 relative z-10">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{isEn ? 'Per 100g cooked product' : 'На 100г готового продукта'}</h4>
                      <div className="text-4xl font-display font-black text-white">{per100g.calories} <span className="text-xs font-normal text-zinc-500">{isEn ? 'kcal' : 'ккал'}</span></div>
                   </div>
                   <div className="bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex gap-5">
                      <div className="text-center">
                         <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">{isEn ? 'P' : 'Б'}</div>
                         <div className="text-sm font-black text-blue-400">{per100g.protein}</div>
                      </div>
                      <div className="text-center">
                         <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">{isEn ? 'C' : 'У'}</div>
                         <div className="text-sm font-black text-amber-400">{per100g.carbs}</div>
                      </div>
                      <div className="text-center">
                         <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">{isEn ? 'F' : 'Ж'}</div>
                         <div className="text-sm font-black text-rose-400">{per100g.fat}</div>
                      </div>
                   </div>
                </div>
             </div>

             {recipe?.id && (
                <button
                   type="button"
                   onClick={handleDelete}
                   className="w-full bg-rose-950/25 border border-rose-900/40 text-rose-500 py-5 rounded-[1.5rem] font-black text-xs tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                   <Trash2 size={16} /> {isEn ? 'DELETE RECIPE' : 'УДАЛИТЬ РЕЦЕПТ'}
                </button>
             )}
          </motion.div>
        ) : (
          <motion.div 
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
             <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input 
                  autoFocus
                  placeholder={isEn ? "Search ingredients..." : "Поиск ингредиентов..."}
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-white/20 transition-all text-lg"
                />
             </div>

             <div className="space-y-3">
                {searchResults.map(food => (
                  <button 
                    key={food.id}
                    onClick={() => {
                        setSelectedIngredient(food);
                        setIngredientAmount(100);
                        setEditingIndex(null);
                    }}
                    className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-zinc-800 transition-colors shadow-sm group"
                  >
                     <div className="text-left">
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{food.name_ru || food.name_en || ''}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{food.brand || (isEn ? 'DATABASE' : 'БАЗА ДАННЫХ')} • {food.nutrients_100g?.calories ?? 0} {isEn ? 'kcal' : 'ккал'}</div>
                     </div>
                     <Plus size={24} className="text-zinc-700 group-hover:text-white transition-colors" />
                  </button>
                ))}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                     <Search size={40} className="mx-auto mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">{isEn ? 'Nothing found' : 'Ничего не найдено'}</p>
                  </div>
                )}
             </div>

             <div className="pt-10">
                <button 
                  onClick={() => setStep('details')}
                  className="w-full bg-zinc-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border border-white/5 transition-all active:scale-[0.98]"
                >
                   {isEn ? 'Return to details' : 'Вернуться к деталям'}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
