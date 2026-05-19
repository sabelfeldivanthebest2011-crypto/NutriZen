import React, { useState, useMemo } from 'react';
import { db, Recipe, FoodItem } from '../db/db';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2, Search, ChevronLeft, Scale } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);

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
    const factor = 100 / finalWeight;
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
    const results = await db.foods
      .filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
      .limit(10)
      .toArray();
    setSearchResults(results);
  };

  const addIngredient = (food: FoodItem) => {
    setIngredients([...ingredients, {
      foodId: food.id!,
      name: food.name,
      amount: 100,
      calories: food.calories,
      protein: food.protein,
      fat: food.fat,
      carbs: food.carbs,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0
    }]);
    setIsSearching(false);
    setSearchQuery('');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientAmount = (index: number, amount: number) => {
    const newIngs = [...ingredients];
    newIngs[index].amount = Math.max(0, amount);
    setIngredients(newIngs);
  };

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
      timestamp: Date.now()
    };

    if (recipe?.id) {
      await db.recipes.put({ ...finalRecipe, id: recipe.id });
    } else {
      await db.recipes.add(finalRecipe);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-full bg-zinc-950 p-6 space-y-6 overflow-y-auto no-scrollbar"
    >
      <div className="flex justify-between items-center bg-zinc-950 sticky top-0 z-10 pb-4">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>
           <h3 className="text-2xl font-display font-black text-white">{recipe ? 'Edit Recipe' : 'New Recipe'}</h3>
        </div>
        <button onClick={handleSave} className="bg-white text-black px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Save</button>
      </div>

      {step === 'details' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Recipe Name</label>
                 <input 
                   value={name} onChange={e => setName(e.target.value)}
                   className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-white/20 transition-all"
                   placeholder="e.g. Grandma's Borstch"
                 />
              </div>

              <div className="bg-zinc-900 p-6 rounded-[2rem] border border-white/5 space-y-6">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cooked Weight</label>
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
                    Set this if the weight changes after cooking (water loss/gain).
                    Average Raw: {Math.round(rawWeight)}g
                 </p>
              </div>
           </div>

           <div className="p-6 bg-zinc-900 rounded-[2rem] border border-white/5 space-y-6">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-white">Ingredients</h4>
                 <button onClick={() => setStep('ingredients')} className="text-primary-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">Add Ingredients <Plus size={14} /></button>
              </div>

              <div className="space-y-3">
                 {ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-white/5">
                       <div className="flex-1">
                          <div className="text-sm font-bold text-white leading-tight">{ing.name}</div>
                          <div className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">{ing.amount}g • {Math.round(ing.calories * ing.amount / 100)} kcal</div>
                       </div>
                       <button onClick={() => removeIngredient(i)} className="text-zinc-700 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                 ))}
                 {ingredients.length === 0 && (
                    <button 
                      onClick={() => setStep('ingredients')}
                      className="w-full py-10 border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-[10px] hover:border-zinc-500 hover:text-zinc-500 transition-all"
                    >
                       No ingredients yet
                    </button>
                 )}
              </div>
           </div>

           <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Nutrition per 100g</h4>
                    <div className="text-4xl font-display font-black text-white">{per100g.calories} <span className="text-xs font-normal text-zinc-500">kcal</span></div>
                 </div>
                 <div className="bg-zinc-950 p-2 rounded-xl border border-white/5 flex gap-4">
                    <div className="text-center">
                       <div className="text-[8px] font-black text-zinc-600 uppercase">P</div>
                       <div className="text-xs font-black text-blue-400">{per100g.protein}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-zinc-600 uppercase">C</div>
                       <div className="text-xs font-black text-amber-400">{per100g.carbs}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-zinc-600 uppercase">F</div>
                       <div className="text-xs font-black text-rose-400">{per100g.fat}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                autoFocus
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:border-white/20 transition-all"
              />
           </div>

           <div className="space-y-2">
              {searchResults.map(food => (
                <button 
                  key={food.id}
                  onClick={() => addIngredient(food)}
                  className="w-full p-4 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-zinc-800 transition-colors"
                >
                   <div className="text-left">
                      <div className="text-sm font-bold text-white">{food.name}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{food.brand || 'DATABASE'} • {food.calories} kcal</div>
                   </div>
                   <Plus size={20} className="text-zinc-600" />
                </button>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-10 opacity-30">No results found</div>
              )}
           </div>

           <div className="pt-10">
              <button 
                onClick={() => setStep('details')}
                className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border border-white/5"
              >
                 Confirm Selection
              </button>
           </div>
        </div>
      )}
    </motion.div>
  );
};
