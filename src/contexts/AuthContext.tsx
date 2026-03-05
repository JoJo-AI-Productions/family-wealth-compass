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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth);

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
