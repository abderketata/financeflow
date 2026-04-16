import { StyleSheet, Text, View } from 'react-native';
import { PaymentItem } from '@/types';
import {
  getPaymentItemEffectiveDate,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemClientPrimary,
  getPaymentItemAccount,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { formatCurrency, formatDate } from '@/utils/format';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Reçu':      { bg: '#eff6ff', color: '#2563eb' },
  'Déposé':    { bg: '#fffbeb', color: '#d97706' },
  'Payé':      { bg: '#ecfdf5', color: '#059669' },
  'Rejeté':    { bg: '#fef2f2', color: '#dc2626' },
  'Annulé':    { bg: '#f1f5f9', color: '#64748b' },
  'En retard': { bg: '#fef2f2', color: '#dc2626' },
};

const TYPE_LABELS: Record<string, string> = {
  CHEQUE: 'Chèque',
  TRAITE: 'Traite',
  AUTRE:  'Autre',
};

export function PaymentItemCard({ item }: { item: PaymentItem }) {
  const isIn = item.direction === 'IN';
  const statusLabel = String(getPaymentItemStatusLabel(item.status));
  const statusStyle = STATUS_COLORS[statusLabel] ?? { bg: '#f1f5f9', color: '#64748b' };
  const account = getPaymentItemAccount(item);
  const clientName = item.client ? getPaymentItemClientPrimary(item.client) : null;

  return (
    <View style={[styles.card, isIn ? styles.cardIn : styles.cardOut]}>
      {/* Ligne 1 : référence + montant */}
      <View style={styles.row}>
        <Text style={styles.ref} numberOfLines={1}>{getPaymentItemReference(item)}</Text>
        <Text style={[styles.amount, { color: isIn ? '#16a34a' : '#dc2626' }]}>
          {isIn ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
        </Text>
      </View>
      {/* Ligne 2 : type + direction + date */}
      <View style={styles.row}>
        <Text style={styles.meta}>{TYPE_LABELS[item.type] ?? item.type} · {isIn ? '↑ Entrant' : '↓ Sortant'}</Text>
        <Text style={styles.meta}>{formatDate(getPaymentItemEffectiveDate(item))}</Text>
      </View>
      {/* Ligne 3 : client + compte */}
      {(clientName || account) && (
        <View style={styles.row}>
          {clientName ? <Text style={styles.meta} numberOfLines={1}>👤 {clientName}</Text> : null}
          {account ? <Text style={styles.meta} numberOfLines={1}>🏦 {account.label}</Text> : null}
        </View>
      )}
      {/* Statut */}
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardIn:  { borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  cardOut: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ref: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 },
  amount: { fontSize: 15, fontWeight: '800', flexShrink: 0 },
  meta: { fontSize: 12, color: '#64748b', flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
