import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreatePaymentItem, useUpdatePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import { buildPaymentItemReference } from '@/modules/payment-items/utils/paymentItemPresentation';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { MobileStackParamList } from '@/navigation/types';

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentItemFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemForm'>) {
  const current = route.params?.paymentItem;
  const defaultCurrency = useDefaultCurrency();
  const { data: settings } = useSettings();
  const defaultAlertDays = settings?.alertDaysBefore ?? 3;
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();

  const { control, handleSubmit, formState: { errors } } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      type: current?.type || 'CHEQUE',
      direction: current?.direction || 'IN',
      amount: current?.amount || 0,
      currency: current?.currency || defaultCurrency,
      status: (current?.status as any) || 'Reçu',
      dueDate: current?.dueDate ? current.dueDate.slice(0, 10) : '',
      issueDate: current?.issueDate
        ? current.issueDate.slice(0, 10)
        : getTodayISO()
    }
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{current ? 'Modifier paiement' : 'Nouveau paiement'}</Text>
        <Controller name="type" control={control} render={({ field }) => <AppTextField label="Type (CHEQUE / TRAITE / AUTRE)" value={field.value} onChangeText={field.onChange} error={errors.type?.message} />} />
        <Controller name="direction" control={control} render={({ field }) => <AppTextField label="Sens (IN / OUT)" value={field.value} onChangeText={field.onChange} error={errors.direction?.message} />} />
        <Controller name="amount" control={control} render={({ field }) => <AppTextField label="Montant" value={String(field.value ?? '')} onChangeText={field.onChange as any} keyboardType="numeric" error={errors.amount?.message} />} />
        <Controller name="currency" control={control} render={({ field }) => <AppTextField label="Devise" value={field.value} onChangeText={field.onChange} error={errors.currency?.message} />} />
        <Controller name="status" control={control} render={({ field }) => <AppTextField label="Statut (Reçu / Déposé / Payé / Rejeté / Annulé / En retard)" value={field.value} onChangeText={field.onChange} error={errors.status?.message} />} />
        <Controller name="issueDate" control={control} render={({ field }) => <AppTextField label="Date d'émission (YYYY-MM-DD)" value={field.value || ''} onChangeText={field.onChange} error={errors.issueDate?.message} />} />
        <Controller name="dueDate" control={control} render={({ field }) => <AppTextField label="Échéance (YYYY-MM-DD)" value={field.value || ''} onChangeText={field.onChange} error={errors.dueDate?.message} />} />
        <Pressable style={styles.button} onPress={handleSubmit(async (values) => {
          const payload = {
            ...values,
            referenceNumber: buildPaymentItemReference(values.type, values.direction),
          };

          if (current) {
            await updateMutation.mutateAsync({ id: current.id, payload: payload as any });
          } else {
            await createMutation.mutateAsync(payload as any);
          }
          navigation.goBack();
        })}>
          <Text style={styles.buttonText}>Enregistrer</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16
  },
  button: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

