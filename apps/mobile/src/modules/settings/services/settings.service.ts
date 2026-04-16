import { api } from '@/services/api/client';
import { AppSetting } from '@/types';
import { unwrapSingle } from '@/utils/strapi';

export const settingsService = {
  async get() {
    const { data } = await api.get('/app-setting');
    return unwrapSingle<AppSetting>(data);
  },
  async update(payload: Partial<AppSetting>) {
    const { data } = await api.put('/app-setting', { data: payload });
    return unwrapSingle<AppSetting>(data);
  },
};
