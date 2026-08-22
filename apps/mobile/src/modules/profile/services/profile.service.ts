import { api } from '@/services/api/client';
import { setStoredSession, setStoredUser } from '@/services/api/authStorage';
import { LoginResponse } from '@/types';

export interface ProfileUser {
  id: number;
  username: string;
  email?: string;
}

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
    const { data } = await api.get<ProfileUser>('/users/me');
    return data;
  },
  async updateEmail(userId: number, email: string) {
    const { data } = await api.put<ProfileUser>(`/users/${userId}`, { email });
    await setStoredUser(data);
    return data;
  },
  async changePassword(payload: ChangePasswordPayload) {
    const { data } = await api.post<LoginResponse>('/auth/change-password', payload);
    // Strapi renvoie un nouveau JWT : on remplace la session pour éviter
    // d'être déconnecté au prochain appel.
    await setStoredSession(data.jwt, data.user);
    return data;
  },
};
