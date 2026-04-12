import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import { BankAccount, Client } from '@/types/domain';

interface PaymentItemFormProps {
  defaultValues?: Partial<PaymentItemFormValues>;
  clients: Client[];
  accounts: BankAccount[];
  clientsLoading?: boolean;
  accountsLoading?: boolean;
  loading?: boolean;
  onSubmit: (values: PaymentItemFormValues) => void | Promise<void>;
}

export function PaymentItemForm({ defaultValues, clients, accounts, clientsLoading, accountsLoading, loading, onSubmit }: PaymentItemFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      reference: '',
      type: 'CHEQUE',
      direction: 'IN',
      amount: 0,
      status: 'PENDING',
      dueDate: '',
      issueDate: '',
      notes: '',
      client: undefined,
      bankAccount: undefined,
      ...defaultValues
    }
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="reference" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Référence" error={!!errors.reference} helperText={errors.reference?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="type" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Type">
              <MenuItem value="CHEQUE">Chèque</MenuItem>
              <MenuItem value="TRAITE">Traite</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="direction" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Sens">
              <MenuItem value="IN">Entrant</MenuItem>
              <MenuItem value="OUT">Sortant</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="amount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Montant" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} error={!!errors.amount} helperText={errors.amount?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="status" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Statut" />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="dueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Échéance" InputLabelProps={{ shrink: true }} error={!!errors.dueDate} helperText={errors.dueDate?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="issueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Date d'émission" InputLabelProps={{ shrink: true }} />
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
        <Grid item xs={12}>
          <Controller name="bankAccount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Compte bancaire" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={accountsLoading} helperText={accountsLoading ? 'Chargement des comptes...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {accounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.label}</MenuItem>)}
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

