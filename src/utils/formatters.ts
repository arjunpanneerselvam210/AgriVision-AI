/**
 * Utility formatters for metrics, areas, percentages, and dates
 */

export function formatAreaHa(ha: number | null | undefined): string {
  if (ha === null || ha === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(ha) + ' ha';
}

export function formatAreaKm2(km2: number | null | undefined): string {
  if (km2 === null || km2 === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  }).format(km2) + ' km²';
}

export function formatPercentage(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—';
  return (pct * 100 > 100 ? pct.toFixed(1) : (pct * 100).toFixed(1)) + '%';
}

export function formatAccuracyPct(acc: number | null | undefined): string {
  if (acc === null || acc === undefined) return '—';
  const val = acc > 1 ? acc : acc * 100;
  return val.toFixed(1) + '%';
}

export function formatMetricScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(3);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export const formatHectares = (ha: number | null | undefined): string => formatAreaHa(ha);
export const formatSquareKm = (km2: number | null | undefined): string => formatAreaKm2(km2);
export const formatCropName = (crop: string | number): string => {
  const c = String(crop).toLowerCase();
  if (c === 'paddy' || c === '1') return 'Paddy';
  if (c === 'banana' || c === '2') return 'Banana';
  return 'Other Agriculture';
};
