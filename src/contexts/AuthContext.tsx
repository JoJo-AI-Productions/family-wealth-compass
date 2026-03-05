import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const AUTH_KEY = 'family-finance-auth';
const USERS_KEY = 'family-finance-users';
const LEGACY_DATA_KEY = 'family-finance-data';
const MIGRATION_DONE_KEY = 'family-finance-legacy-migrated';

export interface UserAccount {
  accountId: string;
  password: string;
  isGuest: boolean;
}

interface AuthState {
  currentUser: UserAccount | null;
  isLoggedIn: boolean;
}

interface AuthContextValue extends AuthState {
  login: (accountId: string, password: string) => { success: boolean; error?: string };
  register: (accountId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  ensureGuest: () => void;
}

function generateDigits(len: number): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  // Ensure first digit is not 0
  if (result[0] === '0') result = (Math.floor(Math.random() * 9) + 1).toString() + result.slice(1);
  return result;
}

function loadUsers(): Record<string, UserAccount> {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveUsers(users: Record<string, UserAccount>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadAuth(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { currentUser: null, isLoggedIn: false };
}

function saveAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

function migrateLegacyData(authState: AuthState) {
  if (localStorage.getItem(MIGRATION_DONE_KEY)) return;
  const legacyRaw = localStorage.getItem(LEGACY_DATA_KEY);
  if (!legacyRaw) {
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
    return;
  }
  try {
    const legacyData = JSON.parse(legacyRaw);
    if (!legacyData.transactions || legacyData.transactions.length === 0) {
      localStorage.setItem(MIGRATION_DONE_KEY, '1');
      return;
    }
    // Find or create a guest account to hold legacy data
    const users = loadUsers();
    let guest = Object.values(users).find(u => u.isGuest);
    if (!guest) {
      const guestId = generateDigits(6);
      const guestPwd = generateDigits(6);
      guest = { accountId: guestId, password: guestPwd, isGuest: true };
      users[guestId] = guest;
      saveUsers(users);
    }
    // Copy legacy data to guest's namespaced key
    const guestKey = `family-finance-data-${guest.accountId}`;
    const existingRaw = localStorage.getItem(guestKey);
    if (!existingRaw) {
      localStorage.setItem(guestKey, legacyRaw);
    } else {
      // Merge: add legacy transactions that don't exist yet
      const existing = JSON.parse(existingRaw);
      const ids = new Set(existing.transactions.map((t: any) => t.id));
      const newTxs = legacyData.transactions.filter((t: any) => !ids.has(t.id));
      existing.transactions = [...newTxs, ...existing.transactions];
      localStorage.setItem(guestKey, JSON.stringify(existing));
    }
    // If no current user, set to this guest
    if (!authState.currentUser) {
      authState.currentUser = guest;
      authState.isLoggedIn = false;
      saveAuth(authState);
    }
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
  } catch (e) {
    console.warn('Legacy data migration failed:', e);
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const initial = loadAuth();
    // Migrate legacy data for old users on first load
    migrateLegacyData(initial);
    return initial;
  });

  const persist = useCallback((newState: AuthState) => {
    setState(newState);
    saveAuth(newState);
  }, []);

  const ensureGuest = useCallback(() => {
    if (state.currentUser) return;
    const users = loadUsers();
    // Check if there's already a guest
    const existingGuest = Object.values(users).find(u => u.isGuest);
    if (existingGuest) {
      persist({ currentUser: existingGuest, isLoggedIn: false });
      return;
    }
    const accountId = generateDigits(6);
    const password = generateDigits(6);
    const guest: UserAccount = { accountId, password, isGuest: true };
    users[accountId] = guest;
    saveUsers(users);
    persist({ currentUser: guest, isLoggedIn: false });
  }, [state.currentUser, persist]);

  const login = useCallback((accountId: string, password: string) => {
    const users = loadUsers();
    const user = users[accountId];
    if (!user) return { success: false, error: '账号不存在' };
    if (user.password !== password) return { success: false, error: '密码错误' };
    persist({ currentUser: user, isLoggedIn: true });
    return { success: true };
  }, [persist]);

  const register = useCallback((accountId: string, password: string) => {
    if (accountId.length !== 8) return { success: false, error: '账号必须为8位数字' };
    if (password.length !== 6) return { success: false, error: '密码必须为6位数字' };
    if (!/^\d+$/.test(accountId)) return { success: false, error: '账号必须为纯数字' };
    if (!/^\d+$/.test(password)) return { success: false, error: '密码必须为纯数字' };
    const users = loadUsers();
    if (users[accountId]) return { success: false, error: '账号已存在' };
    const user: UserAccount = { accountId, password, isGuest: false };
    users[accountId] = user;
    saveUsers(users);
    persist({ currentUser: user, isLoggedIn: true });
    return { success: true };
  }, [persist]);

  const logout = useCallback(() => {
    // Reset to guest state
    const users = loadUsers();
    const existingGuest = Object.values(users).find(u => u.isGuest);
    if (existingGuest) {
      persist({ currentUser: existingGuest, isLoggedIn: false });
    } else {
      const accountId = generateDigits(6);
      const password = generateDigits(6);
      const guest: UserAccount = { accountId, password, isGuest: true };
      users[accountId] = guest;
      saveUsers(users);
      persist({ currentUser: guest, isLoggedIn: false });
    }
  }, [persist]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, ensureGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
