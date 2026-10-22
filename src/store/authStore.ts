import { useState, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  balance: number;       // VND
  balanceUsdt: number;   // USDT
  avatar: string;
}

// Mock users
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'u1',
    username: 'demo',
    password: 'demo123',
    fullName: 'Nguyễn Văn Demo',
    email: 'demo@checkbank.vn',
    balance: 12_500_000,
    balanceUsdt: 487.25,
    avatar: 'ND',
  },
  {
    id: 'u2',
    username: 'admin',
    password: 'admin123',
    fullName: 'Admin CheckBank',
    email: 'admin@checkbank.vn',
    balance: 99_000_000,
    balanceUsdt: 3_850.00,
    avatar: 'AD',
  },
];

const AUTH_KEY = 'cb_auth_user';

export const getStoredUser = (): User | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const login = (
  username: string,
  password: string,
): { success: true; user: User } | { success: false; message: string } => {
  const found = MOCK_USERS.find(
    (u) => u.username === username && u.password === password,
  );
  if (!found) {
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  }
  const { password: _pw, ...user } = found;
  void _pw;
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const logout = () => {
  sessionStorage.removeItem(AUTH_KEY);
};

// Simple hook — no external state lib needed
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const handleLogin = useCallback(
    (username: string, password: string) => {
      const result = login(username, password);
      if (result.success) setUser(result.user);
      return result;
    },
    [],
  );

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return { user, login: handleLogin, logout: handleLogout };
};
