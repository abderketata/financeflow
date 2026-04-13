import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import NumbersRoundedIcon from '@mui/icons-material/NumbersRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Autocomplete, Box, Button, createFilterOptions, Divider, Grid, InputAdornment, Stack, TextField, Typography, alpha } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { brandColors, headingFont } from '@/app/theme';
import { AccountFormValues, accountSchema } from '@/modules/accounts/schemas/account.schema';
import { formatAccountNumber, formatIban, normalizeRib } from '@/modules/accounts/utils/accountFields';
import { Bank, Client } from '@/types/domain';
import { ClientQuickCreateDialog, QuickClientFormValues } from '@/modules/clients/components/ClientQuickCreateDialog';
import { getStrapiFieldError } from '@/utils/strapi';

/* ─── Constants ────────────────────────────────────────────────────── */

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

const bankFilterOptions = createFilterOptions<Bank>({
  stringify: (option) => `${option.code ?? ''} ${option.name ?? ''}`,
  ignoreCase: true,
  trim: true,
});

const ADD_CLIENT_SENTINEL = { id: -1, fullName: '__ADD_NEW__' } as Client;

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

/* ─── Helpers ──────────────────────────────────────────────────────── */

function getClientLabel(client: Client): string {
  if (client.id === ADD_CLIENT_SENTINEL.id) return '';
  const company = client.companyName?.trim();
  const full = client.fullName?.trim();
  if (company && full && company !== full) return `${company} — ${full}`;
  return company || full || client.name?.trim() || client.code?.trim() || `Client #${client.id}`;
}

const clientFilterOptions = createFilterOptions<Client>({
  stringify: (option) =>
    option.id === ADD_CLIENT_SENTINEL.id
      ? ''
      : `${option.fullName ?? ''} ${option.companyName ?? ''} ${option.code ?? ''}`,
  ignoreCase: true,
  trim: true,
});

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
                      <Autocomplete
                        value={selectedBank}
                        onChange={(_, v) => field.onChange(v?.id ?? undefined)}
                        options={banks}
                        filterOptions={bankFilterOptions}
                        getOptionLabel={(o) => o.code ? `${o.code} — ${o.name}` : o.name}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        noOptionsText="Aucune banque trouvée"
                        openText="Ouvrir"
                        clearText="Effacer"
                        size="small"
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
                              <Box sx={{ width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(brandColors.blue[500], 0.08), color: brandColors.blue[600], flexShrink: 0 }}>
                                <AccountBalanceRoundedIcon sx={{ fontSize: 15 }} />
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: brandColors.slate[700], fontFamily: headingFont }} noWrap>
                                  {option.code || option.name}
                                </Typography>
                                {option.code && (
                                  <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                                    {option.name}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Banque"
                            placeholder="Rechercher par code ou nom…"
                            error={!!errors.bank}
                            helperText={errors.bank?.message || 'Optionnel'}
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
                        ListboxProps={{ sx: { maxHeight: 220, '& .MuiAutocomplete-option': { py: 1, px: 1.5, borderRadius: '8px', mx: 0.5, my: 0.2 } } }}
                      />
                    );
                  }} />
                </Grid>

                {/* ── Client Autocomplete ──────────────────────────── */}
                <Grid item xs={12} md={6}>
                  <Controller name="client" control={control} render={({ field }) => {
                    const selectedClient = mergedClients.find((c) => c.id === field.value) ?? null;
                    // Build options: all clients + sentinel "add new" if we have the callback
                    const options: Client[] = onQuickCreateClient
                      ? [...mergedClients, ADD_CLIENT_SENTINEL]
                      : mergedClients;

                    return (
                      <Autocomplete
                        value={selectedClient}
                        inputValue={clientAutocompleteInput}
                        onChange={(_, v) => {
                          if (v && v.id === ADD_CLIENT_SENTINEL.id) {
                            setQuickCreateOpen(true);
                            return;
                          }
                          setClientAutocompleteInput(v ? getClientLabel(v) : '');
                          field.onChange(v?.id ?? undefined);
                        }}
                        options={options}
                        filterOptions={(opts, state) => {
                          const filtered = clientFilterOptions(opts.filter((o) => o.id !== ADD_CLIENT_SENTINEL.id), state);
                          // Always append sentinel at end
                          if (onQuickCreateClient) filtered.push(ADD_CLIENT_SENTINEL);
                          return filtered;
                        }}
                        getOptionLabel={(o) => (o.id === ADD_CLIENT_SENTINEL.id ? '' : getClientLabel(o))}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        loading={clientsLoading}
                        loadingText="Chargement…"
                        noOptionsText="Aucun client trouvé"
                        openText="Ouvrir"
                        clearText="Effacer"
                        size="small"
                        onInputChange={(_, v, reason) => {
                          if (reason === 'input') {
                            setClientAutocompleteInput(v);
                            if (onClientSearch) onClientSearch(v);
                            return;
                          }

                          if (reason === 'clear') {
                            setClientAutocompleteInput('');
                            if (onClientSearch) onClientSearch('');
                          }
                        }}
                        onClose={() => {
                          // Reset remote search when dropdown closes so the full list reloads next time
                          setClientAutocompleteInput(selectedClient ? getClientLabel(selectedClient) : '');
                          if (onClientSearch) onClientSearch('');
                        }}
                        renderOption={(props, option) => {
                          if (option.id === ADD_CLIENT_SENTINEL.id) {
                            return (
                              <li {...props} key="__add_new__">
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', color: brandColors.blue[600], fontWeight: 700, py: 0.25 }}>
                                  <AddRoundedIcon sx={{ fontSize: 18 }} />
                                  <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'inherit' }}>
                                    Ajouter un nouveau client
                                  </Typography>
                                </Stack>
                              </li>
                            );
                          }

                          const company = option.companyName?.trim();
                          const full = option.fullName?.trim();
                          const primary = company || full || option.name?.trim() || `Client #${option.id}`;
                          const secondary = company && full && company !== full ? full : '';

                          return (
                            <li {...props} key={option.id}>
                              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
                                <Box sx={{ width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(brandColors.blue[500], 0.08), color: brandColors.blue[600], flexShrink: 0 }}>
                                  <PersonRoundedIcon sx={{ fontSize: 15 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: brandColors.slate[700] }} noWrap>
                                    {primary}
                                  </Typography>
                                  {secondary && (
                                    <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                                      {secondary}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Client"
                            placeholder="Rechercher par nom, société ou code…"
                            error={!!errors.client}
                            helperText={errors.client?.message || 'Optionnel'}
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
                        ListboxProps={{ sx: { maxHeight: 260, '& .MuiAutocomplete-option': { py: 1, px: 1.5, borderRadius: '8px', mx: 0.5, my: 0.2 } } }}
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

