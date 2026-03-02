import { useState } from 'react';
import { BarChart3, Plus, List, Settings } from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useFinanceStats, TimePeriod } from '@/hooks/useFinanceStats';
import PeriodTabs from '@/components/finance/PeriodTabs';
import SummaryCards from '@/components/finance/SummaryCards';
import CategoryBar from '@/components/finance/CategoryBar';
import TransactionForm from '@/components/finance/TransactionForm';
import TransactionList from '@/components/finance/TransactionList';
import ExpenseChart from '@/components/finance/ExpenseChart';
import { Transaction } from '@/types/finance';

type Tab = 'analysis' | 'records' | 'charts' | 'settings';

const Index = () => {
  const store = useFinanceStore();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  const stats = useFinanceStats(store.transactions, period);


  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTx(null);
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

        {/* Period tabs */}
        <div className="mb-5">
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>

        {/* Summary cards */}
        <div className="mb-6">
          <SummaryCards
            totalExpense={stats.totalExpense}
            totalIncome={stats.totalIncome}
            balance={stats.balance}
            periodLabel={stats.periodLabel}
          />
        </div>

        {/* Main content area */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-fade-in">
            {/* Category breakdown */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-2 text-foreground">支出分类</h3>
              {stats.categoryBreakdown.length > 0 ? (
                stats.categoryBreakdown.map(item => (
                  <CategoryBar
                    key={item.category}
                    category={item.category}
                    amount={item.amount}
                    percentage={item.percentage}
                    maxPercentage={maxPercentage}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无数据</p>
              )}
            </div>

            {/* Inline chart */}
            <ExpenseChart transactions={stats.filteredTransactions} />
          </div>
        )}

        {activeTab === 'records' && (
          <div className="animate-fade-in">
            <TransactionList
              transactions={stats.filteredTransactions.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )}
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
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">大额支出标准</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">大额支出阈值</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">¥</span>
                    <input
                      type="number"
                      value={store.thresholds.large}
                      onChange={e => store.setThresholds({ ...store.thresholds, large: Number(e.target.value) })}
                      className="w-20 text-right bg-muted rounded-lg px-2 py-1 text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">超大额支出阈值</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">¥</span>
                    <input
                      type="number"
                      value={store.thresholds.xlarge}
                      onChange={e => store.setThresholds({ ...store.thresholds, xlarge: Number(e.target.value) })}
                      className="w-20 text-right bg-muted rounded-lg px-2 py-1 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 text-foreground">自定义分类</h3>
              <div className="space-y-2">
                {store.categories.filter(c => c.type === 'expense').map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">{c.icon} {c.name}</span>
                    <button
                      onClick={() => store.deleteCategory(c.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const name = prompt('输入新分类名称：');
                  if (name) {
                    store.addCategory({ name, type: 'expense', icon: '📌' });
                  }
                }}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                + 添加支出分类
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {tabItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5"
          >
            <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center shadow-float -mt-5">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary">记账</span>
          </button>
        </div>
      </nav>

      {/* Transaction form dialog */}
      <TransactionForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={store.addTransaction}
        onUpdate={store.updateTransaction}
        categories={store.categories}
        accounts={store.accounts}
        editingTransaction={editingTx}
      />
    </div>
  );
};

export default Index;
