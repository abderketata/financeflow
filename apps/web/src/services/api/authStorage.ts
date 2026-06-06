import { AuthUser } from '@/types/domain';

export const TOKEN_KEY = 'financeflow_token';
export const USER_KEY = 'financeflow_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = <T = AuthUser>() => {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStoredSession = (token: string, user: unknown) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

