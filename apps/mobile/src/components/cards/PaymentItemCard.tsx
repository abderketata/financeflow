import { StyleSheet, Text, View } from 'react-native';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export function PaymentItemCard({ item }: { item: PaymentItem }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.reference}</Text>
      <Text style={styles.meta}>{item.type} • {item.direction}</Text>
      <Text style={styles.meta}>{formatCurrency(item.amount)} • {formatDate(item.dueDate)}</Text>
      <Text style={[styles.badge, item.status?.toUpperCase().includes('PAID') ? styles.success : styles.warning]}>{item.status}</Text>
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
  }
});

