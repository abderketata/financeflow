import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreateTransaction, useUpdateTransaction } from '@/modules/transactions/hooks/useTransactions';
import { transactionSchema, TransactionFormValues } from '@/modules/transactions/schemas/transaction.schema';
import { MobileStackParamList } from '@/navigation/types';

export function TransactionFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'TransactionForm'>) {
  const current = route.params?.transaction;
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const { control, handleSubmit, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      label: current?.label || '',
      operationType: current?.operationType || 'DEBIT',
      amount: current?.amount || 0,
      operationDate: current?.operationDate ? current.operationDate.slice(0, 10) : ''
    }
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{current ? 'Modifier opération' : 'Nouvelle opération'}</Text>
        <Controller name="label" control={control} render={({ field }) => <AppTextField label="Libellé" value={field.value} onChangeText={field.onChange} error={errors.label?.message} />} />
        <Controller name="operationType" control={control} render={({ field }) => <AppTextField label="Type (DEBIT / CREDIT)" value={field.value} onChangeText={field.onChange} error={errors.operationType?.message} />} />
        <Controller name="amount" control={control} render={({ field }) => <AppTextField label="Montant" value={String(field.value ?? '')} onChangeText={field.onChange as any} keyboardType="numeric" error={errors.amount?.message} />} />
        <Controller name="operationDate" control={control} render={({ field }) => <AppTextField label="Date (YYYY-MM-DD)" value={field.value} onChangeText={field.onChange} error={errors.operationDate?.message} />} />
        <Pressable style={styles.button} onPress={handleSubmit(async (values) => {
          if (current) {
            await updateMutation.mutateAsync({ id: current.id, payload: values as any });
          } else {
            await createMutation.mutateAsync(values as any);
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

