import { Ionicons } from '@expo/vector-icons';
import { PaymentItem } from '@/types';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';

type IconName = keyof typeof Ionicons.glyphMap;

export interface VisualConfig {
  label: string;
  color: string;
  bg: string;
  icon: IconName;
}

/**
 * Codes couleur des chèques / traites, repris à l'identique de la page web
 * `apps/web/src/modules/payment-items/pages/PaymentItemsPage.tsx` afin que les
 * deux applications parlent le même langage visuel. Seules les icônes changent
 * de bibliothèque (Ionicons au lieu de Material).
 */
export const typeConfig: Record<string, VisualConfig> = {
  CHEQUE: { label: 'Chèque', color: '#D97706', bg: '#FFFBEB', icon: 'receipt-outline' },
  TRAITE: { label: 'Traite', color: '#7C3AED', bg: '#F5F3FF', icon: 'document-text-outline' },
  AUTRE: { label: 'Autre', color: '#64748B', bg: '#F1F5F9', icon: 'ellipsis-horizontal' },
};

export const paymentMethodConfig: Record<string, VisualConfig> = {
  ESPECES: { label: 'Espèces', color: '#059669', bg: '#ECFDF5', icon: 'cash-outline' },
  VIREMENT: { label: 'Virement', color: '#2563EB', bg: '#EFF6FF', icon: 'swap-horizontal-outline' },
  CARTE: { label: 'Carte', color: '#0891B2', bg: '#ECFEFF', icon: 'card-outline' },
};

export const statusConfig: Record<string, VisualConfig> = {
  'Reçu': { label: 'Reçu', color: '#2563EB', bg: '#EFF6FF', icon: 'checkmark-circle-outline' },
  'Déposé': { label: 'Déposé', color: '#D97706', bg: '#FFFBEB', icon: 'wallet-outline' },
  'Payé': { label: 'Payé', color: '#059669', bg: '#ECFDF5', icon: 'cash-outline' },
  'Rejeté': { label: 'Rejeté', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
  'Annulé': { label: 'Annulé', color: '#64748B', bg: '#F1F5F9', icon: 'remove-circle-outline' },
  'En retard': { label: 'En retard', color: '#DC2626', bg: '#FEF2F2', icon: 'warning-outline' },
};

const FALLBACK_STATUS: VisualConfig = {
  label: '—',
  color: '#64748B',
  bg: '#F1F5F9',
  icon: 'ellipse-outline',
};

/**
 * Le type affiché suit la règle du web : un élément « AUTRE » dont la méthode de
 * règlement est renseignée s'affiche avec cette méthode (Espèces / Virement /
 * Carte), bien plus parlante que le générique « Autre ».
 */
export const getPaymentItemTypeVisual = (item: Partial<PaymentItem>): VisualConfig => {
  if (item.type === 'AUTRE' && item.paymentMethod) {
    return paymentMethodConfig[item.paymentMethod] ?? typeConfig.AUTRE;
  }

  return typeConfig[item.type ?? 'AUTRE'] ?? typeConfig.AUTRE;
};

export const getPaymentItemStatusVisual = (status?: string | null): VisualConfig => {
  const label = String(getPaymentItemStatusLabel(status));
  return statusConfig[label] ?? { ...FALLBACK_STATUS, label };
};
