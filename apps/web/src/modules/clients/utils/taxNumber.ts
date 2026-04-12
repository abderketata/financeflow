export const CLIENT_TAX_NUMBER_PLACEHOLDER = '1234567A B000';
export const CLIENT_TAX_NUMBER_REGEX = /^\d{7}[A-Z0-9][A-Z]\d{3}$/;

const getAllowedTaxNumberChar = (char: string, index: number) => {
  if (index <= 6) {
    return /\d/.test(char) ? char : '';
  }

  if (index === 7) {
    return /[A-Z0-9]/.test(char) ? char : '';
  }

  if (index === 8) {
    return /[A-Z]/.test(char) ? char : '';
  }

  if (index <= 11) {
    return /\d/.test(char) ? char : '';
  }

  return '';
};

export const normalizeClientTaxNumber = (value?: string | null) => {
  const input = (value ?? '').toUpperCase();
  let normalized = '';

  for (const char of input) {
    if (char === ' ') {
      continue;
    }

    if (normalized.length >= 12) {
      break;
    }

    const allowedChar = getAllowedTaxNumberChar(char, normalized.length);
    if (allowedChar) {
      normalized += allowedChar;
    }
  }

  return normalized;
};

export const formatClientTaxNumber = (value?: string | null) => {
  const normalized = normalizeClientTaxNumber(value);

  if (normalized.length <= 8) {
    return normalized;
  }

  return `${normalized.slice(0, 8)} ${normalized.slice(8)}`;
};

export const isValidClientTaxNumber = (value?: string | null) => {
  const normalized = normalizeClientTaxNumber(value);
  return CLIENT_TAX_NUMBER_REGEX.test(normalized);
};

