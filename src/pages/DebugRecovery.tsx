import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const USERS_KEY = 'family-finance-users';
const AUTH_KEY = 'family-finance-auth';
const MIGRATION_DONE_KEY = 'family-finance-legacy-migrated';

type RecoveredPayload = {
  bestGuess?: {
    financeData?: unknown;
  };
  transactions?: unknown[];
};

type UserAccount = {
  accountId: string;
  password: string;
  isGuest: boolean;
};

function generateDigits(len: number): string {
  let result = '';
  for (let i = 0; i < len; i += 1) {
    result += Math.floor(Math.random() * 10).toString();
  }
  if (result[0] === '0') {
    result = (Math.floor(Math.random() * 9) + 1).toString() + result.slice(1);
  }
  return result;
}

function getStorageKey(accountId: string): string {
  return `family-finance-data-${accountId}`;
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function pickFinanceData(payload: RecoveredPayload): any | null {
  if (payload?.bestGuess?.financeData && Array.isArray((payload.bestGuess.financeData as any).transactions)) {
    return payload.bestGuess.financeData;
  }
  if (Array.isArray(payload?.transactions)) {
    return payload;
  }
  return null;
}

function loadUsers(): Record<string, UserAccount> {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return {};
  const parsed = safeJsonParse<Record<string, UserAccount>>(raw);
  return parsed || {};
}

function saveUsers(users: Record<string, UserAccount>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureGuest(log: (msg: string) => void): UserAccount {
  const users = loadUsers();
  const existing = Object.values(users).find((u) => u.isGuest);
  if (existing) {
    log(`复用游客账号: ${existing.accountId}`);
    return existing;
  }
  const guest: UserAccount = {
    accountId: generateDigits(6),
    password: generateDigits(6),
    isGuest: true,
  };
  users[guest.accountId] = guest;
  saveUsers(users);
  log(`创建游客账号: ${guest.accountId}`);
  return guest;
}

function mergeFinanceState(incoming: any, targetRaw: string | null) {
  if (!targetRaw) return incoming;
  const target = safeJsonParse<any>(targetRaw);
  if (!target || !Array.isArray(target.transactions)) return incoming;
  const incomingTx = Array.isArray(incoming.transactions) ? incoming.transactions : [];
  const existingIds = new Set(target.transactions.map((t: any) => t.id));
  const newTx = incomingTx.filter((t: any) => t?.id && !existingIds.has(t.id));
  return {
    ...incoming,
    transactions: [...newTx, ...target.transactions],
  };
}

const DebugRecovery = () => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const appendLog = (msg: string) => {
    const finalMsg = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log('[recovery]', finalMsg);
    setLogs((prev) => [finalMsg, ...prev]);
  };

  const sample = useMemo(
    () => '{\n  "bestGuess": {\n    "financeData": {\n      "transactions": []\n    }\n  }\n}',
    [],
  );

  const handleApply = () => {
    appendLog('开始恢复流程。');
    const parsed = safeJsonParse<RecoveredPayload>(input);
    if (!parsed) {
      appendLog('输入 JSON 解析失败，请检查格式。');
      return;
    }

    const financeData = pickFinanceData(parsed);
    if (!financeData) {
      appendLog('未找到可用数据：需要 financeState 或 bestGuess.financeData。');
      return;
    }

    const guest = ensureGuest(appendLog);
    const guestKey = getStorageKey(guest.accountId);
    const existing = localStorage.getItem(guestKey);
    const merged = mergeFinanceState(financeData, existing);

    localStorage.setItem(guestKey, JSON.stringify(merged));
    localStorage.removeItem(MIGRATION_DONE_KEY);
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ currentUser: guest, isLoggedIn: false }),
    );

    const txCount = Array.isArray(merged?.transactions) ? merged.transactions.length : 0;
    appendLog(`已写入游客账本: key=${guestKey}`);
    appendLog(`交易条数: ${txCount}`);
    appendLog('已将当前会话切换为游客账号。刷新后可直接查看数据。');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">调试恢复：迁移到游客默认数据</h1>
        <p className="text-sm text-muted-foreground">
          把导出的 JSON（整份报告或 financeState）粘贴到下方，点击恢复后会写入游客账号并输出调试日志。
        </p>

        <Card className="p-4 space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sample}
            className="w-full min-h-64 rounded-md border bg-muted/30 p-3 text-sm font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={handleApply}>写入游客默认数据</Button>
            <Button variant="secondary" onClick={() => setInput(sample)}>填充示例</Button>
            <Button variant="outline" onClick={() => navigate('/')}>返回首页</Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">调试日志</h2>
          <div className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 space-y-2">
            {logs.length === 0 && <p className="text-sm text-muted-foreground">暂无日志。</p>}
            {logs.map((line, idx) => (
              <p key={`${line}-${idx}`} className="text-xs font-mono break-all">{line}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DebugRecovery;
