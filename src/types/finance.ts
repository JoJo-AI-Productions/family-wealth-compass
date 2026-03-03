export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  note: string;
  account: string;
  isFixed: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface ExpenseThresholds {
  large: number;
  xlarge: number;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  thresholds: ExpenseThresholds;
  monthlyBudget: number; // 0 means not set
}

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense', icon: '🍜' },
  { id: 'transport', name: '交通', type: 'expense', icon: '🚗' },
  { id: 'shopping', name: '购物', type: 'expense', icon: '🛍️' },
  { id: 'entertainment', name: '娱乐', type: 'expense', icon: '🎮' },
  { id: 'daily', name: '日用', type: 'expense', icon: '🧴' },
  { id: 'utilities', name: '水电燃气', type: 'expense', icon: '💡' },
  { id: 'pet', name: '宠物', type: 'expense', icon: '🐾' },
  { id: 'education', name: '学习成长', type: 'expense', icon: '📚' },
  { id: 'medical', name: '医疗', type: 'expense', icon: '🏥' },
  { id: 'housing', name: '住房', type: 'expense', icon: '🏠' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: '工资收入', type: 'income', icon: '💰' },
  { id: 'savings', name: '定期储蓄', type: 'income', icon: '🏦' },
  { id: 'investment', name: '理财投资', type: 'income', icon: '📈' },
  { id: 'bonus', name: '奖金', type: 'income', icon: '🎁' },
  { id: 'other-income', name: '其他收入', type: 'income', icon: '💵' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'bank', name: '银行卡', icon: '💳' },
  { id: 'alipay', name: '支付宝', icon: '📱' },
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'cash', name: '现金', icon: '💵' },
];
