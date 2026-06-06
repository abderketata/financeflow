import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/api/auth';
import { subscribeToAuthSessionInvalidation } from '@/services/api/authSession';

interface AuthContextValue {
  user: any;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const bootstrap = async () => {
      const currentUser = await authService.getUser();
      setUser(currentUser);
      setIsBootstrapping(false);
    };

    bootstrap();
  }, []);

  useEffect(() => subscribeToAuthSessionInvalidation(() => {
    setUser(null);
    setIsBootstrapping(false);
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isBootstrapping,
    async login(identifier, password) {
      const response = await authService.login({ identifier, password });
      setUser(response.user);
    },
    async logout() {
      await authService.logout();
      queryClient.clear();
      setUser(null);
    }
  }), [isBootstrapping, queryClient, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};

