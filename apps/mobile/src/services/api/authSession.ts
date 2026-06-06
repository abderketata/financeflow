import { queryClient } from '@/app/queryClient';
import { clearStoredSession } from '@/services/api/authStorage';

type AuthSessionListener = () => void;

const listeners = new Set<AuthSessionListener>();
let invalidationPromise: Promise<void> | null = null;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToAuthSessionInvalidation = (listener: AuthSessionListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const handleUnauthorizedSession = async () => {
  if (invalidationPromise) {
    return invalidationPromise;
  }

  invalidationPromise = (async () => {
    await clearStoredSession();
    queryClient.clear();
    notifyListeners();
  })().finally(() => {
    invalidationPromise = null;
  });

  return invalidationPromise;
};

