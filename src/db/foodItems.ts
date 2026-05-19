import { FoodItem } from './db';

// --- DATA SOURCE HELPER ---
const SOURCE = 'Local';

// --- TEMPLATES FOR GENERATION ---
const DAIRY_BRANDS = [
  { name: 'Savushkin', products: ['Cottage Cheese', 'Milk', 'Ryazhenka', 'Kefir', 'Yogurt', 'Sour Cream', 'Butter', 'Cheese'] },
  { name: 'Prostokvashino', products: ['Milk', 'Kefir', 'Sour Cream', 'Cottage Cheese', 'Ryazhenka', 'Butter'] },
  { name: 'Epica', products: ['Yogurt', 'Drinking Yogurt', 'Soft Cheese', 'High Protein Yogurt'] },
  { name: 'Teos', products: ['Greek Yogurt', 'Yogurt Drink', 'Skyr'] },
  { name: 'Viola', products: ['Cream Cheese', 'Processed Cheese', 'Sliced Cheese', 'Yogurt'] },
  { name: 'Rodnaya Zemlya', products: ['Milk', 'Cottage Cheese', 'Sour Cream'] },
  { name: 'VkusVill', products: ['Greek Yogurt', 'Milk', 'Sour Cream', 'Cheese', 'Kefir', 'Cottage Cheese'] },
];

const GRAIN_BRANDS = [
  { name: 'Agro-Aliance', products: ['Buckwheat', 'Rice Basmati', 'Rice Jasmine', 'Bulgur', 'Quinoa', 'Lentils', 'Chickpeas'] },
  { name: 'Makfa', products: ['Spaghetti', 'Penne', 'Fusilli', 'Buckwheat', 'Rice', 'Oatmeal', 'Flour'] },
  { name: 'Dr.Korner', products: ['Rice Cakes', 'Buckwheat Cakes', 'Corn Cakes', 'Whole Grain Cakes'] },
  { name: 'Vkus & Polza', products: ['Rice Cakes', 'Buckwheat Cakes', 'Oatcakes', 'Amaranth Cakes'] },
  { name: 'Mistral', products: ['Rice Brown', 'Rice Red', 'Bulgur', 'Quinoa', 'Couscous'] },
];

const MEAT_BRANDS = [
  { name: 'Indilight', products: ['Turkey Fillet', 'Turkey Medallions', 'Turkey Steak', 'Turkey Thigh', 'Turkey Goulash', 'Turkey Ground'] },
  { name: 'Petelinka', products: ['Chicken Breast', 'Chicken Thigh', 'Chicken Drumstick', 'Chicken Wing', 'Chicken Fillet'] },
  { name: 'Agrosila', products: ['Chicken Fillet', 'Chicken Breast', 'Chicken Thigh'] },
  { name: 'VkusVill', products: ['Chicken Breast', 'Turkey Fillet', 'Beef Lean', 'Rabbit Fillet'] },
];

const FISH_BRANDS = [
  { name: 'Russian Sea', products: ['Salmon', 'Trout', 'Mussels', 'Seaweed', 'Mackerel', 'Herring'] },
  { name: 'Vici', products: ['Crab Sticks', 'Shrimp', 'Squid', 'Surimi'] },
  { name: 'VkusVill', products: ['Cod', 'Sea Bass', 'Dorada', 'Pollock', 'Salmon'] },
];

// --- SELLING DATABASE ---
const manualItems: FoodItem[] = [
  // --- DAIRY ---
  { name: 'Cottage Cheese 0%', brand: 'Savushkin', calories: 65, protein: 14, carbs: 2, fat: 0, calcium: 140, fiber: 0, sugar: 2, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  { name: 'Cottage Cheese 5%', brand: 'Savushkin', calories: 121, protein: 17, carbs: 1.5, fat: 5, calcium: 160, fiber: 0, sugar: 1.5, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  { name: 'Cottage Cheese 9%', brand: 'Savushkin', calories: 159, protein: 15, carbs: 1.5, fat: 9, calcium: 150, fiber: 0, sugar: 1.5, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  { name: 'Greek Yogurt 2%', brand: 'Teos', calories: 66, protein: 8, carbs: 3.5, fat: 2, calcium: 120, sugar: 3.5, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  { name: 'Kefir 1%', brand: 'Prostokvashino', calories: 40, protein: 3, carbs: 4, fat: 1, calcium: 120, sugar: 4, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  { name: 'Milk 2.5%', brand: 'Prostokvashino', calories: 53, protein: 3, carbs: 4.7, fat: 2.5, calcium: 120, sugar: 4.7, servingSize: 100, servingUnit: 'g', category: 'dairy', sourceLabel: SOURCE },
  
  // --- MEAT ---
  { name: 'Turkey Fillet', brand: 'Indilight', calories: 115, protein: 24, carbs: 0, fat: 2, servingSize: 100, servingUnit: 'g', category: 'meat', sourceLabel: SOURCE },
  { name: 'Chicken Breast Fillet', brand: 'Petelinka', calories: 113, protein: 23.5, carbs: 0, fat: 1.9, servingSize: 100, servingUnit: 'g', category: 'meat', sourceLabel: SOURCE },
  { name: 'Lean Beef Raw', calories: 158, protein: 22, carbs: 0, fat: 7.5, iron: 2.6, servingSize: 100, servingUnit: 'g', category: 'meat', sourceLabel: SOURCE },
  
  // --- FISH ---
  { name: 'Salmon Raw', calories: 208, protein: 20, carbs: 0, fat: 13, vitD: 11, servingSize: 100, servingUnit: 'g', category: 'fish', sourceLabel: SOURCE },
  { name: 'Cod Raw', calories: 82, protein: 18, carbs: 0, fat: 0.7, iodine: 130, servingSize: 100, servingUnit: 'g', category: 'fish', sourceLabel: SOURCE },
  { name: 'Tuna in Brine', calories: 95, protein: 21, carbs: 0, fat: 0.5, selenium: 70, servingSize: 100, servingUnit: 'g', category: 'fish', sourceLabel: SOURCE },
  
  // --- GRAINS ---
  { name: 'Buckwheat Dry', brand: 'Agro-Aliance', calories: 343, protein: 13, carbs: 71, fat: 3.4, fiber: 10, magnesium: 230, servingSize: 100, servingUnit: 'g', category: 'grain', sourceLabel: SOURCE },
  { name: 'Spaghetti Whole Wheat', brand: 'Makfa', calories: 340, protein: 13, carbs: 68, fat: 1.5, fiber: 8, servingSize: 100, servingUnit: 'g', category: 'grain', sourceLabel: SOURCE },
  { name: 'Buckwheat Cakes', brand: 'Dr.Korner', calories: 300, protein: 10, carbs: 55, fat: 2, fiber: 11, servingSize: 100, servingUnit: 'g', category: 'snacks', sourceLabel: SOURCE },
  
  // --- VEGGIES ---
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, vitC: 89, servingSize: 100, servingUnit: 'g', category: 'veggies', sourceLabel: SOURCE },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, potassium: 150, servingSize: 100, servingUnit: 'g', category: 'veggies', sourceLabel: SOURCE },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, vitC: 14, potassium: 240, servingSize: 100, servingUnit: 'g', category: 'veggies', sourceLabel: SOURCE },
  
  // --- FRUITS ---
  { name: 'Apple Red', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, servingSize: 100, servingUnit: 'g', category: 'fruit', sourceLabel: SOURCE },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, potassium: 358, servingSize: 100, servingUnit: 'g', category: 'fruit', sourceLabel: SOURCE },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, potassium: 485, servingSize: 100, servingUnit: 'g', category: 'fats', sourceLabel: SOURCE },

  // --- RUSSIAN MANUAL ITEMS ---
  { name: 'Творог 5% — Савушкин', brand: 'Савушкин', calories: 121, protein: 17, carbs: 1.5, fat: 5, category: 'dairy', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Гречка — Агро-Альянс', brand: 'Агро-Альянс', calories: 343, protein: 13, carbs: 71, fat: 3.4, category: 'grain', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Йогурт Греческий 2% — Теос', brand: 'Теос', calories: 66, protein: 8, carbs: 3.5, fat: 2, category: 'dairy', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Филе Индейки — Индилайт', brand: 'Индилайт', calories: 115, protein: 24, carbs: 0, fat: 2, category: 'meat', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Кефир 1% — Простоквашино', brand: 'Простоквашино', calories: 40, protein: 3, carbs: 4, fat: 1, category: 'dairy', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Овсяные Хлопья — Монастырские', brand: 'Русский Продукт', calories: 350, protein: 12, carbs: 62, fat: 6, category: 'grain', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Рис Басмати — Мистраль', brand: 'Мистраль', calories: 340, protein: 7.5, carbs: 77, fat: 0.5, category: 'grain', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Яйцо Куриное C0', calories: 157, protein: 12.7, carbs: 0.7, fat: 11.5, category: 'dairy', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
  { name: 'Хлеб Цельнозерновой — ВкусВилл', brand: 'ВкусВилл', calories: 240, protein: 9, carbs: 42, fat: 3, category: 'grain', servingSize: 100, servingUnit: 'g', sourceLabel: SOURCE },
];

function generateExpansion(): FoodItem[] {
  const items: FoodItem[] = [];
  const seen = new Set<string>();

  const track = (item: FoodItem) => {
    const key = `${item.name.toLowerCase()}|${item.brand?.toLowerCase() || ''}`;
    if (!seen.has(key)) {
      items.push(item);
      seen.add(key);
    }
  };

  const ruPreps: Record<string, string> = {
    'Boiled': 'Отварной',
    'Baked': 'Запеченный',
    'Grilled': 'Гриль',
    'Steamed': 'На пару',
    'Cooked': 'Готовый',
    'Dry': 'Сухой',
    'Raw': 'Сырой'
  };

  const ruMeats: Record<string, string> = {
    'Chicken': 'Курица',
    'Turkey': 'Индейка',
    'Beef': 'Говядина',
    'Rabbit': 'Кролик'
  };

  const ruParts: Record<string, string> = {
    'Breast': 'Грудка',
    'Thigh': 'Бедро',
    'Drumstick': 'Голень',
    'Wing': 'Крыло',
    'Fillet': 'Филе',
    'Liver': 'Печень',
    'Heart': 'Сердце',
    'Gizzards': 'Желудки',
    'Ground': 'Фарш',
    'Medallions': 'Медальоны',
    'Steak': 'Стейк'
  };

  // --- GENERATE DAIRY (300 items) ---
  const ruDairyProducts: Record<string, string> = {
    'Cottage Cheese': 'Творог',
    'Milk': 'Молоко',
    'Ryazhenka': 'Ряженка',
    'Kefir': 'Кефир',
    'Yogurt': 'Йогурт',
    'Sour Cream': 'Сметана',
    'Butter': 'Сливочное масло',
    'Cheese': 'Сыр',
    'Greek Yogurt': 'Греческий йогурт',
    'Skyr': 'Скир'
  };

  DAIRY_BRANDS.forEach(b => {
    b.products.forEach(p => {
       const fatPcts = [0, 0.5, 1, 1.5, 2, 2.5, 3.2, 3.5, 4, 5, 9, 15, 20];
       fatPcts.forEach(f => {
          let protein = 3;
          let carbs = 4.7;
          let cal = f * 9 + protein * 4 + carbs * 4;

          if (p.includes('Cottage Cheese')) {
             protein = 16 - (f / 5);
             carbs = 3;
             cal = f * 9 + protein * 4 + carbs * 4;
          } else if (p.includes('Yogurt')) {
             protein = 4;
             carbs = 5;
             cal = f * 9 + protein * 4 + carbs * 4;
          } else if (p.includes('Cheese') && !p.includes('Cottage')) {
             protein = 25;
             carbs = 2;
             f = Math.max(f, 15);
             cal = f * 9 + protein * 4 + carbs * 4;
          } else if (p.includes('Sour Cream')) {
             protein = 2.5;
             carbs = 3.5;
             f = Math.max(f, 10);
             cal = f * 9 + protein * 4 + carbs * 4;
          }

          const ruP = ruDairyProducts[p] || p;
          track({
            name: `${ruP} ${f}% — ${b.name}`,
            brand: b.name,
            calories: Math.round(cal),
            protein: Math.round(protein * 10) / 10,
            carbs: Math.round(carbs * 10) / 10,
            fat: Math.round(f * 10) / 10,
            servingSize: 100,
            servingUnit: 'g',
            category: 'dairy',
            sourceLabel: SOURCE
          });
       });
    });
  });

  // --- GENERATE MEAT VARIANTS (200 items) ---
  const meatTypes = [
    { n: 'Chicken', parts: ['Breast', 'Thigh', 'Drumstick', 'Wing', 'Fillet', 'Liver'], p: 23, f: 2 },
    { n: 'Turkey', parts: ['Fillet', 'Medallions', 'Steak', 'Thigh'], p: 24, f: 1.5 },
    { n: 'Beef', parts: ['Lean Fillet', 'Striploin', 'Ground 5%', 'Liver'], p: 22, f: 7 },
  ];

  MEAT_BRANDS.forEach(b => {
    meatTypes.forEach(t => {
       if (b.products.some(p => p.includes(t.n))) {
          t.parts.forEach(part => {
             const preps = ['', 'Boiled', 'Baked', 'Grilled', 'Steamed'];
             preps.forEach(prep => {
                let f = t.f;
                let p = t.p;
                if (part === 'Thigh' || part === 'Drumstick') f += 5;
                if (part === 'Wing') f += 8;
                if (part.includes('Ground')) f = part.includes('5%') ? 5 : 10;

                if (prep === 'Boiled') { p += 3; f -= 0.5; }
                if (prep === 'Baked' || prep === 'Grilled') { p += 4; f += 0.5; }

                const ruM = ruMeats[t.n] || t.n;
                const ruPart = ruParts[part] || part;
                const ruPrep = ruPreps[prep] || prep;

                track({
                  name: `${ruPrep} ${ruM} (${ruPart}) — ${b.name}`.replace('()', '').trim(),
                  brand: b.name,
                  calories: Math.round(p * 4 + f * 9),
                  protein: Math.round(p * 10) / 10,
                  carbs: 0,
                  fat: Math.round(f * 10) / 10,
                  servingSize: 100,
                  servingUnit: 'g',
                  category: 'meat',
                  sourceLabel: SOURCE
                });
             });
          });
       }
    });
  });

  // --- GRAINS ---
  const ruGrains: Record<string, string> = {
    'Buckwheat': 'Гречка',
    'Rice Basmati': 'Рис Басмати',
    'Rice Brown': 'Рис Бурый',
    'Oatmeal': 'Овсянка',
    'Bulgur': 'Булгур',
    'Quinoa': 'Киноа',
    'Pasta': 'Макароны',
    'Spaghetti': 'Спагетти'
  };

  const grains = [
    { n: 'Buckwheat', p: 13, f: 3, c: 70 },
    { n: 'Rice Basmati', p: 8, f: 1, c: 78 },
    { n: 'Oatmeal', p: 12, f: 6, c: 60 },
  ];

  GRAIN_BRANDS.forEach(b => {
    grains.forEach(g => {
       if (b.products.some(p => p.includes(g.n.split(' ')[0]))) {
          const states = ['Dry', 'Cooked'];
          states.forEach(s => {
             let p = g.p;
             let f = g.f;
             let c = g.c;

             if (s !== 'Dry') {
                p = p / 3;
                f = f / 3;
                c = c / 3;
             }

             const ruG = ruGrains[g.n] || g.n;
             const ruS = ruPreps[s] || s;

             track({
               name: `${ruG} (${ruS}) — ${b.name}`,
               brand: b.name,
               calories: Math.round(p * 4 + f * 9 + c * 4),
               protein: Math.round(p * 10) / 10,
               carbs: Math.round(c * 10) / 10,
               fat: Math.round(f * 10) / 10,
               servingSize: 100,
               servingUnit: 'g',
               category: 'grain',
               sourceLabel: SOURCE
             });
          });
       }
    });
  });

  return items;
}

export const foodItems: FoodItem[] = [
  ...manualItems,
  ...generateExpansion()
];
