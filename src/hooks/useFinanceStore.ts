import { useState, useEffect, useCallback } from 'react';
import {
  FinanceState,
  Transaction,
  Category,
  Account,
  Budget,
  ExpenseThresholds,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '@/types/finance';

const STORAGE_KEY = 'family-finance-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getInitialState(): FinanceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e);
  }
  return {
    transactions: [],
    categories: [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
    accounts: DEFAULT_ACCOUNTS,
    budgets: [],
    thresholds: { large: 500, xlarge: 2000 },
  };
}

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to storage:', e);
    }
  }, [state]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      transactions: [
        { ...tx, id: generateId(), createdAt: new Date().toISOString() },
        ...prev.transactions,
      ],
    }));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { ...cat, id: generateId() }],
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  const setThresholds = useCallback((thresholds: ExpenseThresholds) => {
    setState(prev => ({ ...prev, thresholds }));
  }, []);

  const getExpenseTag = useCallback((amount: number) => {
    if (amount >= state.thresholds.xlarge) return 'xlarge';
    if (amount >= state.thresholds.large) return 'large';
    return 'normal';
  }, [state.thresholds]);

  return {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    setThresholds,
    getExpenseTag,
  };
}
