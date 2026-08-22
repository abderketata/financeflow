import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

interface StatusPillProps {
  label: string;
  color: string;
  backgroundColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Phrase d'explication affichée sous la pastille. */
  caption?: string;
  /** `true` : bandeau pleine largeur (fiche) ; `false` : pastille compacte (liste). */
  block?: boolean;
}

/** Bandeau ou pastille de statut, teinté selon l'état. */
export function StatusPill({
  label,
  color,
  backgroundColor,
  icon,
  caption,
  block = false,
}: StatusPillProps) {
  return (
    <View style={block ? styles.blockWrapper : styles.inlineWrapper}>
      <View
        style={[
          block ? styles.block : styles.inline,
          { backgroundColor, borderColor: `${color}33` },
        ]}
      >
        {icon ? <Ionicons name={icon} size={block ? 15 : 13} color={color} /> : null}
        <Text style={[block ? styles.blockLabel : styles.inlineLabel, { color }]}>{label}</Text>
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blockWrapper: {
    marginTop: spacing.md,
  },
  inlineWrapper: {
    alignSelf: 'flex-start',
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  blockLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  inlineLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  caption: {
    marginTop: 6,
    fontSize: 11.5,
    color: brand.slate500,
    textAlign: 'center',
  },
});
