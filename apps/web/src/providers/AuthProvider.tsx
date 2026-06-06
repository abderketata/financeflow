import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { banksQueryOptions } from '@/modules/banks/hooks/useBanks';
import { subscribeToAuthSessionInvalidation } from '@/services/api/authSession';
import { authService } from '@/services/api/auth';
import { AuthUser } from '@/types/domain';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authService.getToken()) {
      return;
    }

    void queryClient.ensureQueryData(banksQueryOptions);
  }, [queryClient]);

  useEffect(() => subscribeToAuthSessionInvalidation(() => {
    setUser(null);
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(authService.getToken()),
    async login(identifier: string, password: string) {
      const response = await authService.login({ identifier, password });
      await queryClient.ensureQueryData(banksQueryOptions);
      setUser(response.user);
    },
    logout() {
      authService.logout();
      queryClient.clear();
      setUser(null);
    }
  }), [queryClient, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }

  return context;
};

