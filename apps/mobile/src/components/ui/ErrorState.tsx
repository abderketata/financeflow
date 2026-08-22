import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { brand, radius, spacing } from '@/theme/brand';

export function ErrorState({
  message = 'Une erreur est survenue.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.medallion}>
        <Ionicons name="alert-circle-outline" size={34} color={brand.danger} />
      </View>
      <Text style={styles.title}>Erreur</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <AppButton label="Réessayer" icon="refresh" onPress={onRetry} block={false} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: brand.canvas,
  },
  medallion: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: brand.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 17,
    fontWeight: '800',
    color: brand.navy900,
  },
  message: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 19,
    color: brand.slate500,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    height: 44,
    paddingHorizontal: spacing.xl,
  },
});
