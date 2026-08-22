import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { DetailRow } from '@/components/ui/DetailRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { PaymentItem } from '@/types';
import {
  getPaymentItemAccount,
  getPaymentItemClientPrimary,
  getPaymentItemEffectiveDate,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { formatCurrency, formatDate } from '@/utils/format';
import { brand, getStatusStyle, spacing } from '@/theme/brand';

const TYPE_LABELS: Record<string, string> = {
  CHEQUE: 'Chèque',
  TRAITE: 'Traite',
  AUTRE: 'Autre',
};

const STATUS_ICONS: Record<string, 'time-outline' | 'checkmark-circle' | 'close-circle' | 'warning'> = {
  'Déposé': 'time-outline',
  'Payé': 'checkmark-circle',
  'Annulé': 'close-circle',
  'En retard': 'warning',
};

export function PaymentItemCard({ item }: { item: PaymentItem }) {
  const isIn = item.direction === 'IN';
  const statusLabel = String(getPaymentItemStatusLabel(item.status));
  const statusStyle = getStatusStyle(statusLabel);
  const account = getPaymentItemAccount(item);
  const directionColor = isIn ? brand.credit : brand.danger;

  return (
    <AppCard accent={statusStyle.color}>
      {/* Bandeau : référence + montant signé */}
      <View style={styles.header}>
        <Text style={styles.reference} numberOfLines={1}>
          {getPaymentItemReference(item)}
        </Text>
        <Text style={[styles.amount, { color: directionColor }]} numberOfLines={1}>
          {isIn ? '+' : '-'}
          {formatCurrency(item.amount, item.currency)}
        </Text>
      </View>

      <View style={styles.divider} />

      <DetailRow
        icon="pricetag-outline"
        label="Type"
        value={`${TYPE_LABELS[item.type] ?? item.type} · ${isIn ? 'Entrant' : 'Sortant'}`}
      />
      <DetailRow
        icon="calendar-outline"
        label="Échéance"
        value={formatDate(getPaymentItemEffectiveDate(item))}
      />
      {item.client ? (
        <DetailRow icon="person-outline" label="Client" value={getPaymentItemClientPrimary(item.client)} />
      ) : null}
      {account ? <DetailRow icon="business-outline" label="Compte" value={account.label} /> : null}
      {item.referencePayment ? (
        <DetailRow icon="bookmark-outline" label="Référence" value={item.referencePayment} />
      ) : null}

      <StatusPill
        block
        label={statusLabel}
        color={statusStyle.color}
        backgroundColor={statusStyle.bg}
        icon={STATUS_ICONS[statusLabel] ?? 'ellipse-outline'}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reference: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brand.navy900,
  },
  amount: {
    fontSize: 15.5,
    fontWeight: '800',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: brand.slate100,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
