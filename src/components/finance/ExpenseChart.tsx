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

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, name, percent
}: any) => {
  const radius = outerRadius + 8;
  const x1 = cx + radius * Math.cos(-midAngle * RADIAN);
  const y1 = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const lineEnd = outerRadius + 30;
  const x2 = cx + lineEnd * Math.cos(-midAngle * RADIAN);
  const y2 = cy + lineEnd * Math.sin(-midAngle * RADIAN);
  
  const textAnchor = x2 > cx ? 'start' : 'end';
  const x3 = x2 + (x2 > cx ? 8 : -8);

  const labelText = `${name}(${(percent * 100).toFixed(0)}%)`;
  
  // Split into two lines if text is long
  const maxChars = 8;
  let lines: string[] = [];
  if (labelText.length > maxChars) {
    lines = [name, `(${(percent * 100).toFixed(0)}%)`];
  } else {
    lines = [labelText];
  }

  return (
    <g>
      <circle cx={x1} cy={y1} r={2.5} fill="hsl(var(--foreground))" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x3}
          y={y2 + i * 14}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={11}
          fill="hsl(var(--foreground))"
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

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
      return { date: format(day, 'M/dd'), expense: dayExpense, income: dayIncome };
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
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(20, 10%, 50%)" label={{ value: '日期', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(20, 10%, 50%)" label={{ value: '金额(¥)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
