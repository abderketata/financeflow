import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

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
          <Pressable key={option} style={[styles.chip, selected ? styles.selected : null]} onPress={() => onChange(selected ? '' : option)}>
            <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginRight: 8
  },
  selected: {
    backgroundColor: '#0f766e'
  },
  label: {
    color: '#334155',
    fontWeight: '600'
  },
  selectedLabel: {
    color: '#fff'
  }
});
