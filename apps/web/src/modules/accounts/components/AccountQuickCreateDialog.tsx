import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bank } from '@/types/domain';
import { brandColors, headingFont, iconBox, numericFont } from '@/app/theme';
import {
  formatAccountNumber,
  formatIban,
  isValidAccountNumber,
  isValidIban,
  isValidRib,
  normalizeAccountNumber,
  normalizeIban,
  normalizeRib,
} from '@/modules/accounts/utils/accountFields';

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

const quickAccountSchema = z.object({
  label: z.string().trim().min(3, 'Le libellé doit contenir au moins 3 caractères').max(100, 'Le libellé ne doit pas dépasser 100 caractères'),
  accountNumber: z
    .string()
    .min(1, 'Le numéro de compte est requis')
    .transform((v) => normalizeAccountNumber(v))
    .refine((v) => isValidAccountNumber(v), 'Le numéro de compte doit contenir entre 8 et 34 chiffres'),
  iban: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeIban(v))
    .refine((v) => isValidIban(v), 'IBAN tunisien invalide : il doit contenir 24 caractères'),
  rib: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeRib(v))
    .refine((v) => isValidRib(v), 'RIB invalide : il doit contenir exactement 8 chiffres'),
  currency: z.string().trim().min(1, 'La devise est requise'),
  openingBalance: z.coerce.number().min(0, 'Le solde initial doit être positif ou nul').default(0),
  currentBalance: z.coerce.number().min(0, 'Le solde courant doit être positif ou nul').default(0),
  isActive: z.boolean().default(true),
  bank: z.coerce.number({ required_error: 'Veuillez sélectionner une banque' }).min(1, 'Veuillez sélectionner une banque'),
});

type QuickAccountFormValues = z.infer<typeof quickAccountSchema>;

interface AccountQuickCreateDialogProps {
  open: boolean;
  banks?: Bank[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: QuickAccountFormValues) => void | Promise<void>;
}

const bankFilterOptions = createFilterOptions<Bank>({
  stringify: (option) => `${option.code ?? ''} ${option.name ?? ''}`,
  ignoreCase: true,
  trim: true,
});

export function AccountQuickCreateDialog({
  open,
  banks = [],
  loading,
  onClose,
  onSubmit,
}: AccountQuickCreateDialogProps) {
  const [validationAlert, setValidationAlert] = useState('');
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickAccountFormValues>({
    resolver: zodResolver(quickAccountSchema),
    defaultValues: {
      label: '',
      accountNumber: '',
      iban: '',
      rib: '',
      currency: 'TND',
      openingBalance: 0,
      currentBalance: 0,
      isActive: true,
      bank: undefined,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (values: QuickAccountFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" TransitionProps={{ timeout: 250 }}>
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${brandColors.blue[600]}, ${brandColors.blue[400]}, ${alpha(brandColors.blue[300], 0.2)})`,
        }}
      />
      <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={iconBox(brandColors.blue[600], 36)}>
              <AccountBalanceRoundedIcon sx={{ fontSize: '1.1rem' }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: headingFont,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                }}
              >
                Nouveau compte bancaire
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.15 }}>
                Créez rapidement un compte qui sera associé au client.
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: brandColors.slate[400],
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: brandColors.slate[600],
                backgroundColor: alpha(brandColors.slate[200], 0.3),
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <form onSubmit={handleSubmit(handleFormSubmit, (validationErrors) => {
        const firstKey = Object.keys(validationErrors)[0];
        if (firstKey) {
          const msg = (validationErrors as any)[firstKey]?.message || 'Champ invalide';
          setValidationAlert(msg);
          const el = document.querySelector<HTMLInputElement>(`[name="${firstKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => el.focus(), 300);
          }
        }
      })} autoComplete="off">
        <DialogContent sx={{ pt: '20px !important', pb: '12px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Libellé *"
                    placeholder="Ex. Compte courant"
                    error={!!errors.label}
                    helperText={errors.label?.message}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LabelRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={formatAccountNumber(field.value)}
                    onChange={(e) => field.onChange(formatAccountNumber(e.target.value))}
                    fullWidth
                    label="Numéro de compte *"
                    placeholder="Ex. 0012 3456 789"
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber?.message || `${field.value?.replace(/\s/g, '').length || 0}/34`}
                    InputProps={{ startAdornment: <InputAdornment position="start"><TagRoundedIcon sx={inputIconSx} /></InputAdornment>, sx: { fontFamily: numericFont } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="iban"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={formatIban(field.value)}
                    onChange={(e) => field.onChange(formatIban(e.target.value))}
                    fullWidth
                    label="IBAN"
                    placeholder="Ex. TN59 4010 1234 5678 9000 0000"
                    error={!!errors.iban}
                    helperText={errors.iban?.message || `Optionnel — ${field.value?.replace(/\s/g, '').length || 0}/24`}
                    InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionRoundedIcon sx={inputIconSx} /></InputAdornment>, sx: { fontFamily: numericFont } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="rib"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => {
                      field.onChange(normalizeRib(e.target.value));
                    }}
                    fullWidth
                    label="RIB"
                    placeholder="Ex. 00778012"
                    error={!!errors.rib}
                    helperText={errors.rib?.message || `Optionnel — ${field.value?.length || 0}/8 chiffres`}
                    inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionRoundedIcon sx={inputIconSx} /></InputAdornment>, sx: { fontFamily: numericFont } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Devise *"
                    placeholder="TND"
                    error={!!errors.currency}
                    helperText={errors.currency?.message}
                    InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyExchangeRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="openingBalance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Solde initial"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(e.target.value)}
                    InputProps={{ sx: { fontFamily: numericFont }, startAdornment: <InputAdornment position="start"><AccountBalanceWalletRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                    error={!!errors.openingBalance}
                    helperText={errors.openingBalance?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="currentBalance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Solde courant"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(e.target.value)}
                    InputProps={{ sx: { fontFamily: numericFont }, startAdornment: <InputAdornment position="start"><SavingsRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                    error={!!errors.currentBalance}
                    helperText={errors.currentBalance?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="bank"
                control={control}
                render={({ field }) => {
                  const selectedBank = banks.find((b) => b.id === field.value) ?? null;
                  return (
                    <Autocomplete
                      value={selectedBank}
                      onChange={(_, newValue) => field.onChange(newValue?.id ?? undefined)}
                      options={banks}
                      filterOptions={bankFilterOptions}
                      getOptionLabel={(option) =>
                        option.code ? `${option.code} — ${option.name}` : option.name
                      }
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText="Aucune banque trouvée"
                      openText="Ouvrir"
                      clearText="Effacer"
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(brandColors.blue[500], 0.08),
                                color: brandColors.blue[600],
                                flexShrink: 0,
                              }}
                            >
                              <AccountBalanceRoundedIcon sx={{ fontSize: 15 }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: brandColors.slate[700] }} noWrap>
                                {option.code ? `${option.code} — ${option.name}` : option.name}
                              </Typography>
                              {option.swiftCode && (
                                <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                                  SWIFT : {option.swiftCode}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Banque *"
                          placeholder="Rechercher une banque…"
                          error={!!errors.bank}
                          helperText={errors.bank?.message}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <SearchRoundedIcon sx={{ fontSize: 18, color: brandColors.slate[400], ml: 0.3, mr: 0.5 }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      ListboxProps={{
                        sx: {
                          maxHeight: 220,
                          '& .MuiAutocomplete-option': {
                            py: 1,
                            px: 1.5,
                            borderRadius: '8px',
                            mx: 0.5,
                            my: 0.2,
                            transition: 'background 0.15s ease',
                          },
                        },
                      }}
                    />
                  );
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      px: 1.5,
                      py: 1,
                      borderRadius: '10px',
                      border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                      backgroundColor: field.value ? alpha(brandColors.credit, 0.03) : alpha(brandColors.slate[100], 0.5),
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: field.value ? brandColors.credit : brandColors.slate[400],
                          transition: 'background-color 0.2s ease',
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: field.value ? brandColors.slate[700] : brandColors.slate[500],
                        }}
                      >
                        {field.value ? 'Compte actif' : 'Compte inactif'}
                      </Typography>
                    </Stack>
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                      size="small"
                    />
                  </Box>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider sx={{ mx: 3 }} />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer le compte'}
          </Button>
        </DialogActions>
      </form>
      <Snackbar
        open={!!validationAlert}
        autoHideDuration={4000}
        onClose={() => setValidationAlert('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setValidationAlert('')} sx={{ width: '100%' }}>
          {validationAlert}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

