import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { Box, Button, Grid, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsFormValues, settingsSchema } from '@/modules/settings/schemas/settings.schema';
import { brandColors } from '@/app/theme';

const currencyOptions = [
  { value: 'TND', label: 'Dinar Tunisien (TND)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' },
  { value: 'GBP', label: 'Livre Sterling (GBP)' },
  { value: 'MAD', label: 'Dirham Marocain (MAD)' },
  { value: 'DZD', label: 'Dinar Algérien (DZD)' },
];

const weekStartOptions = [
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'SUNDAY', label: 'Dimanche' },
];

interface SettingsFormProps {
  defaultValues?: Partial<SettingsFormValues>;
  loading?: boolean;
  onSubmit: (values: SettingsFormValues) => void | Promise<void>;
}

export function SettingsForm({ defaultValues, loading, onSubmit }: SettingsFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      defaultCurrency: 'TND',
      defaultAlertDays: 3,
      weekStartsOn: 'MONDAY',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Grid container spacing={2.5}>
        {/* Nom de la société */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(brandColors.blue[500], 0.08),
                color: brandColors.blue[600],
              }}
            >
              <BusinessRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
              Nom de la société
            </Typography>
          </Stack>
          <Controller
            name="companyName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                placeholder="Ex: CRM Finance Société"
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
              />
            )}
          />
        </Grid>

        {/* Devise par défaut */}
        <Grid item xs={12} md={4}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(brandColors.credit, 0.08),
                color: brandColors.credit,
              }}
            >
              <AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
              Devise par défaut
            </Typography>
          </Stack>
          <Controller
            name="defaultCurrency"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                size="small"
                error={!!errors.defaultCurrency}
                helperText={errors.defaultCurrency?.message}
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Jours avant échéance */}
        <Grid item xs={12} md={4}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(brandColors.warning, 0.08),
                color: brandColors.warning,
              }}
            >
              <NotificationsActiveRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
              Jours avant échéance
            </Typography>
          </Stack>
          <Controller
            name="defaultAlertDays"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                size="small"
                placeholder="Ex: 3"
                inputProps={{ min: 0, max: 30 }}
                onChange={(e) => field.onChange(Number(e.target.value))}
                error={!!errors.defaultAlertDays}
                helperText={errors.defaultAlertDays?.message}
              />
            )}
          />
        </Grid>

        {/* Début de semaine */}
        <Grid item xs={12} md={4}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(brandColors.alert, 0.08),
                color: brandColors.alert,
              }}
            >
              <CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
              Début de semaine
            </Typography>
          </Stack>
          <Controller
            name="weekStartsOn"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                size="small"
              >
                {weekStartOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Bouton Enregistrer */}
        <Grid item xs={12}>
          <Box sx={{ pt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<SaveRoundedIcon />}
              sx={{ minWidth: 180 }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
}

