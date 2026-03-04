import { useState } from 'react';
import { BarChart3, Plus, List, Settings } from 'lucide-react';
import { useFinanceStore } from '@/contexts/FinanceContext';
import { useFinanceStats, TimePeriod } from '@/hooks/useFinanceStats';
import PeriodTabs from '@/components/finance/PeriodTabs';
import SummaryCards from '@/components/finance/SummaryCards';
import CategoryBar from '@/components/finance/CategoryBar';
import TransactionForm from '@/components/finance/TransactionForm';
import TransactionList from '@/components/finance/TransactionList';
import ExpenseChart from '@/components/finance/ExpenseChart';
import SortableList from '@/components/finance/SortableList';
import { Transaction, Category, Account } from '@/types/finance';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Tab = 'analysis' | 'records' | 'charts' | 'settings';

const Index = () => {
  const store = useFinanceStore();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'account'; id: string; name: string } | null>(null);

  // Budget dialog state
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const stats = useFinanceStats(store.transactions, period);

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTx(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') store.deleteCategory(deleteTarget.id);
    else store.deleteAccount(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openBudgetDialog = () => {
    setBudgetInput(store.monthlyBudget > 0 ? String(store.monthlyBudget) : '');
    setShowBudgetDialog(true);
  };

  const confirmBudget = () => {
    store.setMonthlyBudget(Number(budgetInput) || 0);
    setShowBudgetDialog(false);
  };

  const maxPercentage = stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown[0].percentage : 100;

  const tabItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analysis', label: '看分析', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'records', label: '明细', icon: <List className="w-4 h-4" /> },
    { id: 'charts', label: '图表', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between pt-6 pb-4">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'analysis'
                ? 'gradient-warm text-primary-foreground shadow-float'
                : 'bg-card/60 text-foreground backdrop-blur-sm'
            }`}
          >
            看分析
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-card/80 text-foreground backdrop-blur-sm shadow-card hover:bg-card transition-all"
          >
            记一笔
          </button>
        </header>

        <div className="mb-5">
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>

        <div className="mb-6">
          <SummaryCards
            totalExpense={stats.totalExpense}
            totalIncome={stats.totalIncome}
            balance={stats.balance}
            periodLabel={stats.periodLabel}
          />
        </div>

        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-2 text-foreground">支出分类</h3>
              {stats.categoryBreakdown.length > 0 ? (
                stats.categoryBreakdown.map(item => (
                  <CategoryBar key={item.category} category={item.category} amount={item.amount} percentage={item.percentage} maxPercentage={maxPercentage} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无数据</p>
              )}
            </div>
            <ExpenseChart transactions={stats.filteredTransactions} />
          </div>
        )}

        {activeTab === 'records' && (
          <div className="animate-fade-in">
            <TransactionList
              transactions={stats.filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              onEdit={handleEdit}
              onDelete={store.deleteTransaction}
              getExpenseTag={store.getExpenseTag}
            />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="animate-fade-in">
            <ExpenseChart transactions={stats.filteredTransactions} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            {/* Monthly budget */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">每月预算</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">月预算金额</span>
                <div
                  onClick={openBudgetDialog}
                  className="flex items-center gap-1 cursor-pointer bg-muted rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
                >
                  <span className="text-sm text-muted-foreground">¥</span>
                  <span className="text-sm font-medium min-w-[4rem] text-right">
                    {store.monthlyBudget > 0 ? store.monthlyBudget : '未设置'}
                  </span>
                </div>
              </div>
              {store.monthlyBudget > 0 && (
                <button onClick={() => store.setMonthlyBudget(0)} className="mt-2 text-xs text-destructive hover:underline">
                  清除预算
                </button>
              )}
            </div>

            {/* Thresholds */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">大额支出标准</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">大额支出阈值</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">¥</span>
                    <input type="number" value={store.thresholds.large} onChange={e => store.setThresholds({ ...store.thresholds, large: Number(e.target.value) })} className="w-20 text-right bg-muted rounded-lg px-2 py-1 text-sm font-medium" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">超大额支出阈值</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">¥</span>
                    <input type="number" value={store.thresholds.xlarge} onChange={e => store.setThresholds({ ...store.thresholds, xlarge: Number(e.target.value) })} className="w-20 text-right bg-muted rounded-lg px-2 py-1 text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* Expense categories */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">支出分类管理</h3>
              <SortableList
                items={store.categories.filter(c => c.type === 'expense')}
                onReorder={(reordered) => {
                  const incomeCategories = store.categories.filter(c => c.type === 'income');
                  store.reorderCategories([...reordered, ...incomeCategories]);
                }}
                renderItem={(c) => <span className="text-sm">{c.icon} {c.name}</span>}
                renderActions={(c) => (
                  <button
                    onClick={() => setDeleteTarget({ type: 'category', id: c.id, name: c.name })}
                    className="text-xs text-destructive hover:underline shrink-0 px-2 py-1"
                  >
                    删除
                  </button>
                )}
              />
              <button
                onClick={() => {
                  const name = prompt('输入新分类名称：');
                  if (name) {
                    const ICONS = ['🍜','🚗','🛍️','🎮','🧴','💡','🐾','📚','🏥','🏠','🎵','✈️','👶','🎂','💻','🏋️','☕','🎬','📱','🧹'];
                    const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
                    const icon = prompt(`选择图标（默认${randomIcon}）：`) || randomIcon;
                    store.addCategory({ name, type: 'expense', icon });
                  }
                }}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                + 添加支出分类
              </button>
            </div>

            {/* Account management */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">账户分类管理</h3>
              <SortableList
                items={store.accounts}
                onReorder={(reordered) => store.reorderAccounts(reordered)}
                renderItem={(a) => <span className="text-sm">{a.icon} {a.name}</span>}
                renderActions={(a) => (
                  <button
                    onClick={() => setDeleteTarget({ type: 'account', id: a.id, name: a.name })}
                    className="text-xs text-destructive hover:underline shrink-0 px-2 py-1"
                  >
                    删除
                  </button>
                )}
              />
              <button
                onClick={() => {
                  const name = prompt('输入新账户名称（如：信用卡）：');
                  if (name) {
                    const icon = prompt('输入账户图标（如：💳）：') || '💳';
                    store.addAccount({ name, icon });
                  }
                }}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                + 添加账户
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {tabItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setShowForm(true)} className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center shadow-float -mt-5">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary">记账</span>
          </button>
        </div>
      </nav>

      {/* Transaction form dialog */}
      <TransactionForm open={showForm} onClose={handleCloseForm} onSave={store.addTransaction} onUpdate={store.updateTransaction} categories={store.categories} accounts={store.accounts} editingTransaction={editingTx} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{deleteTarget?.type === 'category' ? '分类' : '账户'} "{deleteTarget?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Budget edit dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>设置每月预算</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 py-4">
            <span className="text-lg text-muted-foreground">¥</span>
            <input
              type="number"
              autoFocus
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              placeholder="输入预算金额"
              className="flex-1 bg-muted rounded-lg px-3 py-2 text-base font-medium outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>取消</Button>
            <Button onClick={confirmBudget}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
