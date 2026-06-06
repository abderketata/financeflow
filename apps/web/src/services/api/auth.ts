import { api } from '@/services/api/client';
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from '@/services/api/authStorage';
import { LoginPayload, LoginResponse } from '@/types/api';
import { AuthUser } from '@/types/domain';

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
    setStoredSession(data.jwt, data.user);
    return data;
  },
  logout() {
    clearStoredSession();
  },
  getToken() {
    return getStoredToken();
  },
  getUser(): AuthUser | null {
    return getStoredUser<AuthUser>();
  }
};

