import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { brand, radius, shadow, spacing } from '@/theme/brand';

// FilterChips — support labelMap optionnel pour affichage traduit des valeurs
export function FilterChips({
  options,
  value,
  onChange,
  labelMap,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  labelMap?: Record<string, string>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {options.map((option) => {
        const selected = option === value;
        const label = labelMap?.[option] ?? (option || 'Tous');
        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}
            onPress={() => onChange(selected ? '' : option)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    marginRight: spacing.sm,
    ...shadow.card,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  chipPressed: {
    backgroundColor: brand.blue50,
  },
  chipSelected: {
    backgroundColor: brand.blue700,
    borderColor: brand.blue700,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.slate600,
  },
  labelSelected: {
    color: brand.white,
  },
});
