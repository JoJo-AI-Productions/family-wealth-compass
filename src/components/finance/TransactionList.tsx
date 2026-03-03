import { format } from 'date-fns';
import { Transaction } from '@/types/finance';
import { Pencil, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  getExpenseTag: (amount: number) => 'normal' | 'large' | 'xlarge';
}

export default function TransactionList({ transactions, onEdit, onDelete, getExpenseTag }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">暂无记录</p>
        <p className="text-sm mt-1">点击"记一笔"开始记账</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map(tx => {
        const tag = tx.type === 'expense' ? getExpenseTag(tx.amount) : 'normal';
        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card animate-fade-in"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{tx.category}</span>
                {tag === 'large' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground">大额</span>
                )}
                {tag === 'xlarge' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">超大额</span>
                )}
                {tx.isFixed && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">固定</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MM/dd')}</span>
                <span className="text-xs text-muted-foreground">{tx.account}</span>
                {tx.note && <span className="text-xs text-muted-foreground truncate">· {tx.note}</span>}
              </div>
            </div>
            <span className={`font-bold text-base ${tx.type === 'income' ? 'text-primary' : 'text-success'}`}>
              {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
            </span>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(tx)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
