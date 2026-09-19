'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { adminAuth, AdminUser } from '../utils/adminAuth';

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuth = adminAuth.isAuthenticated();
    const currentUser = adminAuth.getUser();
    setIsAuthenticated(isAuth);
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (emailOrUser: string, pass: string) => {
    setIsLoading(true);
    const result = await adminAuth.login(emailOrUser, pass);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: result.error || 'Authentication failed' };
    }
  };

  const logout = () => {
    adminAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
