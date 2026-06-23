/**
 * Format a number as Indian Rupees (₹).
 * Returns an em-dash for null to clearly signal missing data.
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a percentage with a leading + for positive values.
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a plain number to N decimal places.
 */
export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null) return '—';
  return value.toFixed(decimals);
}

/**
 * Returns a Tailwind text-color class based on the sign of the value.
 * Used for Gain/Loss columns and cards.
 */
export function getGainLossColorClass(value: number | null): string {
  if (value === null) return 'text-gray-400';
  return value >= 0 ? 'text-green-400' : 'text-red-400';
}