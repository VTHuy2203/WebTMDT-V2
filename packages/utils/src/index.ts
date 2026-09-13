export * from './i18n';
import { formatPrice, useI18nStore } from './i18n';

/**
 * Format currency with automatic VND/USD conversion based on current locale.
 * Fixed exchange rate: 26,250 VND = $1.00 USD.
 */
export function formatCurrency(amount: number, currency?: string): string {
  if (isNaN(amount)) return '0 ₫';
  if (currency === 'USD') {
    return formatPrice(amount, 'en');
  }
  if (currency === 'VND') {
    return formatPrice(amount, 'vi');
  }
  // Auto-detect based on current user locale
  return formatPrice(amount);
}


/**
 * Format ISO date string to Vietnamese date format
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (includeTime) {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Human-readable relative time (e.g. 5 phút trước, 2 ngày trước)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return formatDate(dateString);
}

/**
 * Slugify Vietnamese strings
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper to join class names safely
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(originalPrice: number, currentPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
