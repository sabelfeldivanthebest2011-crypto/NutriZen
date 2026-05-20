import Dexie, { type Table } from 'dexie';

export interface FoodItem {
  id?: number;
  name_en: string;
  name_ru: string;
  brand?: string;
  aliases?: string[];
  type: 'system' | 'user';
  source: 'USDA' | 'BRAND' | 'USER';
  nutrients_100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    sugar: number;
    fiber: number;
    potassium_mg?: number;
    calcium_mg?: number;
    iron_mg?: number;
    magnesium_mg?: number;
    zinc_mg?: number;
    vitamin_d_mcg?: number;
    vitamin_b12_mcg?: number;
    cholesterol_mg?: number;
    sodium_mg?: number;
  };
  quality_score: number;
  usage_count: number;
  last_used?: number;
  category?: string;
  barcode?: string;
}

export interface FoodLog {
  id?: number;
  foodId?: number;
  name_en: string;
  name_ru: string;
  brand?: string;
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    sugar: number;
    fiber: number;
    potassium_mg: number;
    calcium_mg: number;
    iron_mg: number;
    magnesium_mg: number;
    zinc_mg: number;
    vitamin_d_mcg: number;
    vitamin_b12_mcg: number;
    cholesterol_mg: number;
    sodium_mg: number;
  };
  amount: number; // multiplier for 100g
  mealType: string;
  timestamp: number;
  source: string;
}

export interface WeightLog {
  id?: number;
  weight: number; // High precision float
  timestamp: number;
}

export interface Recipe {
  id?: number;
  name: string;
  category: string;
  ingredients: {
    foodId: number;
    name: string;
    amount: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sugar: number;
    name_en?: string;
    name_ru?: string;
    grams?: number;
    nutrients_100g?: any;
  }[];
  total_nutrients: any;
  quality_score: number;
  usage_count: number;
  timestamp: number;
  deleted?: boolean;
  servings?: number;
  totalWeight?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
}

export class NutriZenDB extends Dexie {
  foods!: Table<FoodItem>;
  logs!: Table<FoodLog>;
  weight!: Table<WeightLog>;
  recipes!: Table<Recipe>;
  favorites!: Table<{ id?: number, type: 'food' | 'recipe', itemId: number }>;

  constructor() {
    super('NutriZenDB');
    this.version(6).stores({
      foods: '++id, name_en, name_ru, type, source, barcode, category',
      logs: '++id, foodId, mealType, timestamp',
      weight: '++id, timestamp',
      recipes: '++id, name, category, deleted',
      favorites: '++id, type, itemId'
    });
  }
}

export const db = new NutriZenDB();

// Initial Mock Data (Imported from separate file)
import { foodItems as initialFoods } from './foodItems';

export async function seedDatabase() {
  console.log('[seedDatabase] Initializing seeding check...');
  try {
    // Open DB explicitly to catch any version change or upgrade errors
    await db.open();
    console.log('[seedDatabase] Database opened successfully. Version:', db.verno);
    
    const count = await db.foods.count();
    console.log('[seedDatabase] Current items count in db.foods:', count);

    // Self-healing check: check if first database record is outdated or if there's corrupted leftovers
    const firstFood = await db.foods.limit(1).toArray();
    let needsReset = count === 0;

    if (!needsReset && firstFood.length > 0) {
      const sample = firstFood[0];
      // 1. If sample record misses bilingual names or the nested nutrients object, trigger re-seed
      if (!sample.name_ru || !sample.name_en || !sample.nutrients_100g || sample.nutrients_100g.calories === undefined) {
        console.warn('[seedDatabase] Outdated IndexedDB structure detected. Forcing migration and re-seed.');
        needsReset = true;
      } else {
        // 2. Sample database scanning for older corrupted entries (e.g. any butter with fat < 50% or Savushkin with butter 0%)
        // We load a small chunk of items to audit quality
        const auditChunk = await db.foods.limit(100).toArray();
        const hasOutdatedOrBroken = auditChunk.some(item => {
          const ruLower = (item.name_ru || '').toLowerCase();
          const enLower = (item.name_en || '').toLowerCase();
          const brLower = (item.brand || '').toLowerCase();
          
          // Check for any invalid butter
          const isButter = (ruLower.includes('масло сливочное') || ruLower.includes('сливочное масло') || enLower.includes('butter')) &&
                           !ruLower.includes('арахисов') && !enLower.includes('peanut') &&
                           !ruLower.includes('кокосов') && !enLower.includes('coconut');
          if (isButter && item.nutrients_100g && item.nutrients_100g.fat < 50) return true;
          
          // Check for Savushkin name with butter 0%
          if (brLower.includes('savushkin') || ruLower.includes('савушкин')) {
            if (isButter && item.nutrients_100g && (item.nutrients_100g.fat < 72.5 || item.nutrients_100g.fat > 82.5)) return true;
          }
          
          return false;
        });

        // 3. Double-check if USDA source items are present in IndexedDB (if we have 0 USDA items, migration must run)
        const usdaCount = await db.foods.where('source').equals('USDA').count();
        if (hasOutdatedOrBroken || usdaCount === 0) {
          console.warn(`[seedDatabase] Corrupted entries (${hasOutdatedOrBroken}) or missing USDA items (count: ${usdaCount}). Rebuilding search index...`);
          needsReset = true;
        }
      }
    }

    if (needsReset) {
      console.log('[seedDatabase] Seeding/Migrating database with complete food collection. Total count:', initialFoods.length);
      await db.foods.clear();
      await db.foods.bulkAdd(initialFoods);
      const newCount = await db.foods.count();
      console.log('[seedDatabase] Seeding complete! Database records count now:', newCount);
    } else {
      console.log('[seedDatabase] Database is up to date and verified. Count:', count);
    }
  } catch (error) {
    console.error('[seedDatabase] CRITICAL ERROR during DB seeding:', error);
    // If it's a version/schema failure, we can handle it safely
    if (error instanceof Error && error.name === 'VersionError') {
      console.warn('[seedDatabase] Version mismatch. Attempting to delete and recreate DB...');
      try {
        await db.delete();
        await db.open();
        await db.foods.bulkAdd(initialFoods);
        console.log('[seedDatabase] Database successfully recreated and seeded after VersionError.');
      } catch (innerError) {
        console.error('[seedDatabase] Failed to recover from VersionError:', innerError);
      }
    }
  }
}
