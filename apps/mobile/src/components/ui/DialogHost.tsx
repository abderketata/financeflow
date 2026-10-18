// Boîte de dialogue de l'application — remplace `window.confirm` (build web)
// et `Alert.alert` (Android), dont le rendu système ne suit pas la charte.
//
// Un seul hôte, monté à la racine (`App.tsx`), affiche les dialogues demandés
// via `showDialog` ; `utils/confirm.ts` s'appuie dessus. Les demandes
// simultanées sont mises en file et affichées l'une après l'autre.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

export type DialogTone = 'danger' | 'warning' | 'info' | 'success';

export interface DialogHighlight {
  /** Valeur mise en avant (montant, référence…). */
  value: string;
  /** Lignes complémentaires sous la valeur. */
  lines?: string[];
}

export interface DialogOptions {
  title: string;
  message?: string;
  tone?: DialogTone;
  highlight?: DialogHighlight;
  confirmLabel?: string;
  /** `null` : dialogue d'information, un seul bouton. */
  cancelLabel?: string | null;
}

interface DialogRequest extends DialogOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

const TONES: Record<DialogTone, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  danger: { icon: 'alert-circle-outline', color: brand.danger, background: brand.dangerBg },
  warning: { icon: 'warning-outline', color: brand.warning, background: brand.warningBg },
  info: { icon: 'information-circle-outline', color: brand.blue600, background: brand.blue50 },
  success: { icon: 'checkmark-circle-outline', color: brand.credit, background: brand.creditBg },
};

let queue: DialogRequest[] = [];
let nextId = 1;
let mountedHosts = 0;
const listeners = new Set<(queue: DialogRequest[]) => void>();

const emit = () => listeners.forEach((listener) => listener(queue));

/** `false` tant que l'hôte n'est pas monté : l'appelant garde alors le rendu système. */
export const isDialogHostMounted = () => mountedHosts > 0;

export const showDialog = (options: DialogOptions) =>
  new Promise<boolean>((resolve) => {
    queue = [...queue, { ...options, id: nextId++, resolve }];
    emit();
  });

const settle = (id: number, confirmed: boolean) => {
  const request = queue.find((entry) => entry.id === id);
  queue = queue.filter((entry) => entry.id !== id);
  emit();
  request?.resolve(confirmed);
};

export function DialogHost() {
  const [pending, setPending] = useState<DialogRequest[]>(queue);

  useEffect(() => {
    mountedHosts += 1;
    listeners.add(setPending);
    setPending(queue);

    return () => {
      mountedHosts -= 1;
      listeners.delete(setPending);
    };
  }, []);

  const current = pending[0];

  if (!current) {
    return null;
  }

  const tone = TONES[current.tone ?? 'info'];
  const isInformation = current.cancelLabel === null;
  const confirmLabel = current.confirmLabel ?? (isInformation ? 'OK' : 'Confirmer');
  const cancelLabel = current.cancelLabel ?? 'Annuler';
  const dismiss = () => settle(current.id, false);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert" accessibilityLabel={current.title}>
          <View style={[styles.accent, { backgroundColor: tone.color }]} />

          <ScrollView contentContainerStyle={styles.body} bounces={false}>
            <View style={styles.header}>
              <View style={[styles.iconBadge, { backgroundColor: tone.background }]}>
                <Ionicons name={tone.icon} size={22} color={tone.color} />
              </View>
              <Text style={styles.title}>{current.title}</Text>
            </View>

            {current.message ? <Text style={styles.message}>{current.message}</Text> : null}

            {current.highlight ? (
              <View style={[styles.highlight, { backgroundColor: tone.background, borderColor: `${tone.color}33` }]}>
                <Text style={[styles.highlightValue, { color: tone.color }]} selectable>
                  {current.highlight.value}
                </Text>
                {current.highlight.lines?.filter(Boolean).map((line) => (
                  <Text key={line} style={styles.highlightLine}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            {!isInformation ? (
              <Pressable
                onPress={dismiss}
                style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => settle(current.id, true)}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: tone.color },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
  accent: {
    height: 4,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: brand.navy900,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.slate600,
  },
  highlight: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  highlightLine: {
    fontSize: 13,
    lineHeight: 18,
    color: brand.slate700,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  button: {
    minWidth: 104,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: brand.slate100,
  },
  pressed: {
    opacity: 0.85,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.slate700,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.white,
  },
});
