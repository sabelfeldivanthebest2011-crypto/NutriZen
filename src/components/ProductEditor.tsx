import React, { useState } from 'react';
import { db, FoodItem } from '../db/db';
import { motion } from 'motion/react';
import { Scale, Info, ChevronLeft, Save, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { syncData } from '../lib/sync';

interface ProductEditorProps {
  onClose: () => void;
  product?: FoodItem;
}

interface FormState {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  category: string;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ onClose, product }) => {
  const [formData, setFormData] = useState<FormState>(() => {
    if (product) {
      return {
        name: product.name_ru || product.name_en || '',
        brand: product.brand || '',
        calories: product.nutrients_100g?.calories ?? 0,
        protein: product.nutrients_100g?.protein ?? 0,
        carbs: product.nutrients_100g?.carbs ?? 0,
        fat: product.nutrients_100g?.fat ?? 0,
        fiber: product.nutrients_100g?.fiber ?? 0,
        sugar: product.nutrients_100g?.sugar ?? 0,
        category: product.category || 'snacks'
      };
    }
    return {
      name: '',
      brand: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      category: 'snacks'
    };
  });

  const [inputWeight, setInputWeight] = useState(100);

  const handleChange = (field: keyof FormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { enqueueDeleted, profile } = useStore();
  const lang = profile.language || 'en';

  const handleSave = async () => {
    if (!formData.name) return;

    // Normalize to 100g if user entered different weight
    const multiplier = 100 / inputWeight;
    const finalProduct: FoodItem = {
      name_en: formData.name,
      name_ru: formData.name,
      brand: formData.brand || undefined,
      type: 'user',
      source: 'USER',
      nutrients_100g: {
        calories: Math.round((formData.calories || 0) * multiplier),
        protein: Number(((formData.protein || 0) * multiplier).toFixed(1)),
        carbs: Number(((formData.carbs || 0) * multiplier).toFixed(1)),
        fat: Number(((formData.fat || 0) * multiplier).toFixed(1)),
        fiber: Number(((formData.fiber || 0) * multiplier).toFixed(1)),
        sugar: Number(((formData.sugar || 0) * multiplier).toFixed(1))
      },
      quality_score: 100,
      usage_count: product?.usage_count || 0,
      category: formData.category,
      last_used: Date.now()
    };

    if (product?.id) {
      await db.foods.update(product.id, finalProduct as any);
    } else {
      await db.foods.add(finalProduct);
    }
    syncData(); // background sync trigger
    onClose();
  };

  const handleDelete = async () => {
    if (!product?.id) return;
    if (confirm(lang === 'ru' ? 'Вы уверены, что хотите удалить этот продукт?' : 'Are you sure you want to delete this custom product?')) {
      enqueueDeleted('foods', product.id);
      await db.foods.delete(product.id);
      syncData(); // background sync trigger
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
           <h3 className="text-2xl font-display font-black text-white">{product ? 'Изменить продукт' : 'Новый продукт'}</h3>
        </div>
        <button onClick={handleSave} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">Сохранить</button>
      </div>

      <div className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Название продукта</label>
             <input 
               value={formData.name} onChange={e => handleChange('name', e.target.value)}
               className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-white/20 transition-all font-display text-lg"
               placeholder="Напр: Творог 5%"
             />
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Бренд (Опционально)</label>
             <input 
               value={formData.brand} onChange={e => handleChange('brand', e.target.value)}
               className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-zinc-400 font-medium outline-none focus:border-white/20 transition-all"
               placeholder="Напр: Домик в деревне"
             />
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 space-y-6">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Данные вводятся для</label>
                <div className="flex bg-zinc-950 p-2 rounded-xl border border-white/5 items-center gap-2">
                   <input 
                      type="number" 
                      value={inputWeight} 
                      onChange={e => setInputWeight(Number(e.target.value))}
                      className="w-16 bg-transparent text-right font-black text-white outline-none" 
                   />
                   <span className="text-[10px] font-black text-zinc-600 uppercase">г</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Калории</label>
                   <input 
                     type="number" value={formData.calories || ''} onChange={e => handleChange('calories', Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-5 text-white font-black text-xl outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Белки (г)</label>
                   <input 
                     type="number" value={formData.protein || ''} onChange={e => handleChange('protein', Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-blue-400 font-black text-xl outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Углеводы (г)</label>
                   <input 
                     type="number" value={formData.carbs || ''} onChange={e => handleChange('carbs', Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-amber-400 font-black text-xl outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Жиры (г)</label>
                   <input 
                     type="number" value={formData.fat || ''} onChange={e => handleChange('fat', Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-zinc-500/20 rounded-2xl p-5 text-rose-400 font-black text-xl outline-none"
                   />
                </div>
             </div>
          </div>

          <div className="p-6 bg-zinc-900 rounded-[2rem] border border-white/5 flex gap-4 backdrop-blur-xl">
             <Info className="text-primary-500 shrink-0" size={20} />
             <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
                Данные будут автоматически нормализованы к стандарту 100г для корректной интеграции в рецепты.
             </p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button 
            onClick={handleSave}
            className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black text-lg active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Save size={20} /> {lang==='ru'?'СОХРАНИТЬ ПРОДУКТ':'SAVE PRODUCT'}
          </button>

          {product?.id && (
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full bg-rose-950/20 border border-rose-900/40 text-rose-500 py-4.5 rounded-[1.5rem] font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> {lang==='ru'?'УДАЛИТЬ ПРОДУКТ':'DELETE PRODUCT'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
