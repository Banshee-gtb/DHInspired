import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function getLowestVariantPrice(variants: { price: number }[]): number {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
}

export function getProductDisplayPrice(product: {
  has_variants: boolean;
  base_price: number;
  product_variants?: { price: number }[];
}): number {
  if (product.has_variants && product.product_variants?.length) {
    return getLowestVariantPrice(product.product_variants);
  }
  return product.base_price || 0;
}
