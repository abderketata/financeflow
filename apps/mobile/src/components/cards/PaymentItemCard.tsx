import { StyleSheet, Text, View } from 'react-native';
import { PaymentItem } from '@/types';
import { getPaymentItemEffectiveDate, getPaymentItemReference, getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import { formatCurrency, formatDate } from '@/utils/format';

export function PaymentItemCard({ item }: { item: PaymentItem }) {
  const statusLabel = getPaymentItemStatusLabel(item.status);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{getPaymentItemReference(item)}</Text>
      <Text style={styles.meta}>{item.type} • {item.direction}</Text>
      <Text style={styles.meta}>{formatCurrency(item.amount, item.currency)} • {formatDate(getPaymentItemEffectiveDate(item))}</Text>
      <Text style={[styles.badge, statusLabel === 'Payé' ? styles.success : statusLabel === 'En retard' || statusLabel === 'Rejeté' ? styles.error : styles.warning]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4
  },
  meta: {
    color: '#64748b',
    marginBottom: 2
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#fff',
    fontWeight: '700'
  },
  success: {
    backgroundColor: '#16a34a'
  },
  warning: {
    backgroundColor: '#d97706'
  },
  error: {
    backgroundColor: '#dc2626'
  }
});

