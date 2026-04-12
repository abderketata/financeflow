import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import NumbersRoundedIcon from '@mui/icons-material/NumbersRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { Box, Button, Divider, Grid, InputAdornment, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { brandColors, headingFont } from '@/app/theme';
import { AccountFormValues, accountSchema } from '@/modules/accounts/schemas/account.schema';
import { formatAccountNumber, formatIban, normalizeRib } from '@/modules/accounts/utils/accountFields';
import { Bank, Client } from '@/types/domain';

interface AccountFormProps {
  defaultValues?: Partial<AccountFormValues>;
  banks: Bank[];
  clients: Client[];
  clientsLoading?: boolean;
  loading?: boolean;
  onSubmit: (values: AccountFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

export function AccountForm({ defaultValues, banks, clients, clientsLoading, loading, onSubmit, onCancel }: AccountFormProps) {
  const resolvedDefaultValues = useMemo(() => ({
    label: '',
    accountNumber: '',
    rib: '',
    iban: '',
    balance: 0,
    currency: 'TND',
    bank: undefined,
    client: undefined,
    ...defaultValues,
  }), [defaultValues]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: resolvedDefaultValues,
  });

  useEffect(() => {
    reset(resolvedDefaultValues);
  }, [reset, resolvedDefaultValues]);

  const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

  const sectionSx = {
    borderRadius: 3,
    border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
    backgroundColor: '#FFFFFF',
    p: { xs: 2, md: 2.25 },
  } as const;

  const sectionTitleSx = {
    fontFamily: headingFont,
    fontWeight: 700,
    fontSize: '0.96rem',
    color: 'text.primary',
    letterSpacing: '-0.01em',
  } as const;

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
      <Stack spacing={2.25} sx={{ mt: 0.5 }}>
        <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1.1}>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={sectionTitleSx}>Informations générales</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                Identité métier du compte et rattachements principaux.
              </Typography>
            </Box>
            <Divider />
            <Grid container spacing={1.5} columns={12}>
              <Grid item xs={12} md={6}>
                <Controller name="label" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Libellé"
                    placeholder="Ex. Compte principal exploitation"
                    error={!!errors.label}
                    helperText={errors.label?.message || 'Nom utilisé dans les listes et sélections'}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LabelRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller name="bank" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Banque"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><AccountBalanceRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  >
                    <MenuItem value="">Aucune</MenuItem>
                    {banks.map((bank) => <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller name="client" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Client"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    disabled={clientsLoading}
                    helperText={clientsLoading ? 'Chargement des clients...' : 'Optionnel'}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    {clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
            </Grid>
          </Stack>
        </Box>

        <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1.1}>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={sectionTitleSx}>Références bancaires</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                Numéro, IBAN, RIB et devise du compte bancaire.
              </Typography>
            </Box>
            <Divider />
            <Grid container spacing={1.5} columns={12}>
              <Grid item xs={12} md={6}>
                <Controller name="accountNumber" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    value={formatAccountNumber(field.value)}
                    onChange={(event) => field.onChange(formatAccountNumber(event.target.value))}
                    fullWidth
                    label="Numéro de compte"
                    placeholder="Ex. 0012 3456 7890"
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber?.message || `${field.value?.replace(/\s/g, '').length || 0}/34`}
                    inputProps={{ inputMode: 'numeric', maxLength: 42 }}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><NumbersRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="currency" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Devise"
                    placeholder="TND"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CurrencyExchangeRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
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
                    placeholder="Ex. TN59 4010 1234 5678 9000 0000"
                    error={!!errors.iban}
                    helperText={errors.iban?.message || `Optionnel — ${field.value?.replace(/\s/g, '').length || 0}/24`}
                    inputProps={{ maxLength: 29 }}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><BadgeRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
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
                    placeholder="Ex. 00778012"
                    error={!!errors.rib}
                    helperText={errors.rib?.message || `Optionnel — ${field.value?.length || 0}/8 chiffres`}
                    inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><BadgeRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  />
                )} />
              </Grid>
            </Grid>
          </Stack>
        </Box>

        <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1.1}>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={sectionTitleSx}>Pilotage financier</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                Point d’entrée financier utilisé pour le suivi du compte.
              </Typography>
            </Box>
            <Divider />
            <Grid container spacing={1.5} columns={12}>
              <Grid item xs={12} md={6}>
                <Controller name="balance" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Solde courant"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SavingsRoundedIcon sx={inputIconSx} /></InputAdornment>,
                    }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    height: '100%',
                    p: 1.5,
                    borderRadius: 2.5,
                    border: `1px dashed ${alpha(brandColors.slate[300], 0.9)}`,
                    backgroundColor: alpha(brandColors.slate[100], 0.55),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ color: brandColors.blue[600] }}>
                    <AccountBalanceWalletRoundedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.88rem' }}>
                      Compte prêt pour le pilotage
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.2 }}>
                      La banque et le client restent optionnels pour laisser de la souplesse métier.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={1.2}>
          <Button variant="outlined" color="inherit" sx={{ minWidth: 110, fontWeight: 500 }} disabled={loading} onClick={() => onCancel ? onCancel() : undefined}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 170, fontWeight: 700, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le compte'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

