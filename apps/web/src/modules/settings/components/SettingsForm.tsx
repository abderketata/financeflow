import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsFormValues, settingsSchema } from '@/modules/settings/schemas/settings.schema';

interface SettingsFormProps {
  defaultValues?: Partial<SettingsFormValues>;
  loading?: boolean;
  onSubmit: (values: SettingsFormValues) => void | Promise<void>;
}

export function SettingsForm({ defaultValues, loading, onSubmit }: SettingsFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: 'TND',
      alertDaysBefore: 3,
      weekStartsOn: 1,
      locale: 'fr-FR',
      ...defaultValues
    }
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Controller name="currency" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Devise" error={!!errors.currency} helperText={errors.currency?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="alertDaysBefore" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Jours avant échéance" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} error={!!errors.alertDaysBefore} helperText={errors.alertDaysBefore?.message} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="weekStartsOn" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Début de semaine" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) as 0 | 1)}>
              <MenuItem value={1}>Lundi</MenuItem>
              <MenuItem value={0}>Dimanche</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="locale" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Locale" error={!!errors.locale} helperText={errors.locale?.message} />
          )} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        </Grid>
      </Grid>
    </form>
  );
}

