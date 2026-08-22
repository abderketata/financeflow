import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  maxLength?: number;
  error?: string;
  multiline?: boolean;
  /** Icône à gauche du champ ; par défaut aucune. */
  icon?: keyof typeof Ionicons.glyphMap;
  editable?: boolean;
}

/**
 * Champ de saisie : coque blanche arrondie, icône à gauche, bord bleu au focus,
 * bord rouge en erreur — conforme à la maquette.
 */
export function AppTextField({
  label,
  error,
  multiline,
  icon,
  secureTextEntry,
  editable = true,
  ...props
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const accentColor = error ? brand.danger : focused ? brand.blue600 : brand.slate400;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.shell,
          multiline && styles.shellMultiline,
          focused && styles.shellFocused,
          Boolean(error) && styles.shellError,
          !editable && styles.shellDisabled,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={accentColor} style={styles.icon} /> : null}
        <TextInput
          {...props}
          editable={editable}
          multiline={multiline}
          secureTextEntry={secureTextEntry && !revealed}
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholderTextColor={brand.slate400}
          selectionColor={brand.blue600}
          textAlignVertical={multiline ? 'top' : 'auto'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((previous) => !previous)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Masquer' : 'Afficher'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={brand.slate400}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg - 2,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate700,
    marginBottom: 6,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    minHeight: 52,
  },
  shellMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    minHeight: 92,
  },
  shellFocused: {
    borderColor: brand.blue600,
  },
  shellError: {
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
  },
  shellDisabled: {
    backgroundColor: brand.slate100,
    borderColor: brand.slate200,
  },
  icon: {
    marginTop: 1,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: brand.navy900,
    paddingVertical: spacing.md,
    // Retire le contour bleu ajouté par le navigateur en build web.
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  inputMultiline: {
    paddingTop: 0,
    minHeight: 68,
  },
  error: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
});
