import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { brandColors, headingFont, iconBox } from '@/app/theme';
import { normalizeClientIdentityNumber, isValidClientIdentityNumber } from '@/modules/clients/utils/identityNumber';
import { normalizeClientTaxNumber, isValidClientTaxNumber, formatClientTaxNumber, CLIENT_TAX_NUMBER_PLACEHOLDER } from '@/modules/clients/utils/taxNumber';

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;
const CLIENT_PHONE_PLACEHOLDER = '99 999 999';

const quickClientSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  fullName: z.string().trim().min(1, 'Le nom complet est requis'),
  companyName: z.string().trim().optional().default(''),
  phone: z
    .string({ required_error: 'Le téléphone est obligatoire' })
    .min(1, 'Le téléphone est obligatoire')
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'Le numéro doit contenir 8 chiffres')),
  address: z.string().trim().optional().default(''),
  identityNumber: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeClientIdentityNumber(v))
    .refine(
      (v) => v === '' || isValidClientIdentityNumber(v),
      'Le numéro identifiant doit contenir exactement 8 chiffres',
    ),
  taxNumber: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeClientTaxNumber(v))
    .refine(
      (v) => v === '' || isValidClientTaxNumber(v),
      'Le matricule fiscal doit respecter le format 1234567A B000',
    ),
}).refine(
  (v) => v.type !== 'COMPANY' || (v.companyName && v.companyName.length > 0),
  { message: 'La raison sociale est requise pour une société', path: ['companyName'] },
);

export type QuickClientFormValues = z.infer<typeof quickClientSchema>;

interface ClientQuickCreateDialogProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: QuickClientFormValues) => void | Promise<void>;
}

export function ClientQuickCreateDialog({ open, loading, onClose, onSubmit }: ClientQuickCreateDialogProps) {
  const [validationAlert, setValidationAlert] = useState('');
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<QuickClientFormValues>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: { type: 'INDIVIDUAL', fullName: '', companyName: '', phone: '', address: '', identityNumber: '', taxNumber: '' },
  });

  const clientType = watch('type');

  const handleClose = () => { reset(); onClose(); };

  const handleFormSubmit = async (values: QuickClientFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" TransitionProps={{ timeout: 250 }}>
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${brandColors.blue[600]}, ${brandColors.blue[400]}, ${alpha(brandColors.blue[300], 0.2)})` }} />
      <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={iconBox(brandColors.blue[600], 36)}>
              <PersonRoundedIcon sx={{ fontSize: '1.1rem' }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', letterSpacing: '-0.01em' }}>
                Nouveau client
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.15 }}>
                Créez rapidement un client à associer au compte.
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} size="small" sx={{ color: brandColors.slate[400], borderRadius: '10px', '&:hover': { color: brandColors.slate[600], backgroundColor: alpha(brandColors.slate[200], 0.3) } }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <form
        onSubmit={handleSubmit(handleFormSubmit, (validationErrors) => {
          const firstKey = Object.keys(validationErrors)[0];
          if (firstKey) {
            setValidationAlert((validationErrors as any)[firstKey]?.message || 'Champ invalide');
            const el = document.querySelector<HTMLInputElement>(`[name="${firstKey}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => el.focus(), 300);
            }
          }
        })}
        autoComplete="off"
      >
        <DialogContent sx={{ pt: '20px !important', pb: '12px !important' }}>
          <Grid container spacing={2}>
            {/* 1. Nom complet */}
            <Grid item xs={12} md={6}>
              <Controller name="fullName" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nom complet"
                  placeholder="Ex. Foulen Ben Foulen"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message || 'Utilisé pour générer automatiquement le code client'}
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
            {/* 2. Société */}
            <Grid item xs={12} md={6}>
              <Controller name="companyName" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Société"
                  placeholder="Ex. Flux Financier SARL"
                  error={!!errors.companyName}
                  helperText={errors.companyName?.message || (clientType === 'COMPANY' ? 'Champ recommandé pour une société' : 'Optionnel pour un particulier')}
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start"><BusinessRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
            {/* 3. Type */}
            <Grid item xs={12} md={6}>
              <Controller name="type" control={control} render={({ field }) => (
                <TextField {...field} fullWidth select label="Type" size="small" error={!!errors.type} helperText={errors.type?.message}>
                  <MenuItem value="INDIVIDUAL">Particulier</MenuItem>
                  <MenuItem value="COMPANY">Société</MenuItem>
                </TextField>
              )} />
            </Grid>
            {/* 4. Téléphone */}
            <Grid item xs={12} md={6}>
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                    const formatted = digits.length > 5
                      ? `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
                      : digits.length > 2
                        ? `${digits.slice(0, 2)} ${digits.slice(2)}`
                        : digits;
                    field.onChange(formatted);
                  }}
                  fullWidth
                  label="Téléphone"
                  placeholder={CLIENT_PHONE_PLACEHOLDER}
                  error={!!errors.phone}
                  helperText={errors.phone?.message || 'Obligatoire — format : XX XXX XXX'}
                  size="small"
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
            {/* 5. Adresse */}
            <Grid item xs={12}>
              <Controller name="address" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Adresse"
                  placeholder="Adresse postale complète"
                  multiline
                  rows={2}
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><LocationOnRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
            {/* 6. CIN / Identifiant */}
            <Grid item xs={12} md={6}>
              <Controller name="identityNumber" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(normalizeClientIdentityNumber(e.target.value))}
                  fullWidth
                  label="Numéro identifiant"
                  placeholder="12345678"
                  error={!!errors.identityNumber}
                  helperText={errors.identityNumber?.message || 'Optionnel — 8 chiffres'}
                  size="small"
                  inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
            {/* 7. Matricule fiscal */}
            <Grid item xs={12} md={6}>
              <Controller name="taxNumber" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(formatClientTaxNumber(e.target.value))}
                  fullWidth
                  label="Matricule fiscal"
                  placeholder={CLIENT_TAX_NUMBER_PLACEHOLDER}
                  error={!!errors.taxNumber}
                  helperText={errors.taxNumber?.message || 'Format : 1234567A B000'}
                  size="small"
                  inputProps={{ maxLength: 13 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                />
              )} />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider sx={{ mx: 3 }} />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={handleClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Créer le client'}
          </Button>
        </DialogActions>
      </form>
      <Snackbar open={!!validationAlert} autoHideDuration={4000} onClose={() => setValidationAlert('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="warning" variant="filled" onClose={() => setValidationAlert('')} sx={{ width: '100%' }}>{validationAlert}</Alert>
      </Snackbar>
    </Dialog>
  );
}
