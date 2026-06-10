import { Platform } from 'react-native';

export const TOKEN_KEY = 'financeflow_token';
export const USER_KEY = 'financeflow_user';

const isWeb = Platform.OS === 'web';

type SecureStoreModule = typeof import('expo-secure-store');

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

let secureStoreModule: SecureStoreModule | null = null;

const getSecureStore = (): SecureStoreModule | null => {
  if (isWeb) {
    return null;
  }

  if (!secureStoreModule) {
    secureStoreModule = require('expo-secure-store') as SecureStoreModule;
  }

  return secureStoreModule;
};

const getWebStorage = () => {
  if (typeof globalThis === 'undefined' || !("localStorage" in globalThis)) {
    return null;
  }

  return (globalThis as typeof globalThis & { localStorage?: WebStorage }).localStorage ?? null;
};

const getItem = async (key: string) => {
  if (isWeb) {
    try {
      return getWebStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return getSecureStore()?.getItemAsync(key) ?? null;
};

const setItem = async (key: string, value: string) => {
  if (isWeb) {
    try {
      getWebStorage()?.setItem(key, value);
    } catch {
      // Ignore les erreurs d'accès/quotas en environnement web.
    }

    return;
  }

  await getSecureStore()?.setItemAsync(key, value);
};

const deleteItem = async (key: string) => {
  if (isWeb) {
    try {
      getWebStorage()?.removeItem(key);
    } catch {
      // Ignore les erreurs d'accès en environnement web.
    }

    return;
  }

  await getSecureStore()?.deleteItemAsync(key);
};

export const getStoredToken = () => getItem(TOKEN_KEY);

export const getStoredUser = async <T = unknown>() => {
  const raw = await getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStoredSession = async (token: string, user: unknown) => {
  await Promise.all([
    setItem(TOKEN_KEY, token),
    setItem(USER_KEY, JSON.stringify(user)),
  ]);
};

export const clearStoredSession = async () => {
  await Promise.all([
    deleteItem(TOKEN_KEY),
    deleteItem(USER_KEY),
  ]);
};

export const summarizeToken = (token: string | null) => ({
  source: `${isWeb ? 'localStorage' : 'expo-secure-store'}:${TOKEN_KEY}`,
  present: Boolean(token),
  format: token ? (token.split('.').length === 3 ? 'jwt' : 'non-jwt') : 'none',
  probableKind: token ? 'users-permissions (/auth/local)' : 'none',
  preview: token ? `${token.slice(0, 12)}…${token.slice(-6)}` : null,
});
