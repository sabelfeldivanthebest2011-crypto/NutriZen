export const WEIGHT_STEP = 0.05;

/**
 * Snaps any weight value to the nearest unified WEIGHT_STEP (0.05),
 * ensuring maximum mathematical and visual consistency.
 */
export const snapWeight = (val: number, minVal: number = 30, maxVal: number = 250): number => {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return snappedValue(70, minVal, maxVal);
  return snappedValue(val, minVal, maxVal);
};

function snappedValue(val: number, min: number, max: number): number {
  const multiplier = Math.round(1 / WEIGHT_STEP);
  const snapped = Math.round(val * multiplier) / multiplier;
  const bounded = Math.max(min, Math.min(max, snapped));
  const stepStr = WEIGHT_STEP.toString();
  const decimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  return parseFloat(bounded.toFixed(decimalPlaces));
}
