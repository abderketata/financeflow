import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MONTHLY_WINDOW_SHIFT } from '@/modules/dashboard/services/dashboard.service';
import { brand, radius, spacing } from '@/theme/brand';

interface MonthWindowNavigatorProps {
  /** Période affichée, ex. « Mai 2026 – Avr 2027 ». */
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** Décale la fenêtre de 12 mois d'un graphique mensuel vers le passé ou le futur. */
export function MonthWindowNavigator({ label, onPrevious, onNext }: MonthWindowNavigatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          onPress={onPrevious}
          accessibilityRole="button"
          accessibilityLabel={`Reculer de ${MONTHLY_WINDOW_SHIFT} mois`}
          style={({ pressed }) => [styles.shift, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={16} color={brand.slate600} />
          <Text style={styles.shiftLabel}>− {MONTHLY_WINDOW_SHIFT} mois</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={`Avancer de ${MONTHLY_WINDOW_SHIFT} mois`}
          style={({ pressed }) => [styles.shift, pressed && styles.pressed]}
        >
          <Text style={styles.shiftLabel}>+ {MONTHLY_WINDOW_SHIFT} mois</Text>
          <Ionicons name="chevron-forward" size={16} color={brand.slate600} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Zone de tracé d'un graphique mensuel : voile + spinner pendant le chargement
 * d'une fenêtre (l'ancienne reste visible dessous), message + relance en cas d'échec.
 */
export function MonthlyChartFrame({
  loading = false,
  onRetry,
  children,
}: {
  loading?: boolean;
  /** Fourni uniquement quand le chargement a échoué. */
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <View>
      {children}
      {loading || onRetry ? (
        <View style={styles.overlay}>
          {onRetry ? (
            <>
              <Text style={styles.overlayText}>Impossible de charger cette période.</Text>
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
              >
                <Text style={styles.retryLabel}>Réessayer</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={brand.blue600} />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate500,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shift: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    backgroundColor: brand.white,
  },
  shiftLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate600,
  },
  pressed: {
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  overlayText: {
    fontSize: 12.5,
    color: brand.slate500,
  },
  retry: {
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: brand.blue300,
    backgroundColor: brand.blue50,
  },
  retryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.blue700,
  },
});
