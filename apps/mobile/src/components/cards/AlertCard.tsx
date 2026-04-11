import { StyleSheet, Text, View } from 'react-native';
import { AlertItem } from '@/types';
import { formatDate } from '@/utils/format';

export function AlertCard({ item }: { item: AlertItem }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>{item.message}</Text>
      <Text style={styles.date}>{formatDate(item.triggerDate || item.createdAt)}</Text>
      <Text style={[styles.badge, item.isRead ? styles.success : styles.warning]}>{item.isRead ? 'Lue' : 'Non lue'}</Text>
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
    marginBottom: 6
  },
  meta: {
    color: '#334155',
    marginBottom: 6
  },
  date: {
    color: '#64748b',
    marginBottom: 8
  },
  badge: {
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

