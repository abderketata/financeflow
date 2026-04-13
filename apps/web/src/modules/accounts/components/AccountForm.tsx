import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import NumbersRoundedIcon from '@mui/icons-material/NumbersRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { Box, Button, Divider, Grid, InputAdornment, Stack, TextField, Typography, alpha } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { brandColors, headingFont } from '@/app/theme';
import { AccountFormValues, accountSchema } from '@/modules/accounts/schemas/account.schema';
import { formatAccountNumber, formatIban, normalizeRib } from '@/modules/accounts/utils/accountFields';
import { Bank, Client } from '@/types/domain';
import { ClientQuickCreateDialog, QuickClientFormValues } from '@/modules/clients/components/ClientQuickCreateDialog';
import { getStrapiFieldError } from '@/utils/strapi';
import { BankAutocompleteField, ClientAutocompleteField, getClientLabel } from '@/components/ui/EntityAutocompleteFields';

/* ─── Constants ────────────────────────────────────────────────────── */

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

/* ─── Props ────────────────────────────────────────────────────────── */

interface AccountFormProps {
  defaultValues?: Partial<AccountFormValues>;
  defaultCurrency?: string;
  banks: Bank[];
  clients: Client[];
  initialClient?: Client | null;
  clientsLoading?: boolean;
  loading?: boolean;
  onSubmit: (values: AccountFormValues) => void | Promise<void>;
  onCancel?: () => void;
  /** Remote search callback for clients (debounced in parent) */
  onClientSearch?: (query: string) => void;
  /** Quick-create a client inline; should return the created Client or null */
  onQuickCreateClient?: (values: QuickClientFormValues) => Promise<Client | null | undefined>;
}

/* ─── Component ────────────────────────────────────────────────────── */

export function AccountForm({
  defaultValues,
  defaultCurrency = 'TND',
  banks,
  clients,
  initialClient,
  clientsLoading,
  loading,
  onSubmit,
  onCancel,
  onClientSearch,
  onQuickCreateClient,
}: AccountFormProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [injectedClient, setInjectedClient] = useState<Client | null>(null);
  const [clientAutocompleteInput, setClientAutocompleteInput] = useState('');

  const resolvedDefaultValues = useMemo(() => ({
    label: '',
    accountNumber: '',
    rib: '',
    iban: '',
    balance: 0,
    currency: defaultCurrency,
    bank: undefined,
    client: undefined,
    ...defaultValues,
  }), [defaultValues]);

  const { control, handleSubmit, reset, setValue, setError, clearErrors, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: resolvedDefaultValues,
  });

  useEffect(() => {
    reset(resolvedDefaultValues);
    setClientAutocompleteInput(initialClient ? getClientLabel(initialClient) : '');
  }, [reset, resolvedDefaultValues, initialClient]);

  // Merge injected client into the list so Autocomplete can find it
  const mergedClients = useMemo(() => {
    const candidates = [initialClient, injectedClient, ...clients].filter(Boolean) as Client[];
    const deduped = new Map<number, Client>();
    candidates.forEach((client) => {
      if (!deduped.has(client.id)) {
        deduped.set(client.id, client);
      }
    });
    return Array.from(deduped.values());
  }, [clients, injectedClient, initialClient]);

  const handleQuickCreateClient = useCallback(async (values: QuickClientFormValues) => {
    if (!onQuickCreateClient) return;
    setQuickCreateLoading(true);
    try {
      const created = await onQuickCreateClient(values);
      if (created) {
        setInjectedClient(created);
        setValue('client', created.id);
        setClientAutocompleteInput(getClientLabel(created));
      }
      setQuickCreateOpen(false);
    } finally {
      setQuickCreateLoading(false);
    }
  }, [onQuickCreateClient, setValue]);

  const sectionSx = {
    borderRadius: 3,
    border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
    backgroundColor: alpha(brandColors.slate[50], 0.6),
    p: { xs: 1.5, md: 2 },
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
        async (values) => {
          try {
            await onSubmit(values);
          } catch (error) {
            const accountNumberError = getStrapiFieldError(error, 'accountNumber');
            if (accountNumberError) {
              const message = accountNumberError.message === 'This attribute must be unique'
                ? 'Ce numéro de compte existe déjà.'
                : accountNumberError.message || 'Numéro de compte invalide.';
              setError('accountNumber', { type: 'server', message });
              const el = document.querySelector<HTMLInputElement>('[name="accountNumber"]');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => el.focus(), 300);
              }
              return;
            }

            throw error;
          }
        },
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
          {/* ── Section: Informations générales ──────────────────── */}
          <Box sx={sectionSx}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Informations générales</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Identité métier du compte et rattachements principaux.
                </Typography>
              </Box>
              <Divider />
              <Grid container spacing={1.5} columns={12}>
                {/* Libellé */}
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

                {/* ── Banque Autocomplete ──────────────────────────── */}
                <Grid item xs={12} md={6}>
                  <Controller name="bank" control={control} render={({ field }) => {
                    const selectedBank = banks.find((b) => b.id === field.value) ?? null;
                    return (
                      <BankAutocompleteField
                        value={selectedBank}
                        options={banks}
                        onChange={(value) => field.onChange(value?.id ?? undefined)}
                        error={!!errors.bank}
                        helperText={errors.bank?.message || 'Optionnel'}
                      />
                    );
                  }} />
                </Grid>

                {/* ── Client Autocomplete ──────────────────────────── */}
                <Grid item xs={12} md={6}>
                  <Controller name="client" control={control} render={({ field }) => {
                    const selectedClient = mergedClients.find((c) => c.id === field.value) ?? null;
                    return (
                      <ClientAutocompleteField
                        value={selectedClient}
                        inputValue={clientAutocompleteInput}
                        options={mergedClients}
                        onChange={(value) => {
                          setClientAutocompleteInput(value ? getClientLabel(value) : '');
                          field.onChange(value?.id ?? undefined);
                        }}
                        onInputChange={(value, reason) => {
                          if (reason === 'input') {
                            setClientAutocompleteInput(value);
                            if (onClientSearch) onClientSearch(value);
                            return;
                          }

                          if (reason === 'clear') {
                            setClientAutocompleteInput('');
                            if (onClientSearch) onClientSearch('');
                          }
                        }}
                        onClose={() => {
                          setClientAutocompleteInput(selectedClient ? getClientLabel(selectedClient) : '');
                          if (onClientSearch) onClientSearch('');
                        }}
                        loading={clientsLoading}
                        error={!!errors.client}
                        helperText={errors.client?.message || 'Optionnel'}
                        allowAddNew={Boolean(onQuickCreateClient)}
                        onAddNew={() => setQuickCreateOpen(true)}
                      />
                    );
                  }} />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          {/* ── Section: Références bancaires ────────────────────── */}
          <Box sx={sectionSx}>
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
                      onChange={(event) => {
                        clearErrors('accountNumber');
                        field.onChange(formatAccountNumber(event.target.value));
                      }}
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

          {/* ── Section: Pilotage financier ──────────────────────── */}
          <Box sx={sectionSx}>
            <Stack spacing={1.1}>
              <Box sx={{ mb: 0.5 }}>
                <Typography sx={sectionTitleSx}>Pilotage financier</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.2 }}>
                  Point d'entrée financier utilisé pour le suivi du compte.
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

      {/* ── Quick-create client dialog ────────────────────────────── */}
      {onQuickCreateClient && (
        <ClientQuickCreateDialog
          open={quickCreateOpen}
          loading={quickCreateLoading}
          onClose={() => setQuickCreateOpen(false)}
          onSubmit={handleQuickCreateClient}
        />
      )}
    </>
  );
}

