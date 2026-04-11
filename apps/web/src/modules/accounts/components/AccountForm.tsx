import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountFormValues, accountSchema } from '@/modules/accounts/schemas/account.schema';
import { Bank, Client } from '@/types/domain';

interface AccountFormProps {
  defaultValues?: Partial<AccountFormValues>;
  banks: Bank[];
  clients: Client[];
  loading?: boolean;
  onSubmit: (values: AccountFormValues) => void | Promise<void>;
}

export function AccountForm({ defaultValues, banks, clients, loading, onSubmit }: AccountFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      label: '',
      accountNumber: '',
      rib: '',
      iban: '',
      balance: 0,
      currency: 'TND',
      bank: undefined,
      client: undefined,
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
        <Grid item xs={12} md={6}>
          <Controller name="accountNumber" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Numéro de compte" error={!!errors.accountNumber} helperText={errors.accountNumber?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="rib" control={control} render={({ field }) => <TextField {...field} fullWidth label="RIB" />} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="iban" control={control} render={({ field }) => <TextField {...field} fullWidth label="IBAN" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="balance" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Solde" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} />
          )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="currency" control={control} render={({ field }) => <TextField {...field} fullWidth label="Devise" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="bank" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Banque" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
              <MenuItem value="">Aucune</MenuItem>
              {banks.map((bank) => <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>)}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="client" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Client" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
              <MenuItem value="">Aucun</MenuItem>
              {clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        </Grid>
      </Grid>
    </form>
  );
}

