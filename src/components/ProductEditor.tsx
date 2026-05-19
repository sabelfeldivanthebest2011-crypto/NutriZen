import React, { useState } from 'react';
import { db, FoodItem } from '../db/db';
import { motion } from 'motion/react';
import { X, Save, Scale, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductEditorProps {
  onClose: () => void;
  product?: FoodItem;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ onClose, product }) => {
  const [formData, setFormData] = useState<Partial<FoodItem>>(
    product || {
      name: '',
      brand: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      servingSize: 100,
      servingUnit: 'g',
      isCustom: true,
      category: 'snacks'
    }
  );

  const [inputWeight, setInputWeight] = useState(100);

  const handleChange = (field: keyof FoodItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) return;

    // Normalize to 100g if user entered different weight
    const multiplier = 100 / inputWeight;
    const finalProduct: FoodItem = {
      ...(formData as FoodItem),
      calories: Math.round((formData.calories || 0) * multiplier),
      protein: Number(((formData.protein || 0) * multiplier).toFixed(1)),
      carbs: Number(((formData.carbs || 0) * multiplier).toFixed(1)),
      fat: Number(((formData.fat || 0) * multiplier).toFixed(1)),
      fiber: Number(((formData.fiber || 0) * multiplier).toFixed(1)),
      sugar: Number(((formData.sugar || 0) * multiplier).toFixed(1)),
      servingSize: 100,
      servingUnit: 'g',
      isCustom: true
    };

    if (product?.id) {
      await db.foods.update(product.id, finalProduct);
    } else {
      await db.foods.add(finalProduct);
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
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-black text-white">{product ? 'Edit Product' : 'New Product'}</h3>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white"><X /></button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Product Name</label>
           <input 
             value={formData.name} onChange={e => handleChange('name', e.target.value)}
             className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-white/20 transition-all"
             placeholder="e.g. Protein Bar"
           />
        </div>
        
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Brand (Optional)</label>
           <input 
             value={formData.brand} onChange={e => handleChange('brand', e.target.value)}
             className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-zinc-400 font-medium outline-none focus:border-white/20 transition-all"
             placeholder="e.g. Optimum Nutrition"
           />
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 space-y-6">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">I am entering data for</label>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                 <input 
                    type="number" 
                    value={inputWeight} 
                    onChange={e => setInputWeight(Number(e.target.value))}
                    className="w-16 bg-transparent text-center font-black text-white outline-none" 
                 />
                 <span className="text-[10px] font-black text-zinc-600 mr-2 uppercase self-center">g</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Calories</label>
                 <input 
                   type="number" value={formData.calories || ''} onChange={e => handleChange('calories', Number(e.target.value))}
                   className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-5 text-white font-black text-xl outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Protein (g)</label>
                 <input 
                   type="number" value={formData.protein || ''} onChange={e => handleChange('protein', Number(e.target.value))}
                   className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-blue-400 font-black text-xl outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Carbs (g)</label>
                 <input 
                   type="number" value={formData.carbs || ''} onChange={e => handleChange('carbs', Number(e.target.value))}
                   className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-amber-400 font-black text-xl outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Fats (g)</label>
                 <input 
                   type="number" value={formData.fat || ''} onChange={e => handleChange('fat', Number(e.target.value))}
                   className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-rose-400 font-black text-xl outline-none"
                 />
              </div>
           </div>
        </div>

        <div className="p-5 bg-primary-900/10 rounded-[2rem] border border-primary-500/10 flex gap-4">
           <Info className="text-primary-500 shrink-0" size={20} />
           <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
              Data will be automatically normalized to 100g standards for consistent tracking and recipe integration.
           </p>
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black text-lg active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
        >
          <Save size={20} /> SAVE PRODUCT
        </button>
      </div>
    </motion.div>
  );
};
