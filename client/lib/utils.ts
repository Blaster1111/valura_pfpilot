import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  const billion = 1000000000;
  const million = 1000000;
  const thousand = 1000;

  if (value >= billion) {
    return `$${(value / billion).toFixed(2)}B`;
  } else if (value >= million) {
    return `$${(value / million).toFixed(2)}M`;
  } else if (value >= thousand) {
    return `$${(value / thousand).toFixed(2)}K`;
  } else {
    return formatCurrency(value);
  }
}

export function getScoreColor(score: number): string {
  if (score >= 800) return "text-green-600";
  if (score >= 600) return "text-yellow-600";
  if (score >= 400) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 800) return "bg-green-100 text-green-800";
  if (score >= 600) return "bg-yellow-100 text-yellow-800";
  if (score >= 400) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}