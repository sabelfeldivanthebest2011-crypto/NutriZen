import { supabase } from './supabase';
import { db } from '../db/db';
import { useStore } from '../store/useStore';

export async function syncData() {
  const store = useStore.getState();
  const user = store.user;

  // We only sync if there is a logged-in user and network is available
  if (!user) {
    console.log('[Sync] No logged-in user, skipping sync.');
    return;
  }
  if (!navigator.onLine) {
    console.log('[Sync] Offline mode, skipping cloud synchronization.');
    return;
  }

  // Prevent multiple concurrent sync sessions
  if (store.syncInProgress) {
    console.log('[Sync] Sync in progress, skipping duplicate call.');
    return;
  }

  store.setSyncInProgress(true);
  store.setSyncError(null);

  try {
    console.log('[Sync] Beginning cloud synchronization...');
    const userId = user.id;

    // --- 1. HANDLE LOCAL DELETED QUEUE ---
    const deletedQueue = store.deletedQueue || [];
    if (deletedQueue.length > 0) {
      console.log(`[Sync] Processing local deletions queue: ${deletedQueue.length} items`);
      for (const del of deletedQueue) {
        if (del.table === 'foods') {
          await supabase
            .from('user_products')
            .update({ deleted: true, updated_at: new Date().toISOString() })
            .eq('id', del.id.toString())
            .eq('user_id', userId);
        } else if (del.table === 'recipes') {
          await supabase
            .from('recipes')
            .update({ deleted: true, updated_at: new Date().toISOString() })
            .eq('id', del.id.toString())
            .eq('user_id', userId);
        } else if (del.table === 'weights') {
          await supabase
            .from('weight_logs')
            .delete()
            .eq('id', del.id.toString())
            .eq('user_id', userId);
        }
      }
      store.clearDeletedQueue();
    }

    // --- 2. SYNC USER PRODUCTS ---
    console.log('[Sync] Syncing user products...');
    const { data: cloudProducts, error: prodError } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId);

    if (prodError) throw prodError;

    const cloudProdMap = new Map<string, any>();
    if (cloudProducts) {
      cloudProducts.forEach(p => cloudProdMap.set(p.id, p));
    }

    // Get all user foods from Dexie
    const localUserFoods = await db.foods.where('type').equals('user').toArray();

    for (const localFood of localUserFoods) {
      if (!localFood.id) continue;
      const key = localFood.id.toString();
      const cloudFood = cloudProdMap.get(key);

      const localUpdated = localFood.last_used || 0; // fallback to 0 or last_used/updated epoch

      if (!cloudFood) {
        // Does not exist in cloud, upload
        const payload = {
          id: key,
          user_id: userId,
          name: localFood.name_en,
          name_ru: localFood.name_ru,
          nutrients_json: localFood.nutrients_100g,
          created_at: new Date().toISOString(),
          updated_at: new Date(localUpdated || Date.now()).toISOString(),
          deleted: false
        };
        const { error } = await supabase.from('user_products').upsert(payload);
        if (error) console.error('[Sync] Error uploading product:', error);
      } else {
        // Compare modification times
        const cloudUpdated = new Date(cloudFood.updated_at || cloudFood.created_at).getTime();
        if (cloudFood.deleted) {
          // Cloud says deleted, remove locally
          await db.foods.delete(localFood.id);
        } else if (localUpdated > cloudUpdated) {
          // Local is newer, upload to cloud
          const payload = {
            id: key,
            user_id: userId,
            name: localFood.name_en,
            name_ru: localFood.name_ru,
            nutrients_json: localFood.nutrients_100g,
            updated_at: new Date(localUpdated).toISOString(),
            deleted: false
          };
          await supabase.from('user_products').upsert(payload);
        } else if (cloudUpdated > localUpdated) {
          // Cloud is newer, update locally
          await db.foods.put({
            ...localFood,
            name_en: cloudFood.name,
            name_ru: cloudFood.name_ru,
            nutrients_100g: typeof cloudFood.nutrients_json === 'string' 
              ? JSON.parse(cloudFood.nutrients_json) 
              : cloudFood.nutrients_json,
            last_used: cloudUpdated
          });
        }
      }
      cloudProdMap.delete(key);
    }

    // Any remaining items in cloudProdMap should be downloaded locally if they are not deleted
    for (const [key, cloudFood] of cloudProdMap.entries()) {
      if (cloudFood.deleted) continue;
      const localId = parseInt(key, 10);
      if (isNaN(localId)) continue;

      const nutrients = typeof cloudFood.nutrients_json === 'string'
        ? JSON.parse(cloudFood.nutrients_json)
        : cloudFood.nutrients_json;

      await db.foods.put({
        id: localId,
        name_en: cloudFood.name,
        name_ru: cloudFood.name_ru,
        brand: '',
        type: 'user',
        source: 'USER',
        nutrients_100g: nutrients,
        quality_score: 100,
        usage_count: 0,
        last_used: new Date(cloudFood.updated_at || cloudFood.created_at).getTime()
      });
    }

    // --- 3. SYNC RECIPES ---
    console.log('[Sync] Syncing user recipes...');
    const { data: cloudRecipes, error: recError } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId);

    if (recError) throw recError;

    const cloudRecMap = new Map<string, any>();
    if (cloudRecipes) {
      cloudRecipes.forEach(r => cloudRecMap.set(r.id, r));
    }

    const localRecipes = await db.recipes.toArray();

    for (const localRecipe of localRecipes) {
      if (!localRecipe.id) continue;
      const key = localRecipe.id.toString();
      const cloudRecipe = cloudRecMap.get(key);

      const localUpdated = localRecipe.timestamp || 0;

      if (!cloudRecipe) {
        // Does not exist in cloud, upload
        const payload = {
          id: key,
          user_id: userId,
          name: localRecipe.name,
          ingredients_json: localRecipe.ingredients,
          total_nutrients_json: localRecipe.total_nutrients,
          created_at: new Date(localRecipe.timestamp || Date.now()).toISOString(),
          updated_at: new Date(localRecipe.timestamp || Date.now()).toISOString(),
          deleted: !!localRecipe.deleted
        };
        const { error } = await supabase.from('recipes').upsert(payload);
        if (error) console.error('[Sync] Error uploading recipe:', error);
      } else {
        const cloudUpdated = new Date(cloudRecipe.updated_at || cloudRecipe.created_at).getTime();
        if (cloudRecipe.deleted || localRecipe.deleted) {
          // If deleted on either side, delete locally and ensure cloud is flagged as deleted
          if (!cloudRecipe.deleted) {
            await supabase.from('recipes').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', key);
          }
          await db.recipes.delete(localRecipe.id);
        } else if (localUpdated > cloudUpdated) {
          // Local is newer, upload
          const payload = {
            id: key,
            user_id: userId,
            name: localRecipe.name,
            ingredients_json: localRecipe.ingredients,
            total_nutrients_json: localRecipe.total_nutrients,
            updated_at: new Date(localUpdated).toISOString(),
            deleted: false
          };
          await supabase.from('recipes').upsert(payload);
        } else if (cloudUpdated > localUpdated) {
          // Cloud is newer, sync to local
          const ingredients = typeof cloudRecipe.ingredients_json === 'string'
            ? JSON.parse(cloudRecipe.ingredients_json)
            : cloudRecipe.ingredients_json;
          
          const totalNutrients = typeof cloudRecipe.total_nutrients_json === 'string'
            ? JSON.parse(cloudRecipe.total_nutrients_json)
            : cloudRecipe.total_nutrients_json;

          await db.recipes.put({
            ...localRecipe,
            name: cloudRecipe.name,
            ingredients,
            total_nutrients: totalNutrients,
            timestamp: cloudUpdated
          });
        }
      }
      cloudRecMap.delete(key);
    }

    // Remaining cloud recipes download
    for (const [key, cloudRecipe] of cloudRecMap.entries()) {
      if (cloudRecipe.deleted) continue;
      const localId = parseInt(key, 10);
      if (isNaN(localId)) continue;

      const ingredients = typeof cloudRecipe.ingredients_json === 'string'
        ? JSON.parse(cloudRecipe.ingredients_json)
        : cloudRecipe.ingredients_json;
      
      const totalNutrients = typeof cloudRecipe.total_nutrients_json === 'string'
        ? JSON.parse(cloudRecipe.total_nutrients_json)
        : cloudRecipe.total_nutrients_json;

      await db.recipes.put({
        id: localId,
        name: cloudRecipe.name,
        category: 'snack',
        ingredients,
        total_nutrients: totalNutrients,
        quality_score: 100,
        usage_count: 0,
        timestamp: new Date(cloudRecipe.updated_at || cloudRecipe.created_at).getTime()
      });
    }

    // --- 4. SYNC WEIGHT LOGS ---
    console.log('[Sync] Syncing user weight logs...');
    const { data: cloudWeights, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId);

    if (weightError) throw weightError;

    const cloudWeightMap = new Map<string, any>();
    if (cloudWeights) {
      cloudWeights.forEach(w => cloudWeightMap.set(w.id, w));
    }

    const localWeights = await db.weight.toArray();

    for (const localW of localWeights) {
      if (!localW.id) continue;
      const key = localW.id.toString();
      const cloudW = cloudWeightMap.get(key);

      if (!cloudW) {
        // Upload to cloud
        const payload = {
          id: key,
          user_id: userId,
          weight_kg: Number(localW.weight),
          created_at: new Date(localW.timestamp).toISOString()
        };
        const { error } = await supabase.from('weight_logs').upsert(payload);
        if (error) console.error('[Sync] Error uploading weight log:', error);
      } else {
        // Already exists online, make sure weight values match.
        // We use string representations or simple floating point margins
        if (Math.abs(cloudW.weight_kg - localW.weight) > 0.01) {
          // Local wins by default (LWW based on DB transaction)
          const payload = {
            id: key,
            user_id: userId,
            weight_kg: Number(localW.weight),
            created_at: new Date(localW.timestamp).toISOString()
          };
          await supabase.from('weight_logs').upsert(payload);
        }
      }
      cloudWeightMap.delete(key);
    }

    // Extra entries from cloud download
    for (const [key, cloudW] of cloudWeightMap.entries()) {
      const localId = parseInt(key, 10);
      if (isNaN(localId)) continue;

      await db.weight.put({
        id: localId,
        weight: Number(cloudW.weight_kg),
        timestamp: new Date(cloudW.created_at).getTime()
      });
    }

    console.log('[Sync] Bidirectional sync completed successfully!');
  } catch (err: any) {
    console.error('[Sync] Bidirectional sync failed:', err);
    store.setSyncError(err?.message || 'Sync failed');
  } finally {
    store.setSyncInProgress(false);
  }
}
