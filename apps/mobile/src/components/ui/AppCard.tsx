import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { brand, radius, shadow, spacing } from '@/theme/brand';

interface AppCardProps {
  children: React.ReactNode;
  /** Liseré vertical coloré sur le bord droit, comme sur la maquette. */
  accent?: string;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

/** Carte blanche arrondie, brique de base de toutes les listes et sections. */
export function AppCard({ children, accent, onPress, style, padded = true }: AppCardProps) {
  const content = (
    <>
      <View style={[padded && styles.body, !padded && styles.bodyFlush]}>{children}</View>
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  pressed: {
    backgroundColor: brand.slate50,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg - 2,
  },
  bodyFlush: {
    flex: 1,
  },
  accent: {
    width: 5,
  },
});
