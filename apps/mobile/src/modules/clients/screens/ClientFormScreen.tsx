import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreateClient, useUpdateClient } from '@/modules/clients/hooks/useClients';
import { clientSchema, ClientFormValues } from '@/modules/clients/schemas/client.schema';
import { MobileStackParamList } from '@/navigation/types';
import {
  buildClientMutationPayload,
  generateClientCode,
  getClientFormDefaults,
} from '@/modules/clients/utils/clientPresentation';
import { normalizeClientIdentityNumber } from '@/modules/clients/utils/identityNumber';
import {
  CLIENT_TAX_NUMBER_PLACEHOLDER,
  formatClientTaxNumber,
} from '@/modules/clients/utils/taxNumber';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={section.container}>
      <Text style={section.title}>{title}</Text>
      {subtitle ? <Text style={section.subtitle}>{subtitle}</Text> : null}
      <View style={section.divider} />
      {children}
    </View>
  );
}

const section = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  title: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
});

// ─── Type Selector ────────────────────────────────────────────────────────────

function TypeSelector({ value, onChange }: { value: string; onChange: (v: 'INDIVIDUAL' | 'COMPANY') => void }) {
  return (
    <View style={ts.row}>
      {(['INDIVIDUAL', 'COMPANY'] as const).map((type) => (
        <Pressable key={type} style={[ts.btn, value === type && ts.btnSelected]} onPress={() => onChange(type)}>
          <Text style={[ts.btnText, value === type && ts.btnTextSelected]}>
            {type === 'INDIVIDUAL' ? '👤 Particulier' : '🏢 Société'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const ts = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: 'transparent' },
  btnSelected: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  btnText: { fontWeight: '700', fontSize: 13, color: '#334155' },
  btnTextSelected: { color: '#fff' },
});

// ─── Screen principal ─────────────────────────────────────────────────────────

export function ClientFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'ClientForm'>) {
  const current = route.params?.client;
  const isEdit = Boolean(current);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const defaultValues = useMemo(() => getClientFormDefaults(current), []);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const clientType = watch('type');
  const fullName = watch('fullName');

  const prevClientRef = useRef(current?.id);
  useEffect(() => {
    if (prevClientRef.current !== current?.id) {
      prevClientRef.current = current?.id;
      reset(getClientFormDefaults(current));
    }
  }, [current?.id]);

  useEffect(() => {
    if (!isEdit) setValue('code', generateClientCode(fullName), { shouldDirty: false });
  }, [fullName, isEdit]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      const payload = buildClientMutationPayload(values);
      if (isEdit && current) {
        await updateMutation.mutateAsync({ id: current.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const onValidationError = (errs: typeof errors) => {
    const firstKey = Object.keys(errs)[0] as keyof ClientFormValues | undefined;
    if (firstKey) Alert.alert('Validation', (errs as any)[firstKey]?.message || 'Champ invalide');
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>{isEdit ? 'Modifier le client' : 'Nouveau client'}</Text>

          <Section title="Informations générales" subtitle="Identité métier du client.">
            <Controller name="fullName" control={control} render={({ field }) => (
              <AppTextField label="Nom complet *" value={field.value} onChangeText={field.onChange} placeholder="Ex. Foulen Ben Foulen" error={errors.fullName?.message} />
            )} />
            <Controller name="companyName" control={control} render={({ field }) => (
              <AppTextField label={clientType === 'COMPANY' ? 'Raison sociale *' : 'Société'} value={field.value ?? ''} onChangeText={field.onChange} placeholder="Ex. Flux Financier SARL" error={errors.companyName?.message} />
            )} />
            <Text style={styles.fieldLabel}>Type de client</Text>
            <Controller name="type" control={control} render={({ field }) => (
              <TypeSelector value={field.value} onChange={field.onChange} />
            )} />
            {errors.type ? <Text style={styles.fieldError}>{errors.type.message}</Text> : null}
          </Section>

          <Section title="Contact" subtitle="Coordonnées nécessaires au suivi client.">
            <Controller name="phone" control={control} render={({ field }) => (
              <AppTextField
                label="Téléphone *"
                value={field.value}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 8);
                  const formatted = digits.length > 5 ? `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}` : digits.length > 2 ? `${digits.slice(0, 2)} ${digits.slice(2)}` : digits;
                  field.onChange(formatted);
                }}
                placeholder="99 999 999"
                keyboardType="numeric"
                error={errors.phone?.message}
              />
            )} />
            <Controller name="email" control={control} render={({ field }) => (
              <AppTextField label="Email" value={field.value ?? ''} onChangeText={field.onChange} placeholder="contact@client.com" keyboardType="email-address" error={errors.email?.message as string | undefined} />
            )} />
            <Controller name="address" control={control} render={({ field }) => (
              <AppTextField label="Adresse" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Adresse postale complète" multiline />
            )} />
          </Section>

          <Section title="Informations administratives" subtitle="Références identitaires et fiscales.">
            <Controller name="identityNumber" control={control} render={({ field }) => (
              <AppTextField label="Numéro identifiant" value={field.value ?? ''} onChangeText={(t) => field.onChange(normalizeClientIdentityNumber(t))} placeholder="12345678" keyboardType="numeric" error={errors.identityNumber?.message} />
            )} />
            <Controller name="taxNumber" control={control} render={({ field }) => (
              <AppTextField label="Matricule fiscal" value={field.value ?? ''} onChangeText={(t) => field.onChange(formatClientTaxNumber(t))} placeholder={CLIENT_TAX_NUMBER_PLACEHOLDER} error={errors.taxNumber?.message} />
            )} />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Client actif</Text>
                <Text style={styles.switchHint}>Un client inactif reste visible mais n'est plus opérationnel.</Text>
              </View>
              <Controller name="isActive" control={control} render={({ field }) => (
                <Switch value={field.value} onValueChange={field.onChange} trackColor={{ false: '#e2e8f0', true: '#0f766e' }} thumbColor="#fff" />
              )} />
            </View>
          </Section>

          <Section title="Compléments" subtitle="Notes internes et contexte relationnel.">
            <Controller name="notes" control={control} render={({ field }) => (
              <AppTextField label="Notes" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Commentaires internes, informations de suivi..." multiline />
            )} />
          </Section>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={isBusy}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={handleSubmit(onSubmit, onValidationError)} disabled={isBusy}>
              <Text style={styles.submitBtnText}>
                {isBusy ? (isEdit ? 'Modification...' : 'Enregistrement...') : (isEdit ? 'Modifier le client' : 'Enregistrer le client')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  switchHint: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtnText: { fontWeight: '700', color: '#475569', fontSize: 15 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0f766e', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});

