interface CategoryBarProps {
  category: string;
  amount: number;
  percentage: number;
  maxPercentage: number;
}

export default function CategoryBar({ category, amount, percentage, maxPercentage }: CategoryBarProps) {
  const width = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="w-16 text-sm font-medium text-foreground shrink-0">{category}</span>
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full gradient-bar transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-foreground w-14 text-right">{amount.toLocaleString()}</span>
      <span className="text-sm text-muted-foreground w-12 text-right">{percentage}%</span>
    </div>
  );
}
