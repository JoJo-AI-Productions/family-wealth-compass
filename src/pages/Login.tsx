import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type Mode = 'login' | 'register';

function getStorageKey(accountId: string): string {
  return `family-finance-data-${accountId}`;
}

function guestHasData(guestId: string): boolean {
  try {
    const raw = localStorage.getItem(getStorageKey(guestId));
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.transactions && data.transactions.length > 0;
  } catch { return false; }
}

function importGuestDataToAccount(guestId: string, targetId: string) {
  try {
    const guestRaw = localStorage.getItem(getStorageKey(guestId));
    if (!guestRaw) return;
    const guestData = JSON.parse(guestRaw);
    const targetRaw = localStorage.getItem(getStorageKey(targetId));
    if (targetRaw) {
      // Merge: prepend guest transactions to target
      const targetData = JSON.parse(targetRaw);
      const existingIds = new Set(targetData.transactions.map((t: any) => t.id));
      const newTxs = guestData.transactions.filter((t: any) => !existingIds.has(t.id));
      targetData.transactions = [...newTxs, ...targetData.transactions];
      localStorage.setItem(getStorageKey(targetId), JSON.stringify(targetData));
    } else {
      // No existing data, just copy
      localStorage.setItem(getStorageKey(targetId), guestRaw);
    }
  } catch (e) {
    console.warn('Failed to import guest data:', e);
  }
}

const Login = () => {
  const { login, register, currentUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingGuestId, setPendingGuestId] = useState('');

  const completeLogin = (importData: boolean) => {
    if (importData && pendingGuestId) {
      importGuestDataToAccount(pendingGuestId, accountId);
    }
    setShowImportDialog(false);
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const guestId = currentUser?.isGuest ? currentUser.accountId : '';
    const hasGuestData = guestId ? guestHasData(guestId) : false;

    if (mode === 'login') {
      if (!accountId || !password) { setError('请输入账号和密码'); return; }
      const result = login(accountId, password);
      if (!result.success) { setError(result.error || '登录失败'); return; }
      if (hasGuestData) {
        setPendingGuestId(guestId);
        setShowImportDialog(true);
      } else {
        navigate('/');
      }
    } else {
      if (accountId.length !== 8) { setError('账号必须为8位数字'); return; }
      if (password.length !== 6) { setError('密码必须为6位数字'); return; }
      if (!/^\d+$/.test(accountId) || !/^\d+$/.test(password)) { setError('账号和密码必须为纯数字'); return; }
      const result = register(accountId, password);
      if (!result.success) { setError(result.error || '注册失败'); return; }
      if (hasGuestData) {
        setPendingGuestId(guestId);
        setShowImportDialog(true);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="max-w-lg mx-auto px-4 w-full flex-1 flex flex-col">
        <header className="flex items-center pt-6 pb-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-card/60 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground ml-2">
            {mode === 'login' ? '登录' : '注册'}
          </h1>
        </header>

        <div className="flex-1 flex items-start justify-center pt-12">
          <div className="w-full rounded-2xl bg-card/90 backdrop-blur-sm p-6 shadow-card">
            {/* Mode tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === 'login' ? 'gradient-warm text-primary-foreground shadow-float' : 'bg-muted text-muted-foreground'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === 'register' ? 'gradient-warm text-primary-foreground shadow-float' : 'bg-muted text-muted-foreground'
                }`}
              >
                注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  账号（{mode === 'register' ? '8位数字' : '6或8位数字'}）
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={mode === 'register' ? 8 : 8}
                  value={accountId}
                  onChange={e => setAccountId(e.target.value.replace(/\D/g, ''))}
                  placeholder={mode === 'register' ? '请输入8位数字账号' : '请输入账号'}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">密码（6位数字）</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入6位数字密码"
                  className="w-full bg-muted rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full rounded-xl h-11 text-base font-semibold gradient-warm text-primary-foreground shadow-float">
                {mode === 'login' ? '登录' : '注册'}
              </Button>
            </form>

            {mode === 'register' && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                注册账号为8位数字，密码为6位数字，与游客账号（6位）区分
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Import guest data dialog */}
      <AlertDialog open={showImportDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>导入游客账本</AlertDialogTitle>
            <AlertDialogDescription>
              检测到您在游客模式下有记账数据，是否将这些数据导入到当前账号？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel onClick={() => completeLogin(false)} className="flex-1 mt-0">
              不导入
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => completeLogin(true)} className="flex-1 gradient-warm text-primary-foreground">
              导入数据
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
