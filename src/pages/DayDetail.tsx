import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceStore } from '@/contexts/FinanceContext';
import { Transaction } from '@/types/finance';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import TransactionForm from '@/components/finance/TransactionForm';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Renders the day content (summary + transaction list) for a given date */
function DayContent({
  date, store, onEdit, onDelete,
}: {
  date: Date;
  store: ReturnType<typeof useFinanceStore>;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const txs = useMemo(() =>
    store.transactions
      .filter(t => isSameDay(new Date(t.date), date))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [store.transactions, date]
  );

  const stats = useMemo(() => {
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [txs]);

  return (
    <div className="px-4 pb-8">
      {/* Day summary */}
      <div className="rounded-2xl bg-card p-5 shadow-card mb-6">
        <h3 className="text-center text-sm font-semibold text-muted-foreground mb-3">当日收支</h3>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span className="text-xs text-muted-foreground">支出</span>
            <div>
              <span className="text-2xl font-bold text-success">{stats.expense.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-0.5">元</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground">收入</span>
            <div>
              <span className="text-2xl font-bold text-primary">{stats.income.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-0.5">元</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/15 text-primary">
            结余: {stats.balance >= 0 ? '+' : ''}{stats.balance.toLocaleString()}元
          </span>
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">记账明细</h3>
        {txs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">暂无记录</p>
            <p className="text-sm mt-1">点击右上角 "+" 开始记账</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => {
              const tag = tx.type === 'expense' ? store.getExpenseTag(tx.amount) : 'normal';
              return (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <span className="text-lg">
                    {store.categories.find(c => c.name === tx.category)?.icon || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{tx.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        tx.type === 'expense' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                      }`}>
                        {tx.type === 'expense' ? '支出' : '收入'}
                      </span>
                      {tag === 'large' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground">大额</span>
                      )}
                      {tag === 'xlarge' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">超大额</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tx.account}</span>
                      {tx.note && <span className="text-xs text-muted-foreground truncate">· {tx.note}</span>}
                      {tx.isFixed && <span className="text-[10px] px-1 py-0.5 rounded bg-secondary text-secondary-foreground">固定</span>}
                    </div>
                  </div>
                  <span className={`font-bold text-base ${tx.type === 'income' ? 'text-primary' : 'text-success'}`}>
                    {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                  </span>
                  <div className="flex flex-col gap-1 shrink-0">
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
        )}
      </div>
    </div>
  );
}

export default function DayDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const [currentDate, setCurrentDate] = useState(new Date(dateStr));

  const store = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ViewPager swipe state
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isSettled, setIsSettled] = useState(true);
  const directionLocked = useRef<'h' | 'v' | null>(null);

  const prevDate = useMemo(() => subDays(currentDate, 1), [currentDate]);
  const nextDate = useMemo(() => addDays(currentDate, 1), [currentDate]);

  const navigateToDate = useCallback((date: Date) => {
    setSearchParams({ date: format(date, 'yyyy-MM-dd') }, { replace: true });
    setCurrentDate(date);
  }, [setSearchParams]);

  const goToPrevDay = useCallback(() => navigateToDate(subDays(currentDate, 1)), [currentDate, navigateToDate]);
  const goToNextDay = useCallback(() => navigateToDate(addDays(currentDate, 1)), [currentDate, navigateToDate]);

  // Settle animation: slide to target then update date
  const settleToDate = useCallback((targetDate: Date, direction: 'left' | 'right') => {
    const width = containerRef.current?.offsetWidth || 375;
    setIsSettled(false);
    setOffsetX(direction === 'left' ? -width : width);
    setTimeout(() => {
      navigateToDate(targetDate);
      setOffsetX(0);
      setIsSettled(true);
      setIsSwiping(false);
    }, 250);
  }, [navigateToDate]);

  const snapBack = useCallback(() => {
    setIsSettled(false);
    setOffsetX(0);
    setTimeout(() => {
      setIsSettled(true);
      setIsSwiping(false);
    }, 250);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isSettled) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    directionLocked.current = null;
    setIsSwiping(false);
  }, [isSettled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isSettled) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    // Lock direction after 10px movement
    if (!directionLocked.current) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      return;
    }

    if (directionLocked.current === 'v') return;

    setIsSwiping(true);
    setOffsetX(dx);
  }, [isSettled]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !isSettled) return;
    const width = containerRef.current?.offsetWidth || 375;
    const velocity = touchStartRef.current.time
      ? Math.abs(offsetX) / (Date.now() - touchStartRef.current.time)
      : 0;

    touchStartRef.current = null;

    // Threshold: 30% of width OR fast velocity
    const threshold = width * 0.3;
    if (offsetX > threshold || (offsetX > 40 && velocity > 0.3)) {
      settleToDate(prevDate, 'right');
    } else if (offsetX < -threshold || (offsetX < -40 && velocity > 0.3)) {
      settleToDate(nextDate, 'left');
    } else {
      snapBack();
    }
  }, [isSettled, offsetX, prevDate, nextDate, settleToDate, snapBack]);

  const handleEdit = (tx: Transaction) => { setEditingTx(tx); setShowForm(true); };
  const handleConfirmDelete = () => { if (deleteTargetId) { store.deleteTransaction(deleteTargetId); setDeleteTargetId(null); } };
  const handleCloseForm = () => { setShowForm(false); setEditingTx(null); };

  const transition = !isSettled ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : isSwiping ? 'none' : undefined;

  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      <div className="max-w-lg mx-auto">
        {/* Header - fixed, not swipeable */}
        <header className="flex items-center justify-between pt-6 pb-4 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={goToPrevDay} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {format(currentDate, 'yyyy年M月d日')}
            </h1>
            <button onClick={goToNextDay} className="p-1 text-muted-foreground hover:text-foreground transition-colors rotate-180">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="p-2 -mr-2 text-primary-foreground">
            <Plus className="w-6 h-6" />
          </button>
        </header>

        {/* ViewPager area - entire area below header is swipeable */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ minHeight: 'calc(100vh - 80px)', touchAction: isSwiping ? 'none' : 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex"
            style={{
              width: '300%',
              transform: `translateX(calc(-33.333% + ${offsetX}px))`,
              transition,
            }}
          >
            {/* Previous day */}
            <div className="w-1/3 flex-shrink-0">
              <DayContent date={prevDate} store={store} onEdit={handleEdit} onDelete={setDeleteTargetId} />
            </div>
            {/* Current day */}
            <div className="w-1/3 flex-shrink-0">
              <DayContent date={currentDate} store={store} onEdit={handleEdit} onDelete={setDeleteTargetId} />
            </div>
            {/* Next day */}
            <div className="w-1/3 flex-shrink-0">
              <DayContent date={nextDate} store={store} onEdit={handleEdit} onDelete={setDeleteTargetId} />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction form */}
      <TransactionForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={store.addTransaction}
        onUpdate={store.updateTransaction}
        categories={store.categories}
        accounts={store.accounts}
        editingTransaction={editingTx}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这条记录吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
