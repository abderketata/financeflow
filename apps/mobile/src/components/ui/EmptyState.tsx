import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message || 'Aucune donnée disponible.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 32
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  message: {
    color: '#64748b',
    textAlign: 'center'
  }
});

