import Fuse from 'fuse.js';
import { foodItems } from './db/foodItems';
import { FoodItem } from './db/db';

/**
 * Fuse.js configuration optimized for food search.
 * Обновлено: теперь ищем по name_ru, name_en и brand.
 */
export const fuseOptions = {
  keys: [
    { name: 'name_ru', weight: 0.7 }, // Высокий приоритет для русского названия
    { name: 'name_en', weight: 0.2 }, // Средний приоритет для английского
    { name: 'brand', weight: 0.1 }    // Низкий приоритет для бренда
  ],
  threshold: 0.3,
  ignoreLocation: true,
  isCaseSensitive: false,
  minMatchCharLength: 2,
  findAllMatches: false,
  useExtendedSearch: true,
};

/**
 * Searches for food items in a given array using Fuse.js.
 */
export function searchInItems<T>(query: string, items: T[]): T[] {
  if (!query.trim() || !items.length) return [];
  // Используем наши обновленные настройки
  const fuse = new Fuse(items, fuseOptions as any);
  return fuse.search(query.trim()).map(result => result.item);
}

// Инициализируем экземпляр Fuse с обновленными настройками
const fuse = new Fuse(foodItems, fuseOptions as any);

/**
 * Searches for food items in the local database.
 */
export function searchFood(query: string): FoodItem[] {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return [];
  }

  const results = fuse.search(trimmedQuery);
  return results.map(result => result.item);
}