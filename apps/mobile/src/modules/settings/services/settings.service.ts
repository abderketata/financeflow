import { api } from '@/services/api/client';
import { AppSetting } from '@/types';
import { unwrapSingle } from '@/utils/strapi';

const normalizeSettings = (settings: AppSetting | null): AppSetting | null => {
  if (!settings) {
    return null;
  }

  return {
    ...settings,
    defaultCurrency: settings.defaultCurrency ?? settings.currency ?? 'TND',
    defaultAlertDays: settings.defaultAlertDays ?? settings.alertDaysBefore ?? 3,
    weekStartsOn: settings.weekStartsOn === 'SUNDAY' ? 'SUNDAY' : 'MONDAY',
    currency: settings.defaultCurrency ?? settings.currency ?? 'TND',
    alertDaysBefore: settings.defaultAlertDays ?? settings.alertDaysBefore ?? 3,
  };
};

const normalizeToBackend = (payload: Partial<AppSetting>) => ({
  companyName: payload.companyName,
  defaultCurrency: payload.defaultCurrency ?? payload.currency,
  defaultAlertDays: payload.defaultAlertDays ?? payload.alertDaysBefore,
  weekStartsOn: payload.weekStartsOn === 'SUNDAY' ? 'SUNDAY' : 'MONDAY',
});

export const settingsService = {
  async get() {
    const { data } = await api.get('/app-setting');
    return normalizeSettings(unwrapSingle<AppSetting>(data));
  },
  async update(payload: Partial<AppSetting>) {
    const { data } = await api.put('/app-setting', { data: normalizeToBackend(payload) });
    return normalizeSettings(unwrapSingle<AppSetting>(data));
  },
};
