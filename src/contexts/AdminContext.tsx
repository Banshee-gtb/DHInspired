import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isAuthenticated: boolean;
  adminEmail: string;
  login: (email: string) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dh_admin');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return parsed?.authenticated === true;
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('dh_admin');
      if (!stored) return '';
      return JSON.parse(stored)?.email || '';
    } catch {
      return '';
    }
  });

  const login = (email: string) => {
    localStorage.setItem('dh_admin', JSON.stringify({ authenticated: true, email }));
    setIsAuthenticated(true);
    setAdminEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('dh_admin');
    setIsAuthenticated(false);
    setAdminEmail('');
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, adminEmail, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
