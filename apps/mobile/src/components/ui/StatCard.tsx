import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { brand, radius, shadow, spacing } from '@/theme/brand';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Teinte du médaillon d'icône ; déduite de `color` si absente. */
  iconBackground?: string;
}

/** Indicateur chiffré : libellé, valeur en gras, médaillon d'icône teinté. */
export function StatCard({
  label,
  value,
  color = brand.blue700,
  icon,
  iconBackground,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
      {icon ? (
        <View style={[styles.medallion, { backgroundColor: iconBackground ?? `${color}14` }]}>
          <Ionicons name={icon} size={21} color={color} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  text: {
    flexShrink: 1,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: brand.slate500,
  },
  value: {
    marginTop: 5,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  medallion: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
