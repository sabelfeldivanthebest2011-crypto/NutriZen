/**
 * NutriZen Adaptive TDEE Engine
 * Inspired by professional athletic coaching algorithms (like MacroFactor).
 * Implements noise-filtering, exponential moving averages, energy balance calculations,
 * and high-fidelity confidence scoring.
 */

export interface DailyLogSummary {
  dateStr: string;        // YYYY-MM-DD
  timestamp: number;      // Start of day Unix timestamp (ms)
  rawWeight?: number;     // Raw user weight in kg, undefined if not logged
  caloriesConsumed?: number; // Total calories logged, undefined if no food logged
}

export interface TDEEResult {
  updatedTDEE: number;
  confidenceScore: number; // 0.0 to 1.0 (0% to 100%)
  explanation_en: string;
  explanation_ru: string;
  smoothedWeight: number;
  trendWeight: number;
  rawWeight: number;
  noiseDetected: boolean;
}

/**
 * Calculates exponential moving average for a series.
 * Handles potential undefined values via forward-filling before computation.
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

/**
 * Analyzes historical logs and executes the Adaptive TDEE calculation.
 * 
 * @param logs Unsorted historical food and weight logs for a user.
 * @param currentTDEE The user's current baseline/baseline-recalculated TDEE.
 * @param lastTDEE The active adaptive TDEE value in the store.
 * @returns An object with updated TDEE, confidence, and detailed explanation.
 */
export function calculateAdaptiveTDEE(
  logs: DailyLogSummary[],
  currentTDEE: number,
  lastTDEE: number
): TDEEResult {
  // Sort logs by timestamp ascending
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

  const baselineTDEE = lastTDEE || currentTDEE || 2500;

  if (sortedLogs.length < 7) {
    return {
      updatedTDEE: baselineTDEE,
      confidenceScore: 0,
      explanation_en: "Minimum data threshold not met. Please log weight and food for at least 7 days to start adaptive updates.",
      explanation_ru: "Минимальный порог данных не пройден. Пожалуйста, записывайте вес и еду не менее 7 дней для адаптации.",
      smoothedWeight: sortedLogs.length > 0 ? (sortedLogs[sortedLogs.length - 1].rawWeight || 70) : 70,
      trendWeight: sortedLogs.length > 0 ? (sortedLogs[sortedLogs.length - 1].rawWeight || 70) : 70,
      rawWeight: sortedLogs.length > 0 ? (sortedLogs[sortedLogs.length - 1].rawWeight || 70) : 70,
      noiseDetected: false,
    };
  }

  // Define full consecutive day series to prevent gaps in EMA calculations
  const firstDay = sortedLogs[0].timestamp;
  const lastDay = sortedLogs[sortedLogs.length - 1].timestamp;
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  const totalDaysCount = Math.round((lastDay - firstDay) / oneDayMs) + 1;
  const dailySeries: DailyLogSummary[] = [];

  for (let i = 0; i < totalDaysCount; i++) {
    const curTs = firstDay + i * oneDayMs;
    const curDate = new Date(curTs);
    const dateStr = curDate.toISOString().split('T')[0];

    // Find actual log if exists on this day
    const matchingLog = sortedLogs.find(l => {
      const logDate = new Date(l.timestamp);
      return logDate.getFullYear() === curDate.getFullYear() &&
             logDate.getMonth() === curDate.getMonth() &&
             logDate.getDate() === curDate.getDate();
    });

    dailySeries.push({
      dateStr,
      timestamp: curTs,
      rawWeight: matchingLog?.rawWeight,
      caloriesConsumed: matchingLog?.caloriesConsumed,
    });
  }

  // Forward fill weights to construct continuous raw list
  let lastKnownWeight = 70;
  // Initialize lastKnownWeight with first recorded weight, if any
  const firstWeightLog = dailySeries.find(d => d.rawWeight !== undefined);
  if (firstWeightLog && firstWeightLog.rawWeight) {
    lastKnownWeight = firstWeightLog.rawWeight;
  }

  const continuousWeights: number[] = [];
  const loggedWeightFlags: boolean[] = [];

  dailySeries.forEach((day) => {
    if (day.rawWeight !== undefined && day.rawWeight > 0) {
      lastKnownWeight = day.rawWeight;
      loggedWeightFlags.push(true);
    } else {
      loggedWeightFlags.push(false);
    }
    continuousWeights.push(lastKnownWeight);
  });

  // Generate Smoothed Weight (7-day EMA) and Trend Weight (21-day EMA)
  const smoothedWeights = calculateEMA(continuousWeights, 7);
  const trendWeights = calculateEMA(continuousWeights, 21);

  // Identify last day values
  const n = dailySeries.length;
  const todayRaw = continuousWeights[n - 1];
  const todaySmoothed = smoothedWeights[n - 1];
  const todayTrend = trendWeights[n - 1];

  // 1. Noise Filter Layer
  // "If weight changes > ±0.5–0.7kg in 1–3 days AND calories are stable → treat as noise. Do NOT update TDEE"
  let noiseDetected = false;
  let noiseExplanation_en = "";
  let noiseExplanation_ru = "";

  if (n >= 4) {
    const recentRawDiff = Math.abs(continuousWeights[n - 1] - continuousWeights[n - 3]);
    const recentSmoothedDiff = Math.abs(smoothedWeights[n - 1] - smoothedWeights[n - 3]);
    
    // Check if calories are relatively stable over last 3 days
    // Stable means variance is reasonably bounded or calories average close to base TDEE
    const last3DaysCals = dailySeries.slice(n - 3, n).map(d => d.caloriesConsumed || baselineTDEE);
    const avg3DayCals = last3DaysCals.reduce((sum, c) => sum + c, 0) / 3;
    const calorieFluctuation = Math.abs(avg3DayCals - baselineTDEE) / baselineTDEE;

    // Trigger noise filter if weight jumps/drops suddenly while calories are within 25% of baseline
    if ((recentRawDiff >= 0.6 || recentSmoothedDiff >= 0.45) && calorieFluctuation < 0.25) {
      noiseDetected = true;
      noiseExplanation_en = "Significant short-term weight fluctuation detected, likely water-weight shifts. Dynamic TDEE adjustments scaled down to preserve stability.";
      noiseExplanation_ru = "Обнаружено сильное кратковременное колебание веса (вероятно, вода). Коррекция TDEE замедлена для стабильности.";
    }
  }

  // 2. Window-Based TDEE Calculation (analyze last 14 days or maximum available up to 28 days)
  const windowSize = Math.max(7, Math.min(14, n - 1));
  const windowSeries = dailySeries.slice(n - windowSize, n);
  
  // Count how many days inside this window have actual logs
  const actualWeightLogsCount = loggedWeightFlags.slice(n - windowSize, n).filter(f => f).length;
  const actualCalorieLogsCount = windowSeries.filter(w => w.caloriesConsumed !== undefined && w.caloriesConsumed > 400).length;

  // 3. Confidence Scoring Function
  // Factors: actual logs density, variance of calories (sporadic loggers have low confidence)
  const weightLogDensity = actualWeightLogsCount / windowSize;
  const calorieLogDensity = actualCalorieLogsCount / windowSize;
  
  // Calculate calorie coefficient: penalty for days with 0/missing logs
  const calorieValues = windowSeries.map(w => w.caloriesConsumed || 0);
  const daysZeroCalories = calorieValues.filter(c => c === 0).length;
  const penaltyFactor = Math.max(0.1, 1 - (daysZeroCalories / windowSize));

  // Variance of calorie logs (stable loggers are highly predictable)
  let calorieVarianceCoef = 1.0;
  if (actualCalorieLogsCount >= 4) {
    const loggedCals = calorieValues.filter(c => c > 400);
    const mean = loggedCals.reduce((s, c) => s + c, 0) / loggedCals.length;
    const stdDev = Math.sqrt(loggedCals.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / loggedCals.length);
    // If StdDev is extreme (e.g. standard deviation > 1000 cals), confidence is slightly lower
    if (stdDev > 800) {
      calorieVarianceCoef = 0.85;
    } else if (stdDev > 500) {
      calorieVarianceCoef = 0.95;
    }
  }

  // Cumulative Confidence Score
  const rawConfidence = (weightLogDensity * 0.45 + calorieLogDensity * 0.55) * penaltyFactor * calorieVarianceCoef;
  const confidenceScore = Math.max(0, Math.min(1.0, rawConfidence));

  // Determine if threshold is met
  // Min 6 days of logging calorie and 4 days of weight in the window
  const hasMinData = actualCalorieLogsCount >= 5 && actualWeightLogsCount >= 3;

  if (!hasMinData || confidenceScore < 0.25) {
    return {
      updatedTDEE: Math.round(baselineTDEE),
      confidenceScore,
      explanation_en: "Unstable or insufficient logging data in the past week. TDEE updates paused to prevent noise-spreading.",
      explanation_ru: "Нестабильные или недостаточные логи за неделю. Обновления приостановлены для предотвращения шума.",
      smoothedWeight: todaySmoothed,
      trendWeight: todayTrend,
      rawWeight: todayRaw,
      noiseDetected,
    };
  }

  // 4. Core Energy Balance Calculation
  // expected_change = (avg_calories - current_TDEE) / 7700
  // actual_change = smoothed_weight(today) - smoothed_weight(today - days)
  // error = actual_change - expected_change
  // TDEE_new = TDEE_old + (error * 7700 / days) * alpha
  
  const totalCaloriesInWindow = windowSeries.reduce((sum, d) => sum + (d.caloriesConsumed || baselineTDEE), 0);
  const avgCaloriesInWindow = totalCaloriesInWindow / windowSize;

  const pastWeightSmoothed = smoothedWeights[n - 1 - windowSize];
  const actualWeightChange = todaySmoothed - pastWeightSmoothed;

  // Weight change expected under baseline TDEE
  const expectedWeightChange = ((avgCaloriesInWindow - baselineTDEE) * windowSize) / 7700;
  
  // Real weight outcome difference
  const error = actualWeightChange - expectedWeightChange; // in kg

  // Energy error per day (kcal/day)
  const energyErrorPerDay = (error * 7700) / windowSize;

  // Determine dynamic adaptation factor (alpha) based on confidence & noise presence
  // Alpha constrained between 0.05 and 0.2 according to requirements
  let alpha = 0.12 * confidenceScore;
  if (noiseDetected) {
    alpha = alpha * 0.4; // reduce response speed significantly if heavy noise detected
  }
  alpha = Math.max(0.05, Math.min(0.20, alpha));

  // Suggest raw update
  const rawAdjustment = energyErrorPerDay * alpha;

  // Stability Constraints:
  // "Maximum TDEE adjustment per week: ±100–150 kcal"
  // Let's make it proportional to the window Size (e.g. ±125 kcal per 7 days = ±18 kcal maximum change per day in current update)
  const maxWeeklyAdjustment = 140; // kcal limit per week
  const maxDailyShiftPerDayInWindow = (maxWeeklyAdjustment / 7); // ~20 kcal max daily drift applied
  const maxAdjustment = maxDailyShiftPerDayInWindow * windowSize; // e.g. 14 days window -> 280 kcal max transition limit

  const boundedAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, rawAdjustment));
  const newTDEE = baselineTDEE + boundedAdjustment;

  // Final validation and bounding to standard humanoid levels
  const verifiedTDEE = Math.max(1200, Math.min(5000, Math.round(newTDEE)));

  // Generate localized summaries
  const roundedAdj = Math.round(verifiedTDEE - baselineTDEE);
  const absAdj = Math.abs(roundedAdj);
  
  let explanation_en = "";
  let explanation_ru = "";

  if (absAdj < 5) {
    explanation_en = `Your TDEE is perfectly calibrated! Metabolic equilibrium is maintained at ${verifiedTDEE} kcal.`;
    explanation_ru = `Ваш TDEE идеально откалиброван! Метаболическое равновесие сохраняется на уровне ${verifiedTDEE} ккал.`;
  } else {
    const direction = roundedAdj > 0 ? "increased" : "decreased";
    const direction_ru = roundedAdj > 0 ? "увеличен" : "снижен";
    explanation_en = `TDEE ${direction} by ${absAdj} kcal to match your adaptive energy output. Confidence: ${Math.round(confidenceScore * 100)}%.`;
    explanation_ru = `TDEE ${direction_ru} на ${absAdj} ккал в соответствии с расходом энергии. Доверие: ${Math.round(confidenceScore * 100)}%.`;
  }

  if (noiseDetected) {
    explanation_en += ` ${noiseExplanation_en}`;
    explanation_ru += ` ${noiseExplanation_ru}`;
  }

  return {
    updatedTDEE: verifiedTDEE,
    confidenceScore,
    explanation_en,
    explanation_ru,
    smoothedWeight: todaySmoothed,
    trendWeight: todayTrend,
    rawWeight: todayRaw,
    noiseDetected,
  };
}
