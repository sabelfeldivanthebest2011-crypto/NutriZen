import Dexie, { type Table } from 'dexie';

export interface FoodItem {
  id?: number;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number; // Total sugar
  sugarAdded?: number;
  sugarNatural?: number;
  // Micronutrients
  cholesterol?: number; // mg
  b12?: number; // mcg
  calcium?: number; // mg
  zinc?: number; // mg
  vitD?: number; // mcg
  vitC?: number; // mg
  phosphorus?: number; // mg
  magnesium?: number; // mg
  iron?: number; // mg
  potassium?: number; // mg
  iodine?: number; // mcg
  selenium?: number; // mcg
  vitA?: number; // mcg
  vitE?: number; // mg
  vitB6?: number; // mg
  sodium?: number; // mg
  servingSize: number;
  servingUnit: string;
  category?: string;
  isCustom?: boolean;
  sourceLabel?: string;
}

export interface FoodLog {
  id?: number;
  foodId?: number;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sugarAdded?: number;
  sugarNatural?: number;
  cholesterol: number;
  b12: number;
  calcium: number;
  zinc: number;
  vitD: number;
  vitC?: number;
  phosphorus?: number;
  magnesium: number;
  iron: number;
  potassium: number;
  iodine?: number;
  selenium?: number;
  vitA?: number;
  vitE?: number;
  vitB6?: number;
  sodium?: number;
  amount: number; // multiplier for servingSize
  mealType: string;
  timestamp: number;
  sourceLabel?: string;
}

export interface WeightLog {
  id?: number;
  weight: number;
  timestamp: number;
}

export interface Recipe {
  id?: number;
  name: string;
  category: string;
  servings: number;
  totalWeight: number; // calculated from ingredients
  ingredients: {
    foodId: number;
    name: string;
    amount: number; // in grams or servings
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sugar: number;
  }[];
  // Totals per 100g or per serving
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  timestamp: number;
}

export class NutriZenDB extends Dexie {
  foods!: Table<FoodItem>;
  logs!: Table<FoodLog>;
  weight!: Table<WeightLog>;
  recipes!: Table<Recipe>;
  favorites!: Table<{ id?: number, type: 'food' | 'recipe', itemId: number }>;

  constructor() {
    super('NutriZenDB');
    this.version(3).stores({
      foods: '++id, name, category, isCustom',
      logs: '++id, foodId, mealType, timestamp',
      weight: '++id, timestamp',
      recipes: '++id, name, category',
      favorites: '++id, type, itemId'
    });
  }
}

export const db = new NutriZenDB();

// Initial Mock Data (Imported from separate file)
import { foodItems as initialFoods } from './foodItems';

export async function seedDatabase() {
  const count = await db.foods.count();
  if (count === 0) {
    await db.foods.bulkAdd(initialFoods);
  }
}
