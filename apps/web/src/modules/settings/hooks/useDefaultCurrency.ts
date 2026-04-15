import { useSettings } from './useSettings';
export const DEFAULT_CURRENCY_FALLBACK = 'TND';
export const useDefaultCurrency = (): string => {
  const { data: settings } = useSettings();
  return settings?.defaultCurrency || DEFAULT_CURRENCY_FALLBACK;
};
