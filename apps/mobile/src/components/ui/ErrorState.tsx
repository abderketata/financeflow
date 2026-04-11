import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ErrorState({ message = 'Une erreur est survenue.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Erreur</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  message: {
    color: '#64748b',
    textAlign: 'center'
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

