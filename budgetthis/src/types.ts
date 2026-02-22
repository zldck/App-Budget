export type CategoryColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'orange' | 'teal' | 'pink' | 'cyan';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  budgeted: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  recurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  isPaid: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  type: 'expense' | 'income';
}

export interface DigitalWallet {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  lastUpdated: string;
  color: CategoryColor;
}

export interface AppData {
  monthlyIncome: number;
  categories: Category[];
  bills: Bill[];
  transactions: Transaction[];
  wallets: DigitalWallet[];
  isSetup: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Housing', emoji: '🏠', color: 'indigo', budgeted: 0 },
  { id: 'cat-2', name: 'Food & Dining', emoji: '🍔', color: 'emerald', budgeted: 0 },
  { id: 'cat-3', name: 'Transportation', emoji: '🚗', color: 'sky', budgeted: 0 },
  { id: 'cat-4', name: 'Utilities', emoji: '💡', color: 'amber', budgeted: 0 },
  { id: 'cat-5', name: 'Entertainment', emoji: '🎭', color: 'violet', budgeted: 0 },
  { id: 'cat-6', name: 'Shopping', emoji: '🛍️', color: 'pink', budgeted: 0 },
  { id: 'cat-7', name: 'Health', emoji: '💊', color: 'rose', budgeted: 0 },
  { id: 'cat-8', name: 'Savings', emoji: '💰', color: 'teal', budgeted: 0 },
];

export const WALLET_PRESETS: { name: string; emoji: string; color: CategoryColor }[] = [
  { name: 'Cash', emoji: '💵', color: 'emerald' },
  { name: 'GCash', emoji: '💚', color: 'teal' },
  { name: 'PayMaya', emoji: '💙', color: 'sky' },
  { name: 'PayPal', emoji: '🅿️', color: 'indigo' },
  { name: 'Bank Account', emoji: '🏦', color: 'violet' },
  { name: 'Venmo', emoji: '💜', color: 'pink' },
  { name: 'Apple Pay', emoji: '🍎', color: 'rose' },
  { name: 'Google Pay', emoji: '🟢', color: 'emerald' },
  { name: 'Crypto', emoji: '₿', color: 'amber' },
  { name: 'Savings Account', emoji: '🐷', color: 'pink' },
];

export const CATEGORY_COLORS: Record<CategoryColor, { bg: string; text: string; light: string; bar: string; gradient: string }> = {
  indigo: { bg: 'bg-indigo-200', text: 'text-indigo-500', light: 'bg-indigo-50/60', bar: 'bg-indigo-300/70', gradient: 'from-indigo-200 to-indigo-300' },
  emerald: { bg: 'bg-emerald-200', text: 'text-emerald-500', light: 'bg-emerald-50/60', bar: 'bg-emerald-300/70', gradient: 'from-emerald-200 to-emerald-300' },
  rose: { bg: 'bg-rose-200', text: 'text-rose-500', light: 'bg-rose-50/60', bar: 'bg-rose-300/70', gradient: 'from-rose-200 to-rose-300' },
  amber: { bg: 'bg-amber-200', text: 'text-amber-500', light: 'bg-amber-50/60', bar: 'bg-amber-300/70', gradient: 'from-amber-200 to-amber-300' },
  sky: { bg: 'bg-sky-200', text: 'text-sky-500', light: 'bg-sky-50/60', bar: 'bg-sky-300/70', gradient: 'from-sky-200 to-sky-300' },
  violet: { bg: 'bg-violet-200', text: 'text-violet-500', light: 'bg-violet-50/60', bar: 'bg-violet-300/70', gradient: 'from-violet-200 to-violet-300' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-500', light: 'bg-orange-50/60', bar: 'bg-orange-300/70', gradient: 'from-orange-200 to-orange-300' },
  teal: { bg: 'bg-teal-200', text: 'text-teal-500', light: 'bg-teal-50/60', bar: 'bg-teal-300/70', gradient: 'from-teal-200 to-teal-300' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-500', light: 'bg-pink-50/60', bar: 'bg-pink-300/70', gradient: 'from-pink-200 to-pink-300' },
  cyan: { bg: 'bg-cyan-200', text: 'text-cyan-500', light: 'bg-cyan-50/60', bar: 'bg-cyan-300/70', gradient: 'from-cyan-200 to-cyan-300' },
};

export const EMOJI_OPTIONS = ['🏠', '🍔', '🚗', '💡', '🎭', '🛍️', '💊', '💰', '📚', '✈️', '👕', '🎮', '🐕', '💼', '🎁', '📱', '🏋️', '☕', '🎵', '🔧'];

export const COLOR_OPTIONS: CategoryColor[] = ['indigo', 'emerald', 'rose', 'amber', 'sky', 'violet', 'orange', 'teal', 'pink', 'cyan'];

export function getCategoryColor(color: CategoryColor) {
  return CATEGORY_COLORS[color];
}

export function formatCurrency(amount: number): string {
  return '₱' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}k`;
  }
  return `₱${amount.toFixed(0)}`;
}

export function getMonthKey(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(date?: Date): number {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function getDaysLeftInMonth(): number {
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  return daysInMonth - today.getDate() + 1;
}

export function getDaysAfterToday(): number {
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  return daysInMonth - today.getDate();
}

export function getMonthlyAllocation(bill: Bill): number {
  if (bill.isPaid) return 0;

  if (bill.recurring) {
    switch (bill.frequency) {
      case 'monthly': return bill.amount;
      case 'quarterly': return bill.amount / 3;
      case 'yearly': return bill.amount / 12;
      default: return bill.amount;
    }
  }

  const today = new Date();
  const dueDate = new Date(bill.dueDate);
  const monthsUntilDue = Math.max(1,
    (dueDate.getFullYear() - today.getFullYear()) * 12 +
    (dueDate.getMonth() - today.getMonth())
  );
  return bill.amount / monthsUntilDue;
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
