// PaymentItemFormScreen — migration Web → Mobile complète
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
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreatePaymentItem, useUpdatePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import { buildPaymentItemReference, getPaymentItemAccount } from '@/modules/payment-items/utils/paymentItemPresentation';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { MobileStackParamList } from '@/navigation/types';

// ── Selector générique ──────────────────────────────────────────────
function ButtonSelector<T extends string>({ value, options, labels, onChange, colors }: {
  value: T;
  options: T[];
  labels?: Record<string, string>;
  onChange: (v: T) => void;
  colors?: Record<string, string>;
}) {
  return (
    <View style={sel.row}>
      {options.map((opt) => {
        const selected = value === opt;
        const bg = selected ? (colors?.[opt] ?? '#0f766e') : '#e2e8f0';
        return (
          <Pressable key={opt} style={[sel.btn, { backgroundColor: bg }]} onPress={() => onChange(opt)}>
            <Text style={[sel.text, selected && sel.textSelected]}>{labels?.[opt] ?? opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const sel = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  btn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  text: { fontWeight: '700', fontSize: 13, color: '#334155' },
  textSelected: { color: '#fff' },
});

function getTodayISO() { return new Date().toISOString().slice(0, 10); }

export function PaymentItemFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemForm'>) {
  const current = route.params?.paymentItem;
  const isEdit = Boolean(current);
  const defaultCurrency = useDefaultCurrency();
  const { data: settings } = useSettings();
  const defaultAlertDays = settings?.alertDaysBefore ?? 3;
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      type: current?.type ?? 'CHEQUE',
      direction: current?.direction ?? 'IN',
      amount: current?.amount ?? (undefined as any),
      currency: current?.currency ?? defaultCurrency,
      status: (current?.status as any) ?? 'Déposé',
      issueDate: current?.issueDate ? current.issueDate.slice(0, 10) : getTodayISO(),
      dueDate: current?.dueDate ? current.dueDate.slice(0, 10) : '',
      drawer: current?.drawer ?? '',
      drawee: current?.drawee ?? '',
      alertEnabled: current?.alertEnabled ?? true,
      alertDaysBefore: current?.alertDaysBefore ?? defaultAlertDays,
      notes: current?.notes ?? '',
      referencePayment: current?.referencePayment ?? '',
      client: current?.client?.id ?? (undefined as any),
      account: getPaymentItemAccount(current)?.id ?? (undefined as any),
    },
  });


  const watchedType = watch('type');
  const showReferencePayment = watchedType === 'CHEQUE' || watchedType === 'TRAITE';

  const onSubmit = async (values: PaymentItemFormValues) => {
    try {
      const payload = {
        ...values,
        referenceNumber: buildPaymentItemReference(values.type, values.direction),
        paymentMethod: values.type === 'AUTRE' ? (values.paymentMethod ?? null) : null,
        supprimer: false,
      };
      if (isEdit && current) {
        await updateMutation.mutateAsync({ id: current.id, payload: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{isEdit ? 'Modifier paiement' : 'Nouveau paiement'}</Text>

          {/* Type */}
          <Text style={styles.fieldLabel}>Type</Text>
          <Controller name="type" control={control} render={({ field }) => (
            <ButtonSelector
              value={field.value}
              options={['CHEQUE', 'TRAITE', 'AUTRE']}
              labels={{ CHEQUE: 'Chèque', TRAITE: 'Traite', AUTRE: 'Autre' }}
              onChange={field.onChange}
              colors={{ CHEQUE: '#d97706', TRAITE: '#7c3aed', AUTRE: '#64748b' }}
            />
          )} />

          {/* Référence paiement — obligatoire si Chèque ou Traite */}
          {showReferencePayment && (
            <Controller name="referencePayment" control={control} render={({ field }) => (
              <AppTextField
                label={`Référence de paiement${showReferencePayment ? ' *' : ''}`}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                placeholder="N° de chèque / traite..."
                error={errors.referencePayment?.message}
              />
            )} />
          )}

          {/* Direction */}
          <Text style={styles.fieldLabel}>Sens</Text>          <Controller name="direction" control={control} render={({ field }) => (
            <ButtonSelector
              value={field.value}
              options={['IN', 'OUT']}
              labels={{ IN: '↑ Entrant', OUT: '↓ Sortant' }}
              onChange={field.onChange}
              colors={{ IN: '#16a34a', OUT: '#dc2626' }}
            />
          )} />

          {/* Statut */}
          <Text style={styles.fieldLabel}>Statut</Text>
          <Controller name="status" control={control} render={({ field }) => (
            <ButtonSelector
              value={field.value}
              options={['Déposé', 'Payé', 'Annulé', 'En retard']}
              onChange={field.onChange}
            />
          )} />
          {errors.status ? <Text style={styles.fieldError}>{errors.status.message}</Text> : null}

          {/* Montant + devise */}
          <Controller name="amount" control={control} render={({ field }) => (
            <AppTextField label="Montant *" value={field.value ? String(field.value) : ''} onChangeText={field.onChange as any} keyboardType="numeric" placeholder="0.00" error={errors.amount?.message} />
          )} />
          <Controller name="currency" control={control} render={({ field }) => (
            <AppTextField label="Devise" value={field.value} onChangeText={field.onChange} placeholder="TND" error={errors.currency?.message} />
          )} />

          {/* Dates */}
          <Controller name="issueDate" control={control} render={({ field }) => (
            <AppTextField label="Date d'émission (AAAA-MM-JJ)" value={field.value ?? ''} onChangeText={field.onChange} placeholder={getTodayISO()} error={errors.issueDate?.message} />
          )} />
          <Controller name="dueDate" control={control} render={({ field }) => (
            <AppTextField label="Échéance (AAAA-MM-JJ) *" value={field.value ?? ''} onChangeText={field.onChange} placeholder={getTodayISO()} error={errors.dueDate?.message} />
          )} />

          {/* Tireur / tiré */}
          <Controller name="drawer" control={control} render={({ field }) => (
            <AppTextField label="Tireur" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Nom du tireur" />
          )} />
          <Controller name="drawee" control={control} render={({ field }) => (
            <AppTextField label="Tiré" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Nom du tiré" />
          )} />

          {/* Client ID + Compte ID */}
          <Controller name="client" control={control} render={({ field }) => (
            <AppTextField label="ID Client *" value={field.value ? String(field.value) : ''} onChangeText={field.onChange as any} keyboardType="numeric" placeholder="ID numérique" error={errors.client?.message} />
          )} />
          <Controller name="account" control={control} render={({ field }) => (
            <AppTextField label="ID Compte" value={field.value ? String(field.value) : ''} onChangeText={field.onChange as any} keyboardType="numeric" placeholder="ID numérique (optionnel)" error={errors.account?.message} />
          )} />

          {/* Alerte */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Alerte de rappel</Text>
              <Text style={styles.switchHint}>Recevoir une notification avant l'échéance</Text>
            </View>
            <Controller name="alertEnabled" control={control} render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} trackColor={{ false: '#e2e8f0', true: '#0f766e' }} thumbColor="#fff" />
            )} />
          </View>

          {/* Notes */}
          <Controller name="notes" control={control} render={({ field }) => (
            <AppTextField label="Notes" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Commentaires internes..." multiline />
          )} />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={isBusy}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={handleSubmit(onSubmit)} disabled={isBusy}>
              <Text style={styles.submitBtnText}>
                {isBusy ? (isEdit ? 'Modification...' : 'Enregistrement...') : (isEdit ? 'Modifier' : 'Enregistrer')}
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
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  fieldError: { color: '#dc2626', fontSize: 12, marginTop: -10, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, marginBottom: 14 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  switchHint: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#475569', fontSize: 15 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0f766e', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});


