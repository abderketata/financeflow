import { Button, Grid, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bankSchema, BankFormValues } from '@/modules/banks/schemas/bank.schema';

interface BankFormProps {
  defaultValues?: Partial<BankFormValues>;
  loading?: boolean;
  onSubmit: (values: BankFormValues) => void | Promise<void>;
}

export function BankForm({ defaultValues, loading, onSubmit }: BankFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: '',
      code: '',
      swiftCode: '',
      notes: '',
      ...defaultValues
    }
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="name" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Nom de la banque" error={!!errors.name} helperText={errors.name?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="code" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Code banque" />
          )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="swiftCode" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Code SWIFT" />
          )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="notes" control={control} render={({ field }) => (
            <TextField {...field} fullWidth multiline rows={4} label="Notes" />
          )} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        </Grid>
      </Grid>
    </form>
  );
}

