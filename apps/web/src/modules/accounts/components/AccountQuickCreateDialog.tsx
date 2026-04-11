import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bank } from '@/types/domain';
import { brandColors, headingFont, iconBox, numericFont } from '@/app/theme';

const quickAccountSchema = z.object({
  label: z.string().trim().min(1, 'Le libellé du compte est requis'),
  accountNumber: z.string().trim().min(1, 'Le numéro de compte est requis'),
  iban: z.string().optional().default(''),
  rib: z.string().optional().default(''),
  currency: z.string().trim().min(1, 'La devise est requise'),
  openingBalance: z.coerce.number().default(0),
  currentBalance: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  bank: z.coerce.number({ required_error: 'La banque est requise' }).min(1, 'La banque est requise'),
});

type QuickAccountFormValues = z.infer<typeof quickAccountSchema>;

interface AccountQuickCreateDialogProps {
  open: boolean;
  banks?: Bank[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: QuickAccountFormValues) => void | Promise<void>;
}

export function AccountQuickCreateDialog({
  open,
  banks = [],
  loading,
  onClose,
  onSubmit,
}: AccountQuickCreateDialogProps) {
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" TransitionProps={{ timeout: 250 }}>
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
      <form onSubmit={handleSubmit(handleFormSubmit)}>
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
                    fullWidth
                    label="Numéro de compte *"
                    placeholder="Ex. 001-234567-89"
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="iban"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="IBAN" placeholder="Ex. MA76..." />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="rib"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="RIB" placeholder="Ex. 007 780..." />
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
                    InputProps={{ sx: { fontFamily: numericFont } }}
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
                    InputProps={{ sx: { fontFamily: numericFont } }}
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
                      getOptionLabel={(option) => option.name}
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
                              <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: brandColors.slate[700] }} noWrap>
                                {option.name}
                              </Typography>
                              {option.code && (
                                <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                                  {option.code}
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
    </Dialog>
  );
}

