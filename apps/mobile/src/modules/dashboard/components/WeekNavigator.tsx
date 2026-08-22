import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

interface WeekNavigatorProps {
  label: string;
  isCurrentWeek: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}

/** Sélecteur de semaine : précédent / semaine actuelle / suivant. */
export function WeekNavigator({
  label,
  isCurrentWeek,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onCurrent,
}: WeekNavigatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          onPress={onPrevious}
          disabled={!canGoPrevious}
          accessibilityRole="button"
          accessibilityLabel="Semaine précédente"
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed, !canGoPrevious && styles.disabled]}
        >
          <Ionicons name="chevron-back" size={18} color={brand.slate600} />
        </Pressable>

        <Pressable
          onPress={onCurrent}
          disabled={isCurrentWeek}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.current,
            isCurrentWeek ? styles.currentActive : null,
            pressed && !isCurrentWeek && styles.pressed,
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={isCurrentWeek ? brand.white : brand.blue700}
          />
          <Text style={[styles.currentLabel, isCurrentWeek && styles.currentLabelActive]}>
            Semaine actuelle
          </Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          accessibilityRole="button"
          accessibilityLabel="Semaine suivante"
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed, !canGoNext && styles.disabled]}
        >
          <Ionicons name="chevron-forward" size={18} color={brand.slate600} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
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
  arrow: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    backgroundColor: brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: brand.blue300,
    backgroundColor: brand.blue50,
  },
  currentActive: {
    backgroundColor: brand.blue700,
    borderColor: brand.blue700,
  },
  currentLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.blue700,
  },
  currentLabelActive: {
    color: brand.white,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
