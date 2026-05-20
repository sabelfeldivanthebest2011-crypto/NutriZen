import Fuse from 'fuse.js';
import { foodItems } from './db/foodItems';
import { FoodItem } from './db/db';

/**
 * Fuse.js configuration optimized for food search in Russian.
 * Handles typos, case-insensitivity, and prioritizes name matches.
 */
export const fuseOptions = {
  // Search in 'name' and 'brand' fields
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'brand', weight: 0.2 }
  ],
  // threshold: 0.0 requires perfect match, 1.0 matches anything.
  // 0.3 is optimal for catching typos like "тварог" -> "творог" 
  // without too many irrelevant results.
  threshold: 0.3,
  // Search query anywhere in the string (not just at the start)
  ignoreLocation: true,
  // Case-insensitive search
  isCaseSensitive: false,
  // Minimum characters to start searching
  minMatchCharLength: 2,
  // Optimization: only find the best matches
  findAllMatches: false,
  // Extended search allows for better term matching
  useExtendedSearch: true,
};

/**
 * Searches for food items in a given array using Fuse.js.
 */
export function searchInItems<T>(query: string, items: T[]): T[] {
  if (!query.trim() || !items.length) return [];
  const fuse = new Fuse(items, fuseOptions as any);
  return fuse.search(query.trim()).map(result => result.item);
}

// Initialize Fuse instance once to avoid re-indexing on every search call.
// This is critical for performance when the database size grows.
const fuse = new Fuse(foodItems, fuseOptions);

/**
 * Searches for food items in the local database.
 * @param query - The user's search string (e.g., "тварог", "курица")
 * @returns An array of FoodItem objects sorted by relevance.
 */
export function searchFood(query: string): FoodItem[] {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return [];
  }

  // Fuse.search returns an array of { item: FoodItem, score: number, ... }
  const results = fuse.search(trimmedQuery);

  // Extract the original food objects from search results
  return results.map(result => result.item);
}
