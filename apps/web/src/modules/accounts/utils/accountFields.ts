export const ACCOUNT_NUMBER_MIN_LENGTH = 8;
export const ACCOUNT_NUMBER_MAX_LENGTH = 34;
export const IBAN_MAX_LENGTH = 24;
export const RIB_LENGTH = 8;

export const formatByGroups = (raw: string, groupSize = 4) =>
  raw.replace(new RegExp(`(.{${groupSize}})(?=.)`, 'g'), '$1 ');

export const normalizeAccountNumber = (value?: string | null) =>
  (value ?? '').replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_MAX_LENGTH);

export const formatAccountNumber = (value?: string | null) =>
  formatByGroups(normalizeAccountNumber(value));

export const normalizeIban = (value?: string | null) =>
  (value ?? '').replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, IBAN_MAX_LENGTH);

export const formatIban = (value?: string | null) =>
  formatByGroups(normalizeIban(value));

export const normalizeRib = (value?: string | null) =>
  (value ?? '').replace(/\D/g, '').slice(0, RIB_LENGTH);

export const isValidAccountNumber = (value?: string | null) => {
  const normalized = normalizeAccountNumber(value);
  return normalized.length >= ACCOUNT_NUMBER_MIN_LENGTH && normalized.length <= ACCOUNT_NUMBER_MAX_LENGTH;
};

export const isValidIban = (value?: string | null) => {
  const normalized = normalizeIban(value);
  return normalized === '' || (/^[A-Z0-9]+$/.test(normalized) && (!normalized.startsWith('TN') || normalized.length === 24));
};

export const isValidRib = (value?: string | null) => {
  const normalized = normalizeRib(value);
  return normalized === '' || /^\d{8}$/.test(normalized);
};

