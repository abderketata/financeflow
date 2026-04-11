import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api/client';
import { LoginPayload, LoginResponse } from '@/types';

const TOKEN_KEY = 'financeflow_token';
const USER_KEY = 'financeflow_user';

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<LoginResponse>('/auth/local', payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.jwt);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  async logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
};

