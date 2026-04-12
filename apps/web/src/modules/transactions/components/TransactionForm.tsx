import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionFormValues } from '@/modules/transactions/schemas/transaction.schema';
import { BankAccount, Client, PaymentItem } from '@/types/domain';

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormValues>;
  clients: Client[];
  accounts: BankAccount[];
  paymentItems: PaymentItem[];
  clientsLoading?: boolean;
  accountsLoading?: boolean;
  paymentItemsLoading?: boolean;
  loading?: boolean;
  onSubmit: (values: TransactionFormValues) => void | Promise<void>;
}

export function TransactionForm({ defaultValues, clients, accounts, paymentItems, clientsLoading, accountsLoading, paymentItemsLoading, loading, onSubmit }: TransactionFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      label: '',
      operationType: 'DEBIT',
      amount: 0,
      operationDate: '',
      notes: '',
      client: undefined,
      bankAccount: undefined,
      paymentItem: undefined,
      ...defaultValues
    }
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="label" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Libellé" error={!!errors.label} helperText={errors.label?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="operationType" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Type opération">
              <MenuItem value="DEBIT">Débit</MenuItem>
              <MenuItem value="CREDIT">Crédit</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="amount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Montant" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} error={!!errors.amount} helperText={errors.amount?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="operationDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Date opération" InputLabelProps={{ shrink: true }} error={!!errors.operationDate} helperText={errors.operationDate?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="client" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Client" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={clientsLoading} helperText={clientsLoading ? 'Chargement des clients...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="bankAccount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Compte bancaire" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={accountsLoading} helperText={accountsLoading ? 'Chargement des comptes...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {accounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.label}</MenuItem>)}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="paymentItem" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Chèque / Traite lié" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={paymentItemsLoading} helperText={paymentItemsLoading ? 'Chargement des paiements...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {paymentItems.map((paymentItem) => <MenuItem key={paymentItem.id} value={paymentItem.id}>{paymentItem.reference}</MenuItem>)}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="notes" control={control} render={({ field }) => <TextField {...field} fullWidth multiline rows={4} label="Notes" />} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        </Grid>
      </Grid>
    </form>
  );
}

