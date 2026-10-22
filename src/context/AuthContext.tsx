import { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../store/authStore';
import { authApi, setToken, clearToken } from '../services/api';
import { login as mockLogin, logout as mockLogout, getStoredUser } from '../store/authStore';

const USE_API = import.meta.env.VITE_USE_API === 'true';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: true; user: User } | { success: false; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback(async (username: string, password: string) => {
    if (USE_API) {
      try {
        const data = await authApi.login(username, password);
        setToken(data.token);
        sessionStorage.setItem('cb_auth_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true as const, user: data.user };
      } catch (err) {
        return { success: false as const, message: (err as Error).message };
      }
    }
    // Fallback mock
    const result = mockLogin(username, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    if (USE_API) {
      authApi.logout().catch(() => {});
      clearToken();
    } else {
      mockLogout();
    }
    sessionStorage.removeItem('cb_auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};
