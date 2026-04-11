import { createContext, useContext, useMemo, useState } from 'react';
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(authService.getToken()),
    async login(identifier: string, password: string) {
      const response = await authService.login({ identifier, password });
      setUser(response.user);
    },
    logout() {
      authService.logout();
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }

  return context;
};

