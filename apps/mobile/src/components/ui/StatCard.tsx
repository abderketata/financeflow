import { StyleSheet, Text, View } from 'react-native';

export function StatCard({ label, value, color = '#0f766e' }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  label: {
    color: '#64748b',
    marginBottom: 8
  },
  value: {
    fontSize: 22,
    fontWeight: '700'
  }
});

