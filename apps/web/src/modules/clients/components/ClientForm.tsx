import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormValues } from '@/modules/clients/schemas/client.schema';
import { brandColors, headingFont, iconBox } from '@/app/theme';
import { generateClientCode, getClientFormDefaults } from '@/modules/clients/utils/clientPresentation';
import { normalizeClientIdentityNumber } from '@/modules/clients/utils/identityNumber';
import { CLIENT_TAX_NUMBER_PLACEHOLDER, formatClientTaxNumber } from '@/modules/clients/utils/taxNumber';
import { BankAccount, Bank } from '@/types/domain';
import { AccountQuickCreateDialog } from '@/modules/accounts/components/AccountQuickCreateDialog';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;
const CLIENT_PHONE_PLACEHOLDER = '99 999 999';

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>;
  loading?: boolean;
  availableAccounts?: BankAccount[];
  banks?: Bank[];
  mode?: 'create' | 'edit';
  onSubmit: (values: ClientFormValues) => void | Promise<void>;
  onQuickCreateAccount?: (values: any) => Promise<BankAccount | null | undefined>;
  onCancel?: () => void;
}

export function ClientForm({ defaultValues, loading, availableAccounts = [], banks = [], mode = 'create', onSubmit, onQuickCreateAccount, onCancel }: ClientFormProps) {
  const defaultCurrency = useDefaultCurrency();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [validationAlert, setValidationAlert] = useState('');

  const resolvedDefaultValues = useMemo(
    () => ({
      ...getClientFormDefaults(),
      ...defaultValues,
    }) as ClientFormValues,
    [defaultValues],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: resolvedDefaultValues,
  });

  const clientType = watch('type');
  const fullName = watch('fullName');
  const selectedAccountIds = watch('accountIds') ?? [];
  const generatedCode = useMemo(() => generateClientCode(fullName), [fullName]);

  // Ne reset que quand les defaultValues changent réellement (ouverture/changement de client)
  const prevDefaultsRef = useRef<typeof defaultValues>(undefined);
  useEffect(() => {
    if (prevDefaultsRef.current !== defaultValues) {
      prevDefaultsRef.current = defaultValues;
      reset(resolvedDefaultValues);
    }
  }, [reset, resolvedDefaultValues, defaultValues]);

  useEffect(() => {
    setValue('code', generatedCode, { shouldDirty: false, shouldValidate: false });
  }, [generatedCode, setValue]);

  const selectedAccounts = useMemo(
    () => availableAccounts.filter((account) => selectedAccountIds.includes(account.id)),
    [availableAccounts, selectedAccountIds],
  );

  const handleQuickCreate = async (values: any) => {
    if (!onQuickCreateAccount) return;
    setQuickCreateLoading(true);
    try {
      const createdAccount = await onQuickCreateAccount(values);
      if (createdAccount?.id) {
        // Utiliser getValues pour la valeur courante (pas la closure stale)
        const currentIds = getValues('accountIds') ?? [];
        const nextAccountIds = Array.from(new Set([...currentIds, createdAccount.id]));
        setValue('accountIds', nextAccountIds, { shouldDirty: true, shouldValidate: true });
        setQuickCreateOpen(false);
      }
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const isEditMode = mode === 'edit';

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
    <>
      <form onSubmit={handleSubmit(
        async (values: ClientFormValues) => {
          try {
            console.log('[ClientForm] submit mode:', mode);
            console.log('[ClientForm] values:', values);
            await onSubmit(values);
          } catch (error) {
            console.error('[ClientForm] submit error:', error);
          }
        },
        (validationErrors) => {
          console.warn('[ClientForm] validation errors:', validationErrors);
          const firstKey = Object.keys(validationErrors)[0];
          if (firstKey) {
            const msg = (validationErrors as any)[firstKey]?.message || 'Champ invalide';
            setValidationAlert(msg);
            // Focus sur le premier champ en erreur
            const el = document.querySelector<HTMLInputElement>(`[name="${firstKey}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => el.focus(), 300);
            }
          }
        },
      )} autoComplete="off">
        <Stack spacing={2.25} sx={{ mt: 0.5 }}>
          {/* ── Informations générales ───────────────────────────── */}
          <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Informations générales</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Identité métier du client et code généré automatiquement.
                </Typography>
              </Box>
              <Divider />
              <Grid container spacing={1.5} columns={12}>
                {/* 1. Nom complet (premier) */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        label="Nom complet"
                        placeholder="Ex. Foulen Ben Foulen"
                        error={!!errors.fullName}
                        helperText={errors.fullName?.message || 'Utilisé pour générer automatiquement le code client'}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                {/* 2. Société (deuxième) */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="companyName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Société"
                        placeholder="Ex. Flux Financier SARL"
                        error={!!errors.companyName}
                        helperText={errors.companyName?.message || (clientType === 'COMPANY' ? 'Champ recommandé pour une société' : 'Optionnel pour un particulier')}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                {/* 3. Type (troisième) */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="Type"
                        error={!!errors.type}
                        helperText={errors.type?.message}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CategoryRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="INDIVIDUAL">Particulier</MenuItem>
                        <MenuItem value="COMPANY">Société</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          {/* ── Contact ──────────────────────────────────────────── */}
          <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Contact</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Coordonnées nécessaires au suivi client.
                </Typography>
              </Box>
              <Divider />
              <Grid container spacing={1.5} columns={12}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
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
                        required
                        label="Téléphone"
                        placeholder={CLIENT_PHONE_PLACEHOLDER}
                        error={!!errors.phone}
                        helperText={errors.phone?.message || 'Obligatoire — format : XX XXX XXX'}
                        inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email"
                        placeholder="contact@client.ma"
                        error={!!errors.email}
                        helperText={errors.email?.message || 'Optionnel'}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Adresse"
                        placeholder="Adresse postale complète"
                        multiline
                        rows={2}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <LocationOnRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          {/* ── Informations administratives ──────────────────────── */}
          <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Informations administratives</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Références identitaires, fiscales et statut opérationnel.
                </Typography>
              </Box>
              <Divider />
              <Grid container spacing={1.5} columns={12}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="identityNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(normalizeClientIdentityNumber(event.target.value))}
                        fullWidth
                        label="Numéro identifiant"
                        placeholder="12345678"
                        error={!!errors.identityNumber}
                        helperText={errors.identityNumber?.message || 'Optionnel — 8 chiffres'}
                        size="small"
                        inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="taxNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(formatClientTaxNumber(event.target.value))}
                        fullWidth
                        label="Matricule fiscal"
                        placeholder={CLIENT_TAX_NUMBER_PLACEHOLDER}
                        error={!!errors.taxNumber}
                        helperText={errors.taxNumber?.message || 'Format : 1234567A B000'}
                        size="small"
                        inputProps={{ maxLength: 13 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DescriptionRoundedIcon sx={inputIconSx} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
                              Client actif
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                              Un client inactif reste visible, mais n'est plus considéré comme opérationnel.
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', m: 0 }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          {/* ── Compléments ──────────────────────────────────────── */}
          <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.6), p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Compléments</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Notes internes et contexte relationnel.
                </Typography>
              </Box>
              <Divider />
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    placeholder="Commentaires internes, informations de suivi, contexte métier..."
                    size="small"
                    sx={{ mt: 0.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <NoteAltRoundedIcon sx={inputIconSx} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Stack>
          </Box>

          {/* ── Comptes bancaires associés ────────────────────────── */}
          <Box sx={{ ...sectionSx, backgroundColor: alpha(brandColors.slate[50], 0.7), p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Box sx={iconBox(brandColors.blue[600], 32)}>
                  <AccountBalanceRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography sx={sectionTitleSx}>Comptes bancaires associés</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.1 }}>
                    Sélectionnez ou créez des comptes à associer au client.
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              {availableAccounts.length === 0 ? (
                <Box sx={{
                  borderRadius: 2,
                  border: `1px dashed ${alpha(brandColors.slate[300], 0.8)}`,
                  backgroundColor: alpha(brandColors.slate[100], 0.35),
                  px: 1.5,
                  py: 1.5,
                  textAlign: 'center',
                }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.2 }}>
                    Aucun compte disponible
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1 }}>
                    Aucun compte bancaire n'existe encore. Créez-en un pour l'associer au client.
                  </Typography>
                  {onQuickCreateAccount && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setQuickCreateOpen(true)}
                      sx={{ minWidth: 0, px: 2, fontWeight: 600 }}
                    >
                      Créer un compte
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <Controller
                    name="accountIds"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={availableAccounts}
                        value={selectedAccounts}
                        getOptionLabel={(option) =>
                          `${option.label} — ${option.accountNumber}${option.currency ? ` (${option.currency})` : ''}`
                        }
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterSelectedOptions
                        onChange={(_, newValue) => {
                          field.onChange(newValue.map((account) => account.id));
                        }}
                        noOptionsText={<Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 1 }}>Aucun compte trouvé</Typography>}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                              <Box sx={iconBox(brandColors.blue[600], 26)}>
                                <AccountBalanceRoundedIcon sx={{ fontSize: '0.8rem' }} />
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
                                  {option.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.77rem', color: 'text.secondary' }}>
                                  {option.accountNumber}{option.currency ? ` • ${option.currency}` : ''}
                                  {option.bank?.name ? ` • ${option.bank.name}` : ''}
                                </Typography>
                              </Box>
                            </Stack>
                          </li>
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option.id}
                              label={`${option.label} — ${option.accountNumber}`}
                              size="small"
                              icon={<AccountBalanceRoundedIcon sx={{ fontSize: '0.8rem !important' }} />}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                backgroundColor: alpha(brandColors.blue[50], 0.7),
                                border: `1px solid ${alpha(brandColors.blue[200], 0.5)}`,
                                color: brandColors.blue[700],
                                '& .MuiChip-deleteIcon': {
                                  color: brandColors.blue[400],
                                  '&:hover': { color: brandColors.debit },
                                },
                              }}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Comptes bancaires"
                            placeholder={selectedAccounts.length === 0 ? 'Rechercher et ajouter un compte...' : ''}
                            error={!!errors.accountIds}
                            helperText={errors.accountIds?.message}
                          />
                        )}
                        ListboxProps={{
                          style: { maxHeight: 200 },
                        }}
                        componentsProps={{
                          paper: {
                            sx: {
                              borderRadius: 2,
                              border: `1px solid ${alpha(brandColors.slate[200], 0.7)}`,
                              boxShadow: `0 4px 16px ${alpha(brandColors.slate[900], 0.07)}`,
                              mt: 0.5,
                            },
                          },
                        }}
                      />
                    )}
                  />
                  {onQuickCreateAccount && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => setQuickCreateOpen(true)}
                        sx={{ minWidth: 0, px: 1.5, fontWeight: 600 }}
                      >
                        Nouveau compte
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={1.2}>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ minWidth: 110, fontWeight: 500, mr: 1 }}
              onClick={() => onCancel ? onCancel() : undefined}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ minWidth: 170, fontWeight: 700, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
            >
              {loading
                ? (isEditMode ? 'Modification en cours...' : 'Enregistrement...')
                : (isEditMode ? 'Modifier le client' : 'Enregistrer le client')
              }
            </Button>
          </Stack>
        </Stack>
      </form>

      {/* Quick-create dialog */}
      <AccountQuickCreateDialog
        open={quickCreateOpen}
        banks={banks}
        defaultCurrency={defaultCurrency}
        loading={quickCreateLoading}
        onClose={() => setQuickCreateOpen(false)}
        onSubmit={handleQuickCreate}
      />

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
    </>
  );
}

