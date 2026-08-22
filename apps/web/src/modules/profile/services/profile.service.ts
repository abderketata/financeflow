import { api } from '@/services/api/client';
import { setStoredSession, setStoredUser } from '@/services/api/authStorage';
import { LoginResponse } from '@/types/api';
import { AuthUser } from '@/types/domain';

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Les endpoints `users-permissions` ne suivent pas la convention `{ data: payload }`
 * des content-types Strapi : le corps est envoyé à plat.
 */
export const profileService = {
  async me() {
    const { data } = await api.get<AuthUser>('/users/me');
    return data;
  },
  async updateEmail(userId: number, email: string) {
    const { data } = await api.put<AuthUser>(`/users/${userId}`, { email });
    setStoredUser(data);
    return data;
  },
  async changePassword(payload: ChangePasswordPayload) {
    const { data } = await api.post<LoginResponse>('/auth/change-password', payload);
    // Strapi renvoie un nouveau JWT : on remplace la session pour éviter
    // d'être déconnecté au prochain appel.
    setStoredSession(data.jwt, data.user);
    return data;
  },
};
