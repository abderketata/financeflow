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

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
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

/* ────────────────────────────────────────────────────────────────────────
 * Montant en lettres — arabe (tafqit) et échelle usuelle tunisienne
 *
 * Porté du web (apps/web/src/utils/format.ts) : les deux applications
 * annoncent un montant à l'identique et appliquent le même seuil de
 * confirmation à la saisie.
 * ──────────────────────────────────────────────────────────────────────── */

const ARABIC_ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const ARABIC_TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const ARABIC_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const ARABIC_HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

/** Formes d'un nom compté en arabe : singulier, duel, pluriel (3-10), accusatif (11-99). */
interface ArabicNounForms {
  one: string;
  two: string;
  few: string;
  many: string;
}

/** `twoConstruct` : duel amputé du nūn, employé lorsqu'un nom compté suit (ألفا دينار). */
const ARABIC_SCALES: Array<{ value: number; twoConstruct: string } & ArabicNounForms> = [
  { value: 1_000_000_000, one: 'مليار', two: 'ملياران', twoConstruct: 'مليارا', few: 'مليارات', many: 'ملياراً' },
  { value: 1_000_000, one: 'مليون', two: 'مليونان', twoConstruct: 'مليونا', few: 'ملايين', many: 'مليوناً' },
  { value: 1_000, one: 'ألف', two: 'ألفان', twoConstruct: 'ألفا', few: 'آلاف', many: 'ألفاً' },
];

const ARABIC_CURRENCY_UNITS: Record<string, { major: ArabicNounForms; minor: ArabicNounForms }> = {
  TND: {
    major: { one: 'دينار', two: 'ديناران', few: 'دنانير', many: 'ديناراً' },
    minor: { one: 'مليم', two: 'مليمان', few: 'مليمات', many: 'مليماً' },
  },
  EUR: {
    major: { one: 'يورو', two: 'يورو', few: 'يورو', many: 'يورو' },
    minor: { one: 'سنت', two: 'سنتان', few: 'سنتات', many: 'سنتاً' },
  },
  USD: {
    major: { one: 'دولار', two: 'دولاران', few: 'دولارات', many: 'دولاراً' },
    minor: { one: 'سنت', two: 'سنتان', few: 'سنتات', many: 'سنتاً' },
  },
  GBP: {
    major: { one: 'جنيه', two: 'جنيهان', few: 'جنيهات', many: 'جنيهاً' },
    minor: { one: 'بنس', two: 'بنسان', few: 'بنسات', many: 'بنساً' },
  },
};

const getArabicCurrencyUnits = (currency?: string | null) => {
  const code = normalizeCurrencyCode(currency);
  return ARABIC_CURRENCY_UNITS[code] ?? {
    major: { one: code, two: code, few: code, many: code },
    minor: { one: 'جزء', two: 'جزءان', few: 'أجزاء', many: 'جزءاً' },
  };
};

/** Accord du nom compté : ديناران / ثلاثة دنانير / أحد عشر ديناراً / مائة دينار. */
const getArabicNounForm = (count: number, forms: ArabicNounForms) => {
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;

  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 3 && lastTwoDigits <= 10) return forms.few;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 99) return forms.many;

  return forms.one;
};

const convertUnderThousandToArabic = (value: number, followedByNoun = false): string => {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;

  if (hundreds > 0) {
    // مائتان → مائتا à l'état construit, comme les duels d'échelle.
    parts.push(hundreds === 2 && rest === 0 && followedByNoun ? 'مائتا' : ARABIC_HUNDREDS[hundreds]);
  }

  if (rest > 0) {
    if (rest < 10) {
      parts.push(ARABIC_ONES[rest]);
    } else if (rest < 20) {
      parts.push(ARABIC_TEENS[rest - 10]);
    } else {
      const tens = Math.floor(rest / 10);
      const unit = rest % 10;
      parts.push(unit > 0 ? `${ARABIC_ONES[unit]} و${ARABIC_TENS[tens]}` : ARABIC_TENS[tens]);
    }
  }

  return parts.join(' و');
};

/**
 * @param followedByNoun un nom compté suit directement le nombre (le duel passe
 *   alors à l'état construit : « ألفا دينار » et non « ألفان دينار »).
 */
const convertIntegerToArabicWords = (value: number, followedByNoun = false): string => {
  if (value === 0) {
    return 'صفر';
  }

  const parts: string[] = [];
  let rest = value;

  for (const scale of ARABIC_SCALES) {
    const quotient = Math.floor(rest / scale.value);

    if (quotient === 0) {
      continue;
    }

    rest %= scale.value;
    // Le duel n'est à l'état construit que si le nom compté suit vraiment,
    // c'est-à-dire si aucune autre tranche ne vient après cette échelle.
    const isLastPart = rest === 0;

    if (quotient === 1) {
      parts.push(scale.one);
    } else if (quotient === 2) {
      parts.push(followedByNoun && isLastPart ? scale.twoConstruct : scale.two);
    } else {
      // Même accord que pour un nom compté : ثلاثة آلاف / أحد عشر ألفاً / مائة ألف.
      parts.push(`${convertIntegerToArabicWords(quotient)} ${getArabicNounForm(quotient, scale)}`);
    }
  }

  if (rest > 0) {
    parts.push(convertUnderThousandToArabic(rest, followedByNoun));
  }

  return parts.join(' و');
};

const formatArabicAmountUnit = (value: number, forms: ArabicNounForms) => {
  const noun = getArabicNounForm(value, forms);

  // En arabe le nom précède l'adjectif numéral pour 1, et le duel se suffit à lui-même.
  if (value === 1) return `${noun} واحد`;
  if (value === 2) return noun;

  return `${convertIntegerToArabicWords(value, true)} ${noun}`;
};

/** Échelles usuelles tunisiennes, invariables : « ثلاثة مليون » et non « ثلاثة ملايين ». */
const COLLOQUIAL_ARABIC_MILYAR = { one: 'مليار', two: 'مليارين' };
const COLLOQUIAL_ARABIC_MILLION = { one: 'مليون', two: 'مليونين' };

const formatColloquialArabicScale = (count: number, forms: { one: string; two: string }) => {
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;

  return `${convertIntegerToArabicWords(count)} ${forms.one}`;
};

/**
 * Partie « dinars » dans l'échelle usuelle tunisienne : 1 000 DT se dit
 * « مليون » et 1 000 000 DT « مليار ». En dessous de 1 000 DT le rendu est
 * identique à l'arabe standard.
 *
 * Ex. 3 470 DT -> « ثلاثة مليون وأربعمائة وسبعون ديناراً ».
 */
const formatColloquialArabicMajor = (major: number, forms: ArabicNounForms) => {
  const milyar = Math.floor(major / MILYAR_IN_MAJOR_UNITS);
  const million = Math.floor((major % MILYAR_IN_MAJOR_UNITS) / COLLOQUIAL_MILLION_IN_MAJOR_UNITS);
  const rest = major % COLLOQUIAL_MILLION_IN_MAJOR_UNITS;

  if (milyar === 0 && million === 0) {
    return formatArabicAmountUnit(major, forms);
  }

  const parts: string[] = [];

  if (milyar > 0) {
    parts.push(formatColloquialArabicScale(milyar, COLLOQUIAL_ARABIC_MILYAR));
  }

  if (million > 0) {
    parts.push(formatColloquialArabicScale(million, COLLOQUIAL_ARABIC_MILLION));
  }

  if (rest > 0) {
    parts.push(convertUnderThousandToArabic(rest, true));
  }

  // Le nom compté s'accorde avec le dernier nombre énoncé (470 -> ديناراً, rien -> دينار).
  return `${parts.join(' و')} ${getArabicNounForm(rest > 0 ? rest : 1, forms)}`;
};

/** Montant en lettres arabes, ex. 1 000 000 TND -> « مليار دينار » (échelle usuelle). */
export const formatAmountInWordsArabic = (value?: string | number | null, currency?: string | null) => {
  const normalizedAmount = normalizeAmountInput(value);

  if (normalizedAmount == null || normalizedAmount < 0) {
    return '';
  }

  const totalMinorUnits = Math.round(normalizedAmount * 1000);
  const majorUnits = Math.floor(totalMinorUnits / 1000);
  const minorUnits = totalMinorUnits % 1000;
  const units = getArabicCurrencyUnits(currency);
  const parts: string[] = [];

  if (majorUnits > 0) {
    // Hors dinar tunisien, l'échelle usuelle « million / milyar » ne s'applique pas.
    parts.push(
      normalizeCurrencyCode(currency) === 'TND'
        ? formatColloquialArabicMajor(majorUnits, units.major)
        : formatArabicAmountUnit(majorUnits, units.major),
    );
  }

  if (minorUnits > 0) {
    parts.push(formatArabicAmountUnit(minorUnits, units.minor));
  }

  if (!parts.length) {
    return `صفر ${units.major.one}`;
  }

  return parts.join(' و');
};

/* ────────────────────────────────────────────────────────────────────────
 * Échelle usuelle tunisienne (« million » / « milyar »)
 *
 * Dans l'usage courant on compte en millimes : 1 000 DT se dit « un million »
 * et 1 000 000 DT se dit « un milyar ». Un montant saisi en dinars doit donc
 * être annoncé dans cette échelle pour éviter tout malentendu à la saisie.
 * ──────────────────────────────────────────────────────────────────────── */

/** 1 milyar = 1 000 000 DT. */
export const MILYAR_IN_MAJOR_UNITS = 1_000_000;
/** 1 « million » (usage courant) = 1 000 DT. */
export const COLLOQUIAL_MILLION_IN_MAJOR_UNITS = 1_000;
/** Au-delà, la saisie est assez rare pour mériter une confirmation explicite. */
export const HIGH_AMOUNT_CONFIRMATION_THRESHOLD = 100_000;

export interface ColloquialAmount {
  scale: 'milyar' | 'million';
  /** Valeur exprimée dans l'échelle usuelle (1 000 000 DT -> 1). */
  value: number;
  /** Libellé français, ex. « 1 milyar », « 2,5 milyar », « 250 millions ». */
  label: string;
  /** Libellé arabe, ex. « 1 مليار », « 250 مليون ». */
  arabicLabel: string;
}

const formatColloquialValue = (value: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);

/**
 * Traduit un montant en dinars vers l'échelle usuelle tunisienne.
 * Renvoie `null` hors dinar tunisien ou en dessous de 1 000 DT, où l'usage
 * courant ne diffère pas du montant écrit.
 */
export const describeColloquialAmount = (
  value?: string | number | null,
  currency?: string | null,
): ColloquialAmount | null => {
  if (normalizeCurrencyCode(currency) !== 'TND') {
    return null;
  }

  const amount = normalizeAmountInput(value);

  if (amount == null || amount < COLLOQUIAL_MILLION_IN_MAJOR_UNITS) {
    return null;
  }

  if (amount >= MILYAR_IN_MAJOR_UNITS) {
    const scaled = amount / MILYAR_IN_MAJOR_UNITS;
    const formatted = formatColloquialValue(scaled);

    return {
      scale: 'milyar',
      value: scaled,
      label: `${formatted} milyar`,
      arabicLabel: `${formatted} مليار`,
    };
  }

  const scaled = amount / COLLOQUIAL_MILLION_IN_MAJOR_UNITS;
  const formatted = formatColloquialValue(scaled);

  return {
    scale: 'million',
    value: scaled,
    label: `${formatted} million${scaled >= 2 ? 's' : ''}`,
    arabicLabel: `${formatted} مليون`,
  };
};
