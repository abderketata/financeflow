import { StyleSheet, Text, View } from 'react-native';
import { Client } from '@/types';

export function ClientCard({ item }: { item: Client }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.meta}>{item.code || 'Sans code'}</Text>
      <Text style={styles.meta}>{item.phone || item.email || 'Aucun contact'}</Text>
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
    color: '#64748b'
  }
});

