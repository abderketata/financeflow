import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { brand, spacing } from '@/theme/brand';

export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={brand.blue600} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: brand.canvas,
  },
  text: {
    marginTop: spacing.md,
    fontSize: 13.5,
    fontWeight: '500',
    color: brand.slate500,
  },
});
