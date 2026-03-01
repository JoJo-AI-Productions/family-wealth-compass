import { Transaction } from '@/types/finance';

// Generate mock data for the current month
export function generateMockData(): Omit<Transaction, 'id' | 'createdAt'>[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const mockTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [
    // Income
    { type: 'income', amount: 8950, category: '工资收入', date: new Date(year, month, 5).toISOString(), note: '3月工资', account: '银行卡', isFixed: true },
    { type: 'income', amount: 200, category: '理财投资', date: new Date(year, month, 10).toISOString(), note: '基金收益', account: '支付宝', isFixed: false },
    // Expenses
    { type: 'expense', amount: 45, category: '餐饮', date: new Date(year, month, 1).toISOString(), note: '午餐外卖', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 120, category: '餐饮', date: new Date(year, month, 3).toISOString(), note: '朋友聚餐', account: '微信', isFixed: false },
    { type: 'expense', amount: 280, category: '餐饮', date: new Date(year, month, 7).toISOString(), note: '家庭聚餐', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 85, category: '餐饮', date: new Date(year, month, 12).toISOString(), note: '超市买菜', account: '微信', isFixed: false },
    { type: 'expense', amount: 490, category: '餐饮', date: new Date(year, month, 18).toISOString(), note: '餐厅消费', account: '银行卡', isFixed: false },
    { type: 'expense', amount: 35, category: '交通', date: new Date(year, month, 2).toISOString(), note: '地铁充值', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 180, category: '交通', date: new Date(year, month, 8).toISOString(), note: '加油', account: '银行卡', isFixed: false },
    { type: 'expense', amount: 355, category: '交通', date: new Date(year, month, 15).toISOString(), note: '高铁票', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 299, category: '购物', date: new Date(year, month, 6).toISOString(), note: '衣服', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 260, category: '购物', date: new Date(year, month, 14).toISOString(), note: '日用品', account: '微信', isFixed: false },
    { type: 'expense', amount: 150, category: '娱乐', date: new Date(year, month, 9).toISOString(), note: '电影+小吃', account: '微信', isFixed: false },
    { type: 'expense', amount: 410, category: '娱乐', date: new Date(year, month, 20).toISOString(), note: '游戏充值', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 88, category: '日用', date: new Date(year, month, 4).toISOString(), note: '洗发水沐浴露', account: '微信', isFixed: false },
    { type: 'expense', amount: 200, category: '水电燃气', date: new Date(year, month, 1).toISOString(), note: '本月水电', account: '银行卡', isFixed: true },
    { type: 'expense', amount: 150, category: '宠物', date: new Date(year, month, 11).toISOString(), note: '猫粮', account: '支付宝', isFixed: false },
    { type: 'expense', amount: 1500, category: '住房', date: new Date(year, month, 1).toISOString(), note: '房租', account: '银行卡', isFixed: true },
  ];

  return mockTransactions;
}
