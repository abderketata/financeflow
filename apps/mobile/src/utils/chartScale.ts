/**
 * Échelle dynamique partagée par tous les graphiques financiers.
 *
 * Règles :
 * - la borne haute de l'axe Y est TOUJOURS déduite du maximum réel de toutes
 *   les séries affichées (crédits, débits, ...), jamais d'une constante ;
 * - une marge visuelle d'au moins `MIN_HEADROOM` est garantie au-dessus de la
 *   plus grande valeur, pour qu'une barre / un point ne touche jamais le haut
 *   de la zone de tracé ;
 * - les valeurs des séries ne sont jamais modifiées : seule l'échelle et le
 *   libellé des graduations sont calculés ici.
 */

const NICE_FRACTIONS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const MIN_HEADROOM = 0.1;
const DEFAULT_SEGMENTS = 4;
const EMPTY_SCALE_MAX = 1000;
const NBSP = '\u00A0'; // espace insécable, comme le formatage fr-FR

const COMPACT_UNITS = [
  { threshold: 1e9, suffix: 'Md' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'k' },
];

export interface AmountScale {
  /** Borne basse de l'axe (0 tant qu'aucune série n'est négative). */
  min: number;
  /** Borne haute de l'axe, toujours >= max des séries + marge. */
  max: number;
  step: number;
  ticks: number[];
}

export interface AmountScaleOptions {
  /** Nombre d'intervalles visés entre `min` et `max`. */
  segments?: number;
  /** Marge minimale au-dessus de la plus grande valeur (0.1 = 10 %). */
  headroom?: number;
}

const toFiniteNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Maximum / minimum réels sur l'ensemble des clés de séries demandées. */
export const getSeriesValueRange = <T,>(
  data: readonly T[] | null | undefined,
  keys: readonly (keyof T)[],
): { min: number; max: number } => {
  let min = 0;
  let max = 0;

  for (const entry of data ?? []) {
    for (const key of keys) {
      const value = toFiniteNumber(entry?.[key]);

      if (value > max) {
        max = value;
      }

      if (value < min) {
        min = value;
      }
    }
  }

  return { min, max };
};

const buildTicks = (min: number, max: number, step: number): number[] => {
  const count = Math.max(Math.round((max - min) / step), 0);
  const ticks: number[] = [];

  for (let index = 0; index <= count; index += 1) {
    // On repart de `min` à chaque itération pour éviter le cumul d'erreurs de flottants.
    ticks.push(Number((min + index * step).toPrecision(12)));
  }

  return ticks;
};

const findNiceScale = (min: number, max: number, segments: number): AmountScale => {
  const span = max - min;
  const startExponent = Math.floor(Math.log10(span / segments));

  for (let exponent = startExponent; exponent <= startExponent + 3; exponent += 1) {
    const power = Math.pow(10, exponent);

    for (const fraction of NICE_FRACTIONS) {
      const step = fraction * power;
      const niceMin = Math.floor(min / step) * step;
      const niceMax = Math.ceil(max / step) * step;

      if ((niceMax - niceMin) / step <= segments + 1e-9) {
        return { min: niceMin, max: niceMax, step, ticks: buildTicks(niceMin, niceMax, step) };
      }
    }
  }

  const fallbackStep = span / segments;
  return { min, max, step: fallbackStep, ticks: buildTicks(min, max, fallbackStep) };
};

/** Construit l'échelle à partir d'une plage de valeurs déjà calculée. */
export const buildAmountScale = (
  range: { min: number; max: number },
  options?: AmountScaleOptions,
): AmountScale => {
  const segments = Math.max(2, Math.round(options?.segments ?? DEFAULT_SEGMENTS));
  const headroom = Math.max(0, options?.headroom ?? MIN_HEADROOM);
  const rawMax = toFiniteNumber(range.max);
  const rawMin = Math.min(toFiniteNumber(range.min), 0);

  if (rawMax <= 0 && rawMin >= 0) {
    const step = EMPTY_SCALE_MAX / segments;
    return { min: 0, max: EMPTY_SCALE_MAX, step, ticks: buildTicks(0, EMPTY_SCALE_MAX, step) };
  }

  const tightScale = findNiceScale(rawMin, rawMax, segments);
  const hasHeadroom =
    (rawMax <= 0 || tightScale.max >= rawMax * (1 + headroom)) &&
    (rawMin >= 0 || tightScale.min <= rawMin * (1 + headroom));

  if (hasHeadroom) {
    return tightScale;
  }

  return findNiceScale(rawMin * (1 + headroom), rawMax * (1 + headroom), segments);
};

/** Raccourci : plage des séries + échelle, en une seule étape. */
export const buildChartAmountScale = <T,>(
  data: readonly T[] | null | undefined,
  keys: readonly (keyof T)[],
  options?: AmountScaleOptions,
): AmountScale => buildAmountScale(getSeriesValueRange(data, keys), options);

const formatDecimal = (value: number, fractionDigits: number): string => {
  const fixed = value.toFixed(fractionDigits);
  const [integerPart, fractionPart] = fixed.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

  if (!fractionPart || Number(fractionPart) === 0) {
    return grouped;
  }

  return `${grouped},${fractionPart.replace(/0+$/, '')}`;
};

/**
 * Libellé abrégé façon `Intl.NumberFormat('fr-FR', { notation: 'compact' })`
 * (1 000 -> « 1 k », 34 817 032 -> « 35 M », 100 070 900 -> « 100 M »).
 *
 * Implémentation manuelle volontaire : `notation: 'compact'` n'est pas
 * disponible partout côté mobile (Hermes sans ICU complet). Purement cosmétique,
 * la valeur d'origine n'est jamais tronquée ni plafonnée.
 */
export const formatCompactAmount = (value: unknown): string => {
  const numeric = toFiniteNumber(value);
  const sign = numeric < 0 ? '-' : '';
  const absolute = Math.abs(numeric);
  // 0.9995 : évite « 1000 k » là où « 1 M » est attendu après arrondi.
  const unit = COMPACT_UNITS.find((entry) => absolute >= entry.threshold * 0.9995);

  if (!unit) {
    return `${sign}${formatDecimal(absolute, absolute < 10 ? 1 : 0)}`;
  }

  const scaled = absolute / unit.threshold;
  return `${sign}${formatDecimal(scaled, scaled < 9.995 ? 1 : 0)}${NBSP}${unit.suffix}`;
};
