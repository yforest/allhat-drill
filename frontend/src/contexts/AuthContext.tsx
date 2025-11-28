import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = any;

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("allhat_auth_token");
    setToken(t);
    if (t) {
      // 既存で保存している user 情報があれば読み込む（任意）
      try {
        const u = localStorage.getItem("allhat_auth_user");
        if (u) setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // login は WP のログインページへ遷移させる（React 側で認証処理は行わない）
  const login = () => {
    const WP_LOGIN_URL = "https://hitobou.com/allhat/drill/wpcms/wp-login.php";
    window.location.href = WP_LOGIN_URL;
  };

  // logout は WP のログアウト URL へ遷移させ、localStorage の token/user を削除
  const logout = () => {
    localStorage.removeItem("allhat_auth_token");
    localStorage.removeItem("allhat_auth_user");
    const WP_LOGOUT_URL = "https://hitobou.com/allhat/drill/wpcms/wp-login.php?action=logout";
    window.location.href = WP_LOGOUT_URL;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);