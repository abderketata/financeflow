import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { brand, spacing } from '@/theme/brand';

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  /** Colore la valeur (montant crédit/débit, statut...). */
  valueColor?: string;
  emphasis?: boolean;
}

/**
 * Ligne « icône + libellé à gauche, valeur en gras à droite ».
 * C'est le motif signature de la maquette pour les fiches de détail.
 */
export function DetailRow({ icon, label, value, valueColor, emphasis = true }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name={icon} size={17} color={brand.blue500} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.value, emphasis && styles.valueStrong, valueColor ? { color: valueColor } : null]}
        numberOfLines={1}
      >
        {value && value !== '' ? value : '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  label: {
    fontSize: 13.5,
    color: brand.slate600,
    flexShrink: 1,
  },
  value: {
    fontSize: 13.5,
    color: brand.navy900,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
  valueStrong: {
    fontWeight: '700',
  },
});
