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
  Text,
  View,
} from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreateTransaction, useUpdateTransaction } from '@/modules/transactions/hooks/useTransactions';
import { transactionSchema, TransactionFormValues } from '@/modules/transactions/schemas/transaction.schema';
import { MobileStackParamList } from '@/navigation/types';

function TypeSelector({ value, onChange }: { value: string; onChange: (v: 'DEBIT' | 'CREDIT') => void }) {
  return (
    <View style={ts.row}>
      {(['DEBIT', 'CREDIT'] as const).map((type) => (
        <Pressable key={type} style={[ts.btn, value === type && (type === 'CREDIT' ? ts.creditSelected : ts.debitSelected)]} onPress={() => onChange(type)}>
          <Text style={[ts.btnText, value === type && ts.btnTextSelected]}>
            {type === 'CREDIT' ? '↑ Crédit' : '↓ Débit'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const ts = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#e2e8f0' },
  creditSelected: { backgroundColor: '#16a34a' },
  debitSelected: { backgroundColor: '#dc2626' },
  btnText: { fontWeight: '700', fontSize: 14, color: '#334155' },
  btnTextSelected: { color: '#fff' },
});

export function TransactionFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'TransactionForm'>) {
  const current = route.params?.transaction;
  const isEdit = Boolean(current);
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const { control, handleSubmit, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      label: current?.label ?? '',
      operationType: current?.operationType ?? 'DEBIT',
      amount: current?.amount ?? (undefined as any),
      operationDate: current?.operationDate ? current.operationDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: current?.notes ?? '',
      client: current?.client?.id ?? undefined,
      bankAccount: current?.bankAccount?.id ?? undefined,
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      if (isEdit && current) {
        await updateMutation.mutateAsync({ id: current.id, payload: values as any });
      } else {
        await createMutation.mutateAsync(values as any);
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
          <Text style={styles.title}>{isEdit ? 'Modifier opération' : 'Nouvelle opération'}</Text>

          <Text style={styles.fieldLabel}>Type d'opération</Text>
          <Controller name="operationType" control={control} render={({ field }) => (
            <TypeSelector value={field.value} onChange={field.onChange} />
          )} />

          <Controller name="label" control={control} render={({ field }) => (
            <AppTextField label="Libellé *" value={field.value} onChangeText={field.onChange} placeholder="Ex. Paiement fournisseur" error={errors.label?.message} />
          )} />
          <Controller name="amount" control={control} render={({ field }) => (
            <AppTextField label="Montant *" value={field.value ? String(field.value) : ''} onChangeText={field.onChange as any} keyboardType="numeric" placeholder="0.00" error={errors.amount?.message} />
          )} />
          <Controller name="operationDate" control={control} render={({ field }) => (
            <AppTextField label="Date (AAAA-MM-JJ) *" value={field.value} onChangeText={field.onChange} placeholder={new Date().toISOString().slice(0, 10)} error={errors.operationDate?.message} />
          )} />
          <Controller name="notes" control={control} render={({ field }) => (
            <AppTextField label="Notes" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Commentaires internes..." multiline />
          )} />

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
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#475569', fontSize: 15 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0f766e', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});

