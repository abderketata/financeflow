import { api } from '@/services/api/client';
import { LoginPayload, LoginResponse } from '@/types';
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from '@/services/api/authStorage';

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<LoginResponse>('/auth/local', payload);
    await setStoredSession(data.jwt, data.user);
    return data;
  },
  async logout() {
    await clearStoredSession();
  },
  async getToken() {
    return getStoredToken();
  },
  async getUser() {
    return getStoredUser();
  }
};

