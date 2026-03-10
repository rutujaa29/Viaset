import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { api } from '../api/client';

export type Role = 'ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface Company {
  id: string;
  name: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus?: string;
  searchesUsedThisMonth?: number;
  searchLimitMonth?: number | null;
  resetUsageOn?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  companyId: string | null;
  company?: Company | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{
        id: string;
        email: string;
        name: string | null;
        role: Role;
        companyId: string | null;
        company: Company | null;
      }>('/auth/me');
      setUser(data as User);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: User }>('/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name?: string; companyName: string }) => {
      const res = await api.post<{ user: User }>('/auth/register', data);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
