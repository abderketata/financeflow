import { api } from '@/services/api/client';
import { LoginPayload, LoginResponse } from '@/types/api';
import { AuthUser } from '@/types/domain';

const TOKEN_KEY = 'financeflow_token';
const USER_KEY = 'financeflow_user';

const getLoginErrorMessage = (error: unknown) => {
  if (typeof error === 'string' && error.trim()) {
    return `Échec de connexion : ${error}`;
  }

  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      status?: number;
      error?: {
        message?: string;
        status?: number;
      };
    };

    const status = apiError.error?.status ?? apiError.status;
    const message = apiError.error?.message ?? apiError.message;

    if (message && status) {
      return `Échec de connexion (${status}) : ${message}`;
    }

    if (message) {
      return `Échec de connexion : ${message}`;
    }

    if (status) {
      return `Échec de connexion (${status}).`;
    }
  }

  return 'Échec de connexion : impossible d\'authentifier cet utilisateur.';
};

export const loginUser = async (credentials: LoginPayload): Promise<string> => {
  try {
    const { data } = await api.post<LoginResponse>('/auth/local', credentials, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return data.jwt;
  } catch (error) {
    return getLoginErrorMessage(error);
  }
};

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<LoginResponse>('/auth/local', payload);
    localStorage.setItem(TOKEN_KEY, data.jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
};

