import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginCredentials, RegisterCredentials } from '../types';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── initialise from localStorage on mount ─────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  /* ── listen for events fired by the axios interceptor ──────────────── */
  useEffect(() => {
    // Interceptor silently refreshed the token — keep state in sync
    const handleRefresh = (e: Event) => {
      const { user: refreshedUser } = (e as CustomEvent<{ token: string; user: AuthUser }>).detail;
      setUser(refreshedUser);
    };

    // Interceptor gave up (refresh failed) — force logout state
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:refresh', handleRefresh);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:refresh', handleRefresh);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  /* ── auth actions ───────────────────────────────────────────────────── */
  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    localStorage.setItem('token', result!.token);
    localStorage.setItem('user', JSON.stringify(result!.user));
    setUser(result!.user);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const result = await authService.register(credentials);
    localStorage.setItem('token', result!.token);
    localStorage.setItem('user', JSON.stringify(result!.user));
    setUser(result!.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server-side errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
