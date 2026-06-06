import { queryClient } from '@/app/queryClient';
import { clearStoredSession } from '@/services/api/authStorage';

type AuthSessionListener = () => void;

const listeners = new Set<AuthSessionListener>();
let isUnauthorizedHandlingInProgress = false;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const isLoginRoute = () => typeof window !== 'undefined' && window.location.pathname === '/login';

export const subscribeToAuthSessionInvalidation = (listener: AuthSessionListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const handleUnauthorizedSession = () => {
  if (isUnauthorizedHandlingInProgress) {
    return;
  }

  isUnauthorizedHandlingInProgress = true;

  clearStoredSession();
  queryClient.clear();
  notifyListeners();

  if (!isLoginRoute()) {
    window.location.replace('/login');
    return;
  }

  isUnauthorizedHandlingInProgress = false;
};

