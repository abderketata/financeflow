/**
 * Système de design mobile.
 *
 * Couleurs alignées sur l'application web (`apps/web/src/app/theme.ts`) ;
 * espacements, rayons et ombres calqués sur la maquette de référence :
 * fond lavande clair, cartes blanches très arrondies, accents bleus.
 */
export const brand = {
  navy900: '#0F172A',
  navy800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  blue700: '#1D4ED8',
  blue600: '#2563EB',
  blue500: '#3B82F6',
  blue300: '#93C5FD',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',
  /** Fond d'écran clair, légèrement lavande. */
  canvas: '#EEF0FA',
  credit: '#059669',
  creditBg: '#ECFDF5',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  violet: '#7C3AED',
  violetBg: '#F5F3FF',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

/** Ombres douces : `shadow*` pour iOS/web, `elevation` pour Android. */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  accent: {
    shadowColor: brand.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

/** Couleurs des statuts de paiement, partagées par les cartes et les pastilles. */
export const statusPalette: Record<string, { color: string; bg: string }> = {
  'Déposé': { color: brand.warning, bg: brand.warningBg },
  'Payé': { color: brand.credit, bg: brand.creditBg },
  'Annulé': { color: brand.slate500, bg: brand.slate100 },
  'En retard': { color: brand.danger, bg: brand.dangerBg },
  'Reçu': { color: brand.blue600, bg: brand.blue50 },
  'Rejeté': { color: brand.danger, bg: brand.dangerBg },
};

export const getStatusStyle = (status?: string | null) =>
  statusPalette[String(status ?? '')] ?? { color: brand.slate500, bg: brand.slate100 };
