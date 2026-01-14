import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateMarkup(buyPrice: number, markupPct: number): number {
  return buyPrice * (1 + markupPct / 100);
}

export function calculateLineTotal(qty: number, sellPrice: number): number {
  return qty * sellPrice;
}

export function calculateTax(subtotal: number, taxRate: number = 10): number {
  return subtotal * (taxRate / 100);
}

export function generateInvoiceNumber(lastNumber?: string): string {
  if (!lastNumber) return 'INV-00001';
  const num = parseInt(lastNumber.replace('INV-', ''), 10);
  return `INV-${String(num + 1).padStart(5, '0')}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    quote: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    invoiced: 'bg-purple-100 text-purple-800',
    paid: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export function daysSince(date: string): number {
  const diff = new Date().getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
