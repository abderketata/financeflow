// SettingsScreen — migration Web → Mobile complète
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect } from 'react';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useSettings, useUpdateSettings } from '@/modules/settings/hooks/useSettings';
import { settingsSchema, SettingsFormValues } from '@/modules/settings/schemas/settings.schema';

// ── Selector générique ──────────────────────────────────────────────────────
function OptionSelector<T extends string | number>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels?: Record<string, string>;
  onChange: (v: T) => void;
}) {
  return (
    <View style={sel.container}>
      <Text style={sel.label}>{label}</Text>
      <View style={sel.row}>
        {options.map((opt) => {
          const selected = String(value) === String(opt);
          return (
            <Pressable
              key={String(opt)}
              style={[sel.btn, selected && sel.btnSelected]}
              onPress={() => onChange(opt)}
            >
              <Text style={[sel.btnText, selected && sel.btnTextSelected]}>
                {labels?.[String(opt)] ?? String(opt)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const sel = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#e2e8f0' },
  btnSelected: { backgroundColor: '#0f766e' },
  btnText: { fontWeight: '700', fontSize: 13, color: '#334155' },
  btnTextSelected: { color: '#fff' },
});

// ── Currency labels ─────────────────────────────────────────────────────────
const CURRENCY_OPTIONS = ['TND', 'EUR', 'USD', 'GBP', 'MAD', 'DZD'];
const CURRENCY_LABELS: Record<string, string> = {
  TND: 'TND — Dinar Tunisien',
  EUR: 'EUR — Euro',
  USD: 'USD — Dollar US',
  GBP: 'GBP — Livre Sterling',
  MAD: 'MAD — Dirham Marocain',
  DZD: 'DZD — Dinar Algérien',
};
const WEEK_START_LABELS: Record<string, string> = { MONDAY: 'Lundi', SUNDAY: 'Dimanche' };

// ── Screen ──────────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { data, isLoading, isError, refetch } = useSettings();
  const updateMutation = useUpdateSettings();
  const isBusy = updateMutation.isPending;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      defaultCurrency: 'TND',
      defaultAlertDays: 3,
      weekStartsOn: 'MONDAY',
    },
  });

  // Pré-remplir les valeurs dès que les données sont disponibles
  useEffect(() => {
    if (data) {
      reset({
        companyName: data.companyName ?? '',
        defaultCurrency: data.defaultCurrency ?? data.currency ?? 'TND',
        defaultAlertDays: data.defaultAlertDays ?? data.alertDaysBefore ?? 3,
        weekStartsOn: data.weekStartsOn ?? 'MONDAY',
      });
    }
  }, [data]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync(values as any);
      Alert.alert('✓ Succès', 'Paramètres enregistrés avec succès.');
    } catch {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} message="Impossible de charger les paramètres." />;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={styles.title}>⚙️ Paramètres</Text>
          <Text style={styles.subtitle}>Devise, alertes et préférences d'affichage</Text>

          {/* Société */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏢 Société</Text>
            <Text style={styles.sectionSubtitle}>Identité de votre espace de travail</Text>
            <View style={styles.divider} />
            <Controller name="companyName" control={control} render={({ field }) => (
              <AppTextField
                label="Nom de la société"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Ex. CRM Finance SARL"
                error={errors.companyName?.message}
              />
            )} />
          </View>

          {/* Devise */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Devise</Text>
            <Text style={styles.sectionSubtitle}>Utilisée pour tous les montants affichés</Text>
            <View style={styles.divider} />
            <Controller name="defaultCurrency" control={control} render={({ field }) => (
              <OptionSelector
                label="Devise par défaut"
                value={field.value}
                options={CURRENCY_OPTIONS}
                labels={CURRENCY_LABELS}
                onChange={field.onChange}
              />
            )} />
            {errors.defaultCurrency ? <Text style={styles.fieldError}>{errors.defaultCurrency.message}</Text> : null}
          </View>

          {/* Alertes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Alertes</Text>
            <Text style={styles.sectionSubtitle}>Délai de notification avant échéance</Text>
            <View style={styles.divider} />
            <Controller name="defaultAlertDays" control={control} render={({ field }) => (
              <AppTextField
                label="Jours avant échéance (0–30)"
                value={field.value !== undefined ? String(field.value) : ''}
                onChangeText={field.onChange as any}
                keyboardType="numeric"
                placeholder="3"
                error={errors.defaultAlertDays?.message}
              />
            )} />
          </View>

          {/* Semaine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Calendrier</Text>
            <Text style={styles.sectionSubtitle}>Premier jour de la semaine</Text>
            <View style={styles.divider} />
            <Controller name="weekStartsOn" control={control} render={({ field }) => (
              <OptionSelector
                label="Début de semaine"
                value={field.value}
                options={['MONDAY', 'SUNDAY']}
                labels={WEEK_START_LABELS}
                onChange={field.onChange}
              />
            )} />
          </View>

          {/* Action */}
          <Pressable
            style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isBusy}
          >
            <Text style={styles.submitBtnText}>
              {isBusy ? 'Enregistrement...' : '💾  Enregistrer les paramètres'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  section: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: -8, marginBottom: 8 },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 16 },
});

