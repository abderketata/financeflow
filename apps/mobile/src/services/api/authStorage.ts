import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'financeflow_token';
export const USER_KEY = 'financeflow_user';

export const getStoredToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export const getStoredUser = async <T = unknown>() => {
  const raw = await SecureStore.getItemAsync(USER_KEY);

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
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
};

export const clearStoredSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
};

export const summarizeToken = (token: string | null) => ({
  source: `expo-secure-store:${TOKEN_KEY}`,
  present: Boolean(token),
  format: token ? (token.split('.').length === 3 ? 'jwt' : 'non-jwt') : 'none',
  probableKind: token ? 'users-permissions (/auth/local)' : 'none',
  preview: token ? `${token.slice(0, 12)}…${token.slice(-6)}` : null,
});
