import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';
import { CONFIG } from '../config';

type User = { user_email: string; user_display_name?: string; user_nicename?: string };
type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('allhat_auth_token');
    const savedUser = localStorage.getItem('allhat_user');
    if (savedToken) {
      setToken(savedToken);
      // axios インスタンスのヘッダは interceptor が参照するので localStorage に入れれば OK
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setIsAuthReady(true);
  }, []);

  const login = async (username: string, password: string) => {
    const payload = { username, password };
    const res = await apiClient.post(CONFIG.ENDPOINTS.TOKEN, payload);
    const newToken = res.data?.token;
    if (!newToken) throw new Error('トークンが返却されませんでした');
    const newUser: User = {
      user_email: res.data?.user_email,
      user_display_name: res.data?.user_display_name,
      user_nicename: res.data?.user_nicename,
    };
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem('allhat_auth_token', newToken);
      localStorage.setItem('allhat_user', JSON.stringify(newUser));
    } catch {
      // noop
    }
    return;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('allhat_auth_token');
      localStorage.removeItem('allhat_user');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}