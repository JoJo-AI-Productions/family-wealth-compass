import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Transaction, Category, Account } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  categories: Category[];
  accounts: Account[];
  editingTransaction?: Transaction | null;
  onUpdate?: (id: string, tx: Partial<Transaction>) => void;
}

export default function TransactionForm({
  open, onClose, onSave, categories, accounts, editingTransaction, onUpdate
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [account, setAccount] = useState(accounts[0]?.name || '');
  const [isFixed, setIsFixed] = useState(false);

  // Reset form when dialog opens or editingTransaction changes
  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setCategory(editingTransaction.category);
        setDate(format(new Date(editingTransaction.date), 'yyyy-MM-dd'));
        setNote(editingTransaction.note || '');
        setAccount(editingTransaction.account || accounts[0]?.name || '');
        setIsFixed(editingTransaction.isFixed || false);
      } else {
        setType('expense');
        setAmount('');
        setCategory('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setNote('');
        setAccount(accounts[0]?.name || '');
        setIsFixed(false);
      }
    }
  }, [open, editingTransaction]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = () => {
    if (!amount || !category) return;
    const tx = {
      type,
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
      note,
      account,
      isFixed,
    };
    if (editingTransaction && onUpdate) {
      onUpdate(editingTransaction.id, tx);
    } else {
      onSave(tx);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">
            {editingTransaction ? '编辑记录' : '记一笔'}
          </DialogTitle>
        </DialogHeader>

        {/* Type toggle */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { setType('expense'); setCategory(''); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              type === 'expense' ? 'gradient-warm text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => { setType('income'); setCategory(''); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              type === 'income' ? 'gradient-income text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            收入
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">金额</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="text-2xl font-bold text-center h-14 rounded-xl"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">分类</Label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.name)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  category === c.name
                    ? 'gradient-warm text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent/20'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">账户</Label>
          <div className="flex flex-wrap gap-2">
            {accounts.map(a => (
              <button
                key={a.id}
                onClick={() => setAccount(a.name)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  account === a.name
                    ? 'gradient-warm text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {a.icon} {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">日期</Label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">备注</Label>
          <Input
            placeholder="添加备注..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Fixed toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFixed}
            onChange={e => setIsFixed(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-sm text-muted-foreground">固定{type === 'income' ? '收入' : '支出'}（每月自动添加）</span>
        </label>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl gradient-warm text-primary-foreground font-semibold text-base border-0 hover:opacity-90"
        >
          {editingTransaction ? '保存修改' : '确认记账'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
