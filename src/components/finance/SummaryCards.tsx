import { useNavigate } from 'react-router-dom';

interface SummaryCardsProps {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  periodLabel: string;
}

export default function SummaryCards({ totalExpense, totalIncome, balance, periodLabel }: SummaryCardsProps) {
  const navigate = useNavigate();

  const cards = [
    { label: `${periodLabel}支出`, value: totalExpense, className: 'text-success', clickable: true, type: 'expense' as const },
    { label: `${periodLabel}收入`, value: totalIncome, className: 'text-primary', clickable: true, type: 'income' as const },
    { label: '结余', value: balance, className: balance >= 0 ? 'text-foreground' : 'text-destructive', clickable: false, type: null },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          onClick={() => card.clickable && navigate(`/year-detail?type=${card.type}`)}
          className={`flex flex-col items-center rounded-2xl bg-card p-4 shadow-card animate-slide-up ${
            card.clickable ? 'cursor-pointer active:scale-95 transition-transform' : ''
          }`}
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
