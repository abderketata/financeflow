import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { brand, radius, shadow, spacing } from '@/theme/brand';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'soft' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** `false` pour un bouton qui s'adapte à son contenu (actions de carte). */
  block?: boolean;
  style?: ViewStyle;
}

const variantColors = {
  primary: { bg: brand.blue700, pressed: brand.navy800, text: brand.white, border: 'transparent' },
  outline: { bg: 'transparent', pressed: brand.blue50, text: brand.blue700, border: brand.blue300 },
  soft: { bg: brand.blue50, pressed: brand.blue100, text: brand.blue700, border: 'transparent' },
  danger: { bg: brand.dangerBg, pressed: '#FCE7E7', text: brand.danger, border: 'transparent' },
} as const;

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  block = true,
  style,
}: AppButtonProps) {
  const colors = variantColors[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        block ? styles.block : styles.inline,
        {
          backgroundColor: pressed && !isInactive ? colors.pressed : colors.bg,
          borderColor: colors.border,
        },
        variant === 'primary' && shadow.accent,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={block ? 18 : 15} color={colors.text} /> : null}
          <Text style={[block ? styles.label : styles.labelInline, { color: colors.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  block: {
    height: 54,
    paddingHorizontal: spacing.lg,
  },
  inline: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactive: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelInline: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
