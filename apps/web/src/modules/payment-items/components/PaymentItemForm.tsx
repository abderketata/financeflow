import { useEffect } from 'react';
import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import {
  getPaymentItemAccountPrimary,
  getPaymentItemAccountSecondary,
  getPaymentItemClientPrimary,
  getPaymentItemClientSecondary,
  paymentItemStatusOptions,
  paymentItemTypeOptions,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { BankAccount, Client } from '@/types/domain';

interface PaymentItemFormProps {
  defaultValues?: Partial<PaymentItemFormValues>;
  defaultCurrency?: string;
  defaultAlertDays?: number;
  clients: Client[];
  accounts: BankAccount[];
  companyName: string;
  clientsLoading?: boolean;
  accountsLoading?: boolean;
  loading?: boolean;
  onSubmit: (values: PaymentItemFormValues) => void | Promise<void>;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentItemForm({ defaultValues, defaultCurrency = 'TND', defaultAlertDays = 3, clients, accounts, companyName, clientsLoading, accountsLoading, loading, onSubmit }: PaymentItemFormProps) {
  const isEditMode = Boolean(defaultValues);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      type: 'CHEQUE',
      direction: 'IN',
      amount: 0,
      currency: defaultCurrency,
      status: 'Reçu',
      issueDate: isEditMode ? (defaultValues?.issueDate || '') : getTodayISO(),
      dueDate: '',
      drawer: '',
      drawee: '',
      alertEnabled: true,
      alertDaysBefore: isEditMode
        ? (defaultValues?.alertDaysBefore ?? defaultAlertDays)
        : defaultAlertDays,
      notes: '',
      client: undefined,
      account: undefined,
      ...defaultValues
    }
  });

  const watchedDirection = watch('direction');
  const watchedClientId = watch('client');

  useEffect(() => {
    const selectedClient = clients.find((c) => c.id === Number(watchedClientId));
    const clientLabel = selectedClient
      ? (selectedClient.companyName?.trim() || selectedClient.fullName?.trim() || selectedClient.name?.trim() || '')
      : '';
    const company = companyName || '';

    if (watchedDirection === 'IN') {
      setValue('drawer', company);
      setValue('drawee', clientLabel);
    } else {
      setValue('drawer', clientLabel);
      setValue('drawee', company);
    }
  }, [watchedDirection, watchedClientId, clients, companyName, setValue]);

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="client" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Client" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={clientsLoading} helperText={clientsLoading ? 'Chargement des clients...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {getPaymentItemClientPrimary(client)}{getPaymentItemClientSecondary(client) ? ` — ${getPaymentItemClientSecondary(client)}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="account" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Compte" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)} disabled={accountsLoading} helperText={accountsLoading ? 'Chargement des comptes...' : undefined}>
              <MenuItem value="">Aucun</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {getPaymentItemAccountPrimary(account)}{getPaymentItemAccountSecondary(account) ? ` — ${getPaymentItemAccountSecondary(account)}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="type" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Type">
              {paymentItemTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
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
        <Grid item xs={12} md={5}>
          <Controller name="amount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Montant" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} error={!!errors.amount} helperText={errors.amount?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Controller name="currency" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Devise" error={!!errors.currency} helperText={errors.currency?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="status" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Statut" error={!!errors.status} helperText={errors.status?.message}>
              {paymentItemStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="issueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Date d'émission" InputLabelProps={{ shrink: true }} />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="dueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Échéance" InputLabelProps={{ shrink: true }} error={!!errors.dueDate} helperText={errors.dueDate?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="alertEnabled" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Alertes" value={field.value ? 'true' : 'false'} onChange={(e) => field.onChange(e.target.value === 'true')}>
              <MenuItem value="true">Activées</MenuItem>
              <MenuItem value="false">Désactivées</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="alertDaysBefore" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Jours avant alerte" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} error={!!errors.alertDaysBefore} helperText={errors.alertDaysBefore?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="drawer" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Tireur" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { backgroundColor: '#f8fafc', color: '#475569' } }} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="drawee" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Tiré" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { backgroundColor: '#f8fafc', color: '#475569' } }} />
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
