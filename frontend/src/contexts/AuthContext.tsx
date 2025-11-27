import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  user: Record<string, any> | null;
  isAuthReady: boolean;
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const JWT_API_URL = 'https://hitobou.com/allhat/drill/wpcms/wp-json/jwt-auth/v1/token';
const STORAGE_KEY = 'allhat_auth_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const isAuthenticated = !!token;

  // 初期化：localStorage のチェックを行い、完了後 isAuthReady を true にする
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setToken(stored);
      }
    } catch {
      // ignore
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  // token の変更を localStorage に反映（保持）
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(JWT_API_URL, { username, password });
      const receivedToken = res.data?.token ?? null;
      if (!receivedToken) throw new Error('token not returned');
      setToken(receivedToken);
      setUser(res.data.user ?? null);
    } catch (err: any) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};