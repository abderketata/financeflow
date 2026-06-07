import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SMALL_NUMBERS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
const SCALE_NAMES = [
  { value: 1_000_000_000, singular: 'milliard', plural: 'milliards' },
  { value: 1_000_000, singular: 'million', plural: 'millions' },
  { value: 1_000, singular: 'mille', plural: 'mille' },
] as const;

const CURRENCY_UNITS: Record<string, { majorSingular: string; majorPlural: string; minorSingular: string; minorPlural: string }> = {
  TND: { majorSingular: 'dinar', majorPlural: 'dinars', minorSingular: 'millime', minorPlural: 'millimes' },
  EUR: { majorSingular: 'euro', majorPlural: 'euros', minorSingular: 'millième', minorPlural: 'millièmes' },
  USD: { majorSingular: 'dollar', majorPlural: 'dollars', minorSingular: 'millième', minorPlural: 'millièmes' },
  GBP: { majorSingular: 'livre', majorPlural: 'livres', minorSingular: 'millième', minorPlural: 'millièmes' },
};

const normalizeCurrencyCode = (currency?: string | null) => (currency ?? 'TND').trim().toUpperCase() || 'TND';
const capitalizeFirstLetter = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const normalizeAmountInput = (value: string | number | null | undefined) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const convertUnderHundred = (value: number): string => {
  if (value < 17) {
    return SMALL_NUMBERS[value];
  }

  if (value < 20) {
    return `dix-${SMALL_NUMBERS[value - 10]}`;
  }

  if (value < 70) {
    const tens = Math.floor(value / 10);
    const unit = value % 10;
    const tensWord = TENS[tens];

    if (unit === 0) {
      return tensWord;
    }

    if (unit === 1) {
      return `${tensWord} et un`;
    }

    return `${tensWord}-${SMALL_NUMBERS[unit]}`;
  }

  if (value < 80) {
    if (value === 71) {
      return 'soixante et onze';
    }

    return `soixante-${convertUnderHundred(value - 60)}`;
  }

  if (value === 80) {
    return 'quatre-vingts';
  }

  return `quatre-vingt-${convertUnderHundred(value - 80)}`;
};

const convertUnderThousand = (value: number): string => {
  if (value < 100) {
    return convertUnderHundred(value);
  }

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const hundredWord = hundreds === 1 ? 'cent' : `${SMALL_NUMBERS[hundreds]} cent`;
  const normalizedHundredWord = rest === 0 && hundreds > 1 ? `${hundredWord}s` : hundredWord;

  if (rest === 0) {
    return normalizedHundredWord;
  }

  return `${hundredWord} ${convertUnderHundred(rest)}`;
};

const convertIntegerToFrenchWords = (value: number): string => {
  if (value === 0) {
    return SMALL_NUMBERS[0];
  }

  for (const scale of SCALE_NAMES) {
    if (value >= scale.value) {
      const quotient = Math.floor(value / scale.value);
      const remainder = value % scale.value;
      const scalePrefix = scale.value === 1_000
        ? quotient === 1
          ? scale.singular
          : `${convertIntegerToFrenchWords(quotient)} ${scale.singular}`
        : `${convertIntegerToFrenchWords(quotient)} ${quotient > 1 ? scale.plural : scale.singular}`;

      if (remainder === 0) {
        return scalePrefix;
      }

      return `${scalePrefix} ${convertIntegerToFrenchWords(remainder)}`;
    }
  }

  return convertUnderThousand(value);
};

const formatAmountUnit = (value: number, singular: string, plural: string) =>
  `${convertIntegerToFrenchWords(value)} ${value === 1 ? singular : plural}`;

const getCurrencyUnits = (currency?: string | null) => {
  const code = normalizeCurrencyCode(currency);
  return CURRENCY_UNITS[code] ?? {
    majorSingular: code,
    majorPlural: code,
    minorSingular: 'millième',
    minorPlural: 'millièmes',
  };
};

export const formatCurrency = (value?: number, currency = 'TND') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(Number(value ?? 0));

export const formatDate = (value?: string | null, pattern = 'dd/MM/yyyy') => {
  if (!value) return '—';
  try {
    return format(new Date(value), pattern, { locale: fr });
  } catch {
    return value;
  }
};

export const normalizeText = (value?: string | null) => (value ?? '').toLowerCase().trim();

export const formatAmountInWords = (value?: string | number | null, currency?: string | null) => {
  const normalizedAmount = normalizeAmountInput(value);

  if (normalizedAmount == null || normalizedAmount < 0) {
    return '';
  }

  const totalMinorUnits = Math.round(normalizedAmount * 1000);
  const majorUnits = Math.floor(totalMinorUnits / 1000);
  const minorUnits = totalMinorUnits % 1000;
  const units = getCurrencyUnits(currency);
  const parts: string[] = [];

  if (majorUnits > 0) {
    parts.push(formatAmountUnit(majorUnits, units.majorSingular, units.majorPlural));
  }

  if (minorUnits > 0) {
    parts.push(formatAmountUnit(minorUnits, units.minorSingular, units.minorPlural));
  }

  if (!parts.length) {
    return capitalizeFirstLetter(`zéro ${units.majorSingular}`);
  }

  return capitalizeFirstLetter(parts.join(' et '));
};

