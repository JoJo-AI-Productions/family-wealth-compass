import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { Transaction } from '@/types/finance';

export type TimePeriod = 'week' | 'month' | 'year';

export function useFinanceStats(transactions: Transaction[], period: TimePeriod) {
  return useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return isWithinInterval(d, { start, end });
    });

    const totalIncome = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Category breakdown for expenses
    const expenseByCategory: Record<string, number> = {};
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    const categoryBreakdown = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
      filteredTransactions: filtered,
      periodLabel: period === 'week' ? '本周' : period === 'month' ? '本月' : '本年',
    };
  }, [transactions, period]);
}
