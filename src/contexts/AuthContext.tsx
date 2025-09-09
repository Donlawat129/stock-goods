// src/contexts/AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { requestSheetsToken } from "../lib/sheetsClient";

interface AuthContextType {
  token: string | null;
  user: { uid: string; email: string } | null;
  login: (user: { uid: string; email: string }) => void;
  logout: () => void;
  requestToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);

  const login = (userData: { uid: string; email: string }) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const requestToken = async () => {
    const t = await requestSheetsToken();
    setToken(t);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, requestToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
