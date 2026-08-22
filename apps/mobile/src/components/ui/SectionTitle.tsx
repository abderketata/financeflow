import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand, spacing } from '@/theme/brand';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  /** Affiche un chevron cliquable à droite, comme « Spécialité › » sur la maquette. */
  onPressAction?: () => void;
  actionLabel?: string;
}

/** Intertitre bleu qui sépare les blocs d'un écran. */
export function SectionTitle({ title, subtitle, onPressAction, actionLabel }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPressAction ? (
        <Pressable onPress={onPressAction} hitSlop={8} style={styles.action} accessibilityRole="button">
          {actionLabel ? <Text style={styles.actionLabel}>{actionLabel}</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={brand.blue600} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  text: {
    flexShrink: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brand.blue700,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: brand.slate500,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.blue600,
  },
});
