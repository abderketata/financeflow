export const CLIENT_IDENTITY_NUMBER_REGEX = /^\d{8}$/;
export const CLIENT_IDENTITY_NUMBER_LENGTH = 8;

export const normalizeClientIdentityNumber = (value?: string | null) =>
  (value ?? '').replace(/\D/g, '').slice(0, CLIENT_IDENTITY_NUMBER_LENGTH);

export const isValidClientIdentityNumber = (value?: string | null) =>
  CLIENT_IDENTITY_NUMBER_REGEX.test(normalizeClientIdentityNumber(value));

