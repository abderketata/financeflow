import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export function TransactionCard({ item }: { item: Transaction }) {
  const isCredit = item.operationType === 'CREDIT';

  return (
    <View style={[styles.card, isCredit ? styles.cardCredit : styles.cardDebit]}>
      <View style={styles.row}>
        {/* Indicateur couleur */}
        <View style={[styles.bar, { backgroundColor: isCredit ? '#16a34a' : '#dc2626' }]} />
        <View style={styles.body}>
          <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.meta}>{formatDate(item.operationDate)}</Text>
          {item.client?.name ? <Text style={styles.meta}>👤 {item.client.name}</Text> : null}
          {item.bankAccount?.label ? <Text style={styles.meta}>🏦 {item.bankAccount.label}</Text> : null}
        </View>
        <View style={styles.right}>
          <View style={[styles.typeBadge, isCredit ? styles.creditBadge : styles.debitBadge]}>
            <Text style={[styles.typeText, { color: isCredit ? '#16a34a' : '#dc2626' }]}>
              {isCredit ? 'Crédit' : 'Débit'}
            </Text>
          </View>
          <Text style={[styles.amount, { color: isCredit ? '#16a34a' : '#dc2626' }]}>
            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardCredit: { borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  cardDebit: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  bar: { width: 0 }, // handled by borderLeft on card
  body: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b' },
  right: { alignItems: 'flex-end', gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  creditBadge: { backgroundColor: '#dcfce7' },
  debitBadge: { backgroundColor: '#fef2f2' },
  typeText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '800' },
});
