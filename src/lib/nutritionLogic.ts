import { FoodLog } from '../db/db';

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

interface RatingDetails {
  score: number;
  grade: NutriScore;
  positiveFactors: { label: string; value: string; impact: 'positive' }[];
  negativeFactors: { label: string; value: string; impact: 'negative' }[];
}

export function calculateMealRating(logs: FoodLog[]): RatingDetails {
  if (logs.length === 0) return { score: 0, grade: 'C', positiveFactors: [], negativeFactors: [] };

  let totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0, // Assume sodium is calculated or mocked if not in DB yet
  };

  logs.forEach(log => {
    totals.calories += log.nutrients?.calories ?? 0;
    totals.protein += log.nutrients?.protein ?? 0;
    totals.carbs += log.nutrients?.carbs ?? 0;
    totals.fat += log.nutrients?.fat ?? 0;
    totals.fiber += log.nutrients?.fiber ?? 0;
    totals.sugar += log.nutrients?.sugar ?? 0;
  });

  // Simple heuristic algorithm for Nutrition Density
  let points = 0;

  // Negative points (higher is worse)
  const sugarPoints = Math.min(10, Math.floor(totals.sugar / 4.5));
  const fatPoints = Math.min(10, Math.floor(totals.fat / 5)); // Simplified
  const calPoints = Math.min(10, Math.floor(totals.calories / 100));

  // Positive points (higher is better)
  const fiberPoints = Math.min(5, Math.floor(totals.fiber / 0.7));
  const proteinPoints = Math.min(5, Math.floor(totals.protein / 1.6));

  const finalScore = (sugarPoints + fatPoints + calPoints) - (fiberPoints + proteinPoints);

  let grade: NutriScore = 'C';
  if (finalScore <= -1) grade = 'A';
  else if (finalScore <= 2) grade = 'B';
  else if (finalScore <= 10) grade = 'C';
  else if (finalScore <= 18) grade = 'D';
  else grade = 'E';

  const positiveFactors: any[] = [];
  if (totals.protein > 15) positiveFactors.push({ label: 'Высокое содержание белка', value: `${Math.round(totals.protein)}г`, impact: 'positive' });
  if (totals.fiber > 5) positiveFactors.push({ label: 'Много клетчатки', value: `${Math.round(totals.fiber)}г`, impact: 'positive' });

  const negativeFactors: any[] = [];
  if (totals.sugar > 10) negativeFactors.push({ label: 'Высокий сахар', value: `${Math.round(totals.sugar)}г`, impact: 'negative' });
  if (totals.calories > 600) negativeFactors.push({ label: 'Высокая калорийность', value: `${Math.round(totals.calories)}`, impact: 'negative' });

  return {
    score: finalScore,
    grade,
    positiveFactors,
    negativeFactors
  };
}
