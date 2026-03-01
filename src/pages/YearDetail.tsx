import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Transaction, TransactionType } from '@/types/finance';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  getDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function YearDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type: TransactionType = (searchParams.get('type') as TransactionType) || 'expense';
  const store = useFinanceStore();

  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  // Monthly totals for the calendar color coding
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    months.forEach(m => {
      const key = format(m, 'yyyy-MM');
      const interval = { start: startOfMonth(m), end: endOfMonth(m) };
      const filtered = store.transactions.filter(t =>
        isWithinInterval(new Date(t.date), interval)
      );
      map[key] = {
        income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
    return map;
  }, [store.transactions, year]);

  // Selected date stats
  const selectedStats = useMemo(() => {
    const filtered = store.transactions.filter(t =>
      isSameDay(new Date(t.date), selectedDate)
    );
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, transactions: filtered };
  }, [store.transactions, selectedDate]);

  // Selected month calendar
  const selectedMonth = useMemo(() => {
    const mStart = startOfMonth(selectedDate);
    const mEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: mStart, end: mEnd });
    // getDay: 0=Sun. We want Mon=0
    const firstDayOffset = (getDay(mStart) + 6) % 7;
    return { days, firstDayOffset, mStart, mEnd };
  }, [selectedDate]);

  // Day has data indicator
  const dayHasData = useMemo(() => {
    const map = new Set<string>();
    store.transactions.forEach(t => {
      map.add(format(new Date(t.date), 'yyyy-MM-dd'));
    });
    return map;
  }, [store.transactions]);

  const getMonthColor = (monthKey: string) => {
    const data = monthlyData[monthKey];
    if (!data) return 'bg-muted/50';
    if (type === 'expense') {
      if (data.expense > 5000) return 'bg-destructive';
      if (data.expense > 2000) return 'bg-destructive/70';
      if (data.expense > 0) return 'bg-destructive/40';
      return 'bg-muted/50';
    } else {
      if (data.income > 5000) return 'bg-success';
      if (data.income > 2000) return 'bg-success/70';
      if (data.income > 0) return 'bg-success/40';
      return 'bg-muted/50';
    }
  };

  // Year totals
  const yearTotals = useMemo(() => {
    const filtered = store.transactions.filter(t =>
      isWithinInterval(new Date(t.date), { start: yearStart, end: yearEnd })
    );
    return {
      income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }, [store.transactions, year]);

  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between pt-6 pb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setYear(y => y - 1)} className="p-1 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{year}年度</h1>
            <button onClick={() => setYear(y => y + 1)} className="p-1 text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-10" />
        </header>

        {/* Year calendar grid - 4 rows x 6 cols (but actually 4x3 for months) */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {months.map(m => {
            const key = format(m, 'yyyy-MM');
            const isSelected = isSameMonth(m, selectedDate);
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(startOfMonth(m))}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${getMonthColor(key)} ${
                  isSelected ? 'ring-2 ring-primary shadow-float scale-105' : ''
                }`}
              >
                <span className="text-[10px] font-medium text-foreground/80">
                  {format(m, 'M月')}
                </span>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <div className="w-1 h-2 bg-card rounded-b-sm" />
                  <div className="w-1 h-2 bg-card rounded-b-sm" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected date summary card */}
        <div className="rounded-2xl bg-card p-5 shadow-card mb-6">
          <h3 className="text-center text-sm font-semibold text-muted-foreground mb-3">
            {format(selectedDate, 'M月d日')}
          </h3>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-2xl font-bold text-destructive">
                {selectedStats.expense.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-0.5">元</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="text-2xl font-bold text-success">
                {selectedStats.income.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-0.5">元</span>
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              selectedStats.balance >= 0
                ? 'bg-success/15 text-success'
                : 'bg-destructive/15 text-destructive'
            }`}>
              {selectedStats.balance >= 0 ? '+' : ''}{selectedStats.balance.toLocaleString()}元
            </span>
          </div>
        </div>

        {/* Month calendar detail */}
        <div className="rounded-2xl bg-card p-4 shadow-card mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
            {format(selectedDate, 'yyyy年M月')}
          </h3>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: selectedMonth.firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {selectedMonth.days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const hasData = dayHasData.has(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-float'
                      : isToday
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {format(day, 'd')}
                  {hasData && !isSelected && (
                    <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Year summary */}
        <div className="rounded-2xl bg-card p-4 shadow-card mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">年度汇总</h3>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">总收入</span>
            <span className="text-sm font-bold text-success">¥{yearTotals.income.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">总支出</span>
            <span className="text-sm font-bold text-destructive">¥{yearTotals.expense.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">结余</span>
            <span className={`text-sm font-bold ${yearTotals.income - yearTotals.expense >= 0 ? 'text-success' : 'text-destructive'}`}>
              ¥{(yearTotals.income - yearTotals.expense).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Day transactions */}
        {selectedStats.transactions.length > 0 && (
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {format(selectedDate, 'M月d日')}明细
            </h3>
            <div className="space-y-2">
              {selectedStats.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {store.categories.find(c => c.name === tx.category)?.icon || '📌'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.category}</p>
                      {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-destructive' : 'text-success'}`}>
                    {tx.type === 'expense' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}