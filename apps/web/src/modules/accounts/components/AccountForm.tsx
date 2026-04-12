import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountFormValues, accountSchema } from '@/modules/accounts/schemas/account.schema';
import { formatAccountNumber, formatIban, normalizeRib } from '@/modules/accounts/utils/accountFields';
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
    <form onSubmit={handleSubmit(
      (values) => onSubmit(values),
      (validationErrors) => {
        const firstKey = Object.keys(validationErrors)[0];
        if (!firstKey) return;
        const el = document.querySelector<HTMLInputElement>(`[name="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => el.focus(), 300);
        }
      },
    )}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="label" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Libellé" error={!!errors.label} helperText={errors.label?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="accountNumber" control={control} render={({ field }) => (
            <TextField
              {...field}
              value={formatAccountNumber(field.value)}
              onChange={(event) => field.onChange(formatAccountNumber(event.target.value))}
              fullWidth
              label="Numéro de compte"
              error={!!errors.accountNumber}
              helperText={errors.accountNumber?.message || `${field.value?.replace(/\s/g, '').length || 0}/34`}
              inputProps={{ inputMode: 'numeric', maxLength: 42 }}
            />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="rib" control={control} render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(normalizeRib(event.target.value))}
              fullWidth
              label="RIB"
              error={!!errors.rib}
              helperText={errors.rib?.message || `Optionnel — ${field.value?.length || 0}/8 chiffres`}
              inputProps={{ inputMode: 'numeric', maxLength: 8 }}
            />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="iban" control={control} render={({ field }) => (
            <TextField
              {...field}
              value={formatIban(field.value)}
              onChange={(event) => field.onChange(formatIban(event.target.value))}
              fullWidth
              label="IBAN"
              error={!!errors.iban}
              helperText={errors.iban?.message || `Optionnel — ${field.value?.replace(/\s/g, '').length || 0}/24`}
              inputProps={{ maxLength: 29 }}
            />
          )} />
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

