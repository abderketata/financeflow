import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export function TransactionCard({ item }: { item: Transaction }) {
  const positive = item.operationType === 'CREDIT';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.label}</Text>
      <Text style={styles.meta}>{formatDate(item.operationDate)}</Text>
      <Text style={[styles.amount, { color: positive ? '#16a34a' : '#dc2626' }]}>
        {positive ? '+' : '-'} {formatCurrency(item.amount)}
      </Text>
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
    marginBottom: 8
  },
  amount: {
    fontWeight: '700',
    fontSize: 18
  }
});

