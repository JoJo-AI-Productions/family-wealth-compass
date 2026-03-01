interface SummaryCardsProps {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  periodLabel: string;
}

export default function SummaryCards({ totalExpense, totalIncome, balance, periodLabel }: SummaryCardsProps) {
  const cards = [
    { label: `${periodLabel}支出`, value: totalExpense, className: 'text-primary' },
    { label: `${periodLabel}收入`, value: totalIncome, className: 'text-success' },
    { label: '结余', value: balance, className: balance >= 0 ? 'text-foreground' : 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className="flex flex-col items-center rounded-2xl bg-card p-4 shadow-card animate-slide-up"
        >
          <span className="text-xs text-muted-foreground">{card.label}</span>
          <span className={`mt-1 text-2xl font-bold ${card.className}`}>
            {Math.abs(card.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
