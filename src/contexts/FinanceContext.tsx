import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  FinanceState,
  Transaction,
  Category,
  Account,
  ExpenseThresholds,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '@/types/finance';

const STORAGE_KEY = 'family-finance-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function loadState(): FinanceState {
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

function saveState(state: FinanceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to storage:', e);
  }
}

interface FinanceContextValue extends FinanceState {
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  setThresholds: (thresholds: ExpenseThresholds) => void;
  getExpenseTag: (amount: number) => 'normal' | 'large' | 'xlarge';
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(loadState);

  // Persist every state change to localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    setState(prev => {
      const next = {
        ...prev,
        transactions: [
          { ...tx, id: generateId(), createdAt: new Date().toISOString() },
          ...prev.transactions,
        ],
      };
      return next;
    });
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

  const addAccount = useCallback((acc: Omit<Account, 'id'>) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...acc, id: generateId() }],
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
    }));
  }, []);

  const setThresholds = useCallback((thresholds: ExpenseThresholds) => {
    setState(prev => ({ ...prev, thresholds }));
  }, []);

  const getExpenseTag = useCallback((amount: number) => {
    if (amount >= state.thresholds.xlarge) return 'xlarge' as const;
    if (amount >= state.thresholds.large) return 'large' as const;
    return 'normal' as const;
  }, [state.thresholds]);

  return (
    <FinanceContext.Provider value={{
      ...state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      addAccount,
      deleteAccount,
      setThresholds,
      getExpenseTag,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceStore() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinanceStore must be used within FinanceProvider');
  return ctx;
}
