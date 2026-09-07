import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('grow_green_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiFetch<{ user: User }>('/api/auth/me');
        if (res.ok && res.data?.user) {
          setUser(res.data.user);
        } else if (res.status === 401 || res.status === 403) {
          console.warn('[Auth Session Expired]', res.error);
          localStorage.removeItem('grow_green_token');
          setToken(null);
          setUser(null);
        } else {
          console.error('[Auth Verify Error]', res.error);
        }
      } catch (err) {
        console.error('[Auth Verification Exception]', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok || !res.data) {
        const errorMsg = res.error || 'Login failed';
        console.error('[Login Error Details]', { status: res.status, error: errorMsg, rawData: res.data });
        toast.error(errorMsg);
        return false;
      }

      localStorage.setItem('grow_green_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthModalOpen(false);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      return true;
    } catch (err: any) {
      console.error('[Login Network Error]', err);
      toast.error('Network error during login');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok || !res.data) {
        const errorMsg = res.error || 'Registration failed';
        console.error('[Register Error Details]', { status: res.status, error: errorMsg, rawData: res.data });
        toast.error(errorMsg);
        return false;
      }

      localStorage.setItem('grow_green_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthModalOpen(false);
      toast.success('Account created successfully!');
      return true;
    } catch (err: any) {
      console.error('[Register Network Error]', err);
      toast.error('Network error during registration');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('grow_green_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
