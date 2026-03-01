import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '@/types/finance';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface ExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(25, 95%, 55%)',
  'hsl(35, 90%, 60%)',
  'hsl(15, 85%, 55%)',
  'hsl(45, 80%, 55%)',
  'hsl(5, 75%, 55%)',
  'hsl(55, 70%, 50%)',
  'hsl(350, 65%, 50%)',
  'hsl(30, 60%, 50%)',
];

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const lineData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && format(new Date(t.date), 'yyyy-MM-dd') === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      const dayIncome = transactions
        .filter(t => t.type === 'income' && format(new Date(t.date), 'yyyy-MM-dd') === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      return { date: format(day, 'dd'), expense: dayExpense, income: dayIncome };
    });
  }, [transactions]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="text-sm font-semibold mb-3 text-foreground">收支趋势</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 30%, 88%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(20, 10%, 50%)" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(20, 10%, 50%)" />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            />
            <Line type="monotone" dataKey="expense" stroke="hsl(25, 95%, 55%)" strokeWidth={2.5} dot={false} name="支出" />
            <Line type="monotone" dataKey="income" stroke="hsl(145, 60%, 45%)" strokeWidth={2.5} dot={false} name="收入" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="text-sm font-semibold mb-3 text-foreground">支出占比</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((item, i) => (
              <span key={item.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
