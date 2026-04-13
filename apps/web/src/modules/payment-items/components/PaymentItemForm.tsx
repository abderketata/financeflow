import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Divider, Grid, InputAdornment, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import {
  paymentItemStatusOptions,
  paymentItemTypeOptions,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { BankAccount, Client } from '@/types/domain';
import { clientService } from '@/modules/clients/services/client.service';
import { accountService } from '@/modules/accounts/services/account.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AccountAutocompleteField,
  ClientAutocompleteField,
  getClientLabel,
} from '@/components/ui/EntityAutocompleteFields';
import { brandColors, headingFont } from '@/app/theme';

// ── Style helpers ────────────────────────────────────────────────────────
const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

const sectionSx = {
  borderRadius: 2.5,
  border: `1px solid ${alpha(brandColors.slate[200], 0.8)}`,
  backgroundColor: alpha(brandColors.slate[50], 0.5),
  p: { xs: 1.5, md: 2 },
} as const;

const sectionTitleSx = {
  fontFamily: headingFont,
  fontWeight: 700,
  fontSize: '0.88rem',
  color: brandColors.slate[700],
  letterSpacing: '-0.01em',
  mb: 0.5,
} as const;

const readOnlyInputSx = {
  '& .MuiInputBase-input': {
    backgroundColor: alpha(brandColors.slate[100], 0.7),
    color: brandColors.slate[600],
    fontWeight: 500,
  },
  '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(brandColors.slate[200], 0.9),
    borderStyle: 'dashed',
  },
} as const;

// ── Direction visual config ──────────────────────────────────────────────
const directionConfig = {
  IN:  { label: 'Entrant',  color: '#059669', bg: '#ECFDF5', icon: ArrowUpwardRoundedIcon },
  OUT: { label: 'Sortant',  color: '#DC2626', bg: '#FEF2F2', icon: ArrowDownwardRoundedIcon },
} as const;

// ── Status visual config ─────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Reçu':       { color: '#2563EB', bg: '#EFF6FF', icon: CheckCircleRoundedIcon },
  'Déposé':     { color: '#D97706', bg: '#FFFBEB', icon: AccountBalanceWalletRoundedIcon },
  'Payé':       { color: '#059669', bg: '#ECFDF5', icon: PaidRoundedIcon },
  'Rejeté':     { color: '#DC2626', bg: '#FEF2F2', icon: CancelRoundedIcon },
  'Annulé':     { color: '#64748B', bg: '#F1F5F9', icon: BlockRoundedIcon },
  'En retard':  { color: '#DC2626', bg: '#FEF2F2', icon: WarningAmberRoundedIcon },
};

/** Colored chip-like rendering for select options */
function ColoredOptionLabel({ icon: Icon, label, color, bg }: { icon: React.ElementType; label: string; color: string; bg: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box sx={{
        width: 22, height: 22, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg, color, flexShrink: 0,
      }}>
        <Icon sx={{ fontSize: 14 }} />
      </Box>
      <Typography component="span" sx={{ fontSize: '0.86rem', fontWeight: 600, color }}>{label}</Typography>
    </Box>
  );
}

/** Due date urgency helper */
function getDueDateUrgency(dateStr: string): { color: string; icon: React.ElementType | null; helperText: string } {
  if (!dateStr) return { color: brandColors.slate[400], icon: null, helperText: '' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return { color: '#DC2626', icon: ErrorOutlineRoundedIcon, helperText: `Échue depuis ${Math.abs(diffDays)} j` };
  if (diffDays <= 7) return { color: '#D97706', icon: WarningAmberRoundedIcon, helperText: `Dans ${diffDays} j` };
  return { color: '#059669', icon: EventRoundedIcon, helperText: `Dans ${diffDays} j` };
}

interface PaymentItemFormProps {
  defaultValues?: Partial<PaymentItemFormValues>;
  defaultCurrency?: string;
  defaultAlertDays?: number;
  /** Initial full client object for edit mode pre-selection */
  initialClient?: Client | null;
  /** Initial full account object for edit mode pre-selection */
  initialAccount?: BankAccount | null;
  companyName: string;
  loading?: boolean;
  onSubmit: (values: PaymentItemFormValues) => void | Promise<void>;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentItemForm({
  defaultValues,
  defaultCurrency = 'TND',
  defaultAlertDays = 3,
  initialClient,
  initialAccount,
  companyName,
  loading,
  onSubmit,
}: PaymentItemFormProps) {
  const isEditMode = Boolean(defaultValues);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      type: 'CHEQUE',
      direction: 'IN',
      amount: 0,
      currency: defaultCurrency,
      status: 'Reçu',
      issueDate: isEditMode ? (defaultValues?.issueDate || '') : getTodayISO(),
      dueDate: '',
      drawer: '',
      drawee: '',
      alertEnabled: true,
      alertDaysBefore: isEditMode
        ? (defaultValues?.alertDaysBefore ?? defaultAlertDays)
        : defaultAlertDays,
      notes: '',
      client: undefined,
      account: undefined,
      ...defaultValues,
    },
  });

  const watchedDirection = watch('direction');
  const watchedClientId = watch('client');
  const watchedAlertEnabled = watch('alertEnabled');
  const watchedDueDate = watch('dueDate');
  const dueDateUrgency = useMemo(() => getDueDateUrgency(watchedDueDate || ''), [watchedDueDate]);

  /* ── Client Autocomplete state ────────────────────────── */
  const [clientSearchInput, setClientSearchInput] = useState(initialClient ? getClientLabel(initialClient) : '');
  const debouncedClientSearch = useDebouncedValue(clientSearchInput, 350);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient ?? null);

  const { data: remoteClients = [], isFetching: isClientsLoading } = useQuery({
    queryKey: ['clients', 'payment-form-lookup', debouncedClientSearch],
    queryFn: () => clientService.lookup(debouncedClientSearch, 50),
    staleTime: 30_000,
  });

  // Merge initial client into options so it always appears
  const clientOptions = useMemo(() => {
    const map = new Map<number, Client>();
    if (initialClient?.id) map.set(initialClient.id, initialClient);
    remoteClients.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [remoteClients, initialClient]);

  /* ── Accounts filtered by client ──────────────────────── */
  const { data: clientAccounts = [], isFetching: isAccountsLoading } = useQuery({
    queryKey: ['accounts', 'by-client', watchedClientId ?? null],
    queryFn: () => {
      if (!watchedClientId) return Promise.resolve([]);
      return accountService.list({
        filters: { client: { id: { $eq: Number(watchedClientId) } } },
      });
    },
    enabled: Boolean(watchedClientId),
    staleTime: 30_000,
  });

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(initialAccount ?? null);

  // Merge initial account into options
  const accountOptions = useMemo(() => {
    const map = new Map<number, BankAccount>();
    if (initialAccount?.id && Number(watchedClientId) === (initialClient?.id ?? -1)) {
      map.set(initialAccount.id, initialAccount);
    }
    clientAccounts.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }, [clientAccounts, initialAccount, watchedClientId, initialClient]);

  // Reset account when client changes
  useEffect(() => {
    if (!watchedClientId) {
      setSelectedAccount(null);
      setValue('account', undefined);
    } else if (isEditMode && initialClient?.id === Number(watchedClientId) && initialAccount) {
      // Keep the pre-selected account in edit mode
    } else {
      // Client changed to a new value — reset account
      setSelectedAccount(null);
      setValue('account', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClientId]);

  /* ── Auto-fill drawer / drawee ────────────────────────── */
  useEffect(() => {
    const client = selectedClient;
    const clientLabel = client
      ? (client.companyName?.trim() || client.fullName?.trim() || client.name?.trim() || '')
      : '';
    const company = companyName || '';

    if (watchedDirection === 'IN') {
      setValue('drawer', company);
      setValue('drawee', clientLabel);
    } else {
      setValue('drawer', clientLabel);
      setValue('drawee', company);
    }
  }, [watchedDirection, selectedClient, companyName, setValue]);

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Stack spacing={2} sx={{ mt: 0.5 }}>

        {/* ── Section 1 : Client & Compte — unchanged ──────────── */}
        <Box sx={sectionSx}>
          <Typography sx={sectionTitleSx}>Parties concernées</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller name="client" control={control} render={({ field }) => (
                <ClientAutocompleteField
                  value={selectedClient}
                  inputValue={clientSearchInput}
                  options={clientOptions}
                  loading={isClientsLoading}
                  onInputChange={(value, reason) => {
                    if (reason === 'input') {
                      setClientSearchInput(value);
                      return;
                    }
                    if (reason === 'clear') {
                      setClientSearchInput('');
                    }
                  }}
                  onChange={(value) => {
                    setSelectedClient(value);
                    setClientSearchInput(value ? getClientLabel(value) : '');
                    field.onChange(value?.id ?? undefined);
                  }}
                  onClose={() => {
                    setClientSearchInput(selectedClient ? getClientLabel(selectedClient) : '');
                  }}
                  error={!!errors.client}
                  helperText={errors.client?.message || 'Optionnel'}
                />
              )} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="account" control={control} render={({ field }) => (
                <AccountAutocompleteField
                  value={selectedAccount}
                  options={accountOptions}
                  disabled={!watchedClientId}
                  loading={isAccountsLoading}
                  onChange={(value) => {
                    setSelectedAccount(value);
                    field.onChange(value?.id ?? undefined);
                  }}
                  noOptionsText={watchedClientId ? 'Aucun compte trouvé pour ce client' : 'Sélectionnez d\'abord un client'}
                  placeholder={watchedClientId ? 'Rechercher un compte…' : 'Sélectionnez d\'abord un client'}
                  error={!!errors.account}
                  helperText={errors.account?.message || 'Optionnel'}
                />
              )} />
            </Grid>
          </Grid>
        </Box>

        {/* ── Section 2 : Caractéristiques du paiement ─────────── */}
        <Box sx={sectionSx}>
          <Typography sx={sectionTitleSx}>Caractéristiques du paiement</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Controller name="type" control={control} render={({ field }) => (
                <TextField {...field} fullWidth select label="Type" size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptLongRoundedIcon sx={inputIconSx} /></InputAdornment> }}>
                  {paymentItemTypeOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )} />
            </Grid>

            {/* ── SENS — colored options ──────────────────────────── */}
            <Grid item xs={6} md={3}>
              <Controller name="direction" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth select label="Sens" size="small"
                  SelectProps={{
                    renderValue: (val) => {
                      const d = directionConfig[val as keyof typeof directionConfig] ?? directionConfig.IN;
                      return <ColoredOptionLabel icon={d.icon} label={d.label} color={d.color} bg={d.bg} />;
                    },
                  }}
                >
                  {(['IN', 'OUT'] as const).map((dir) => {
                    const d = directionConfig[dir];
                    return (
                      <MenuItem key={dir} value={dir}>
                        <ColoredOptionLabel icon={d.icon} label={d.label} color={d.color} bg={d.bg} />
                      </MenuItem>
                    );
                  })}
                </TextField>
              )} />
            </Grid>

            <Grid item xs={8} md={4}>
              <Controller name="amount" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="number" label="Montant" size="small"
                  value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)}
                  error={!!errors.amount} helperText={errors.amount?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PaymentsRoundedIcon sx={inputIconSx} /></InputAdornment> }} />
              )} />
            </Grid>
            <Grid item xs={4} md={2}>
              <Controller name="currency" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Devise" size="small"
                  error={!!errors.currency} helperText={errors.currency?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyExchangeRoundedIcon sx={inputIconSx} /></InputAdornment> }} />
              )} />
            </Grid>
          </Grid>
        </Box>

        {/* ── Section 3 : Statut & Dates ───────────────────────── */}
        <Box sx={sectionSx}>
          <Typography sx={sectionTitleSx}>Statut et échéances</Typography>
          <Grid container spacing={2}>

            {/* ── STATUT — colored options ────────────────────────── */}
            <Grid item xs={12} md={3}>
              <Controller name="status" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth select label="Statut" size="small"
                  error={!!errors.status} helperText={errors.status?.message}
                  SelectProps={{
                    renderValue: (val) => {
                      const sc = statusConfig[val as string] ?? { color: brandColors.slate[500], bg: brandColors.slate[50], icon: CheckCircleOutlineRoundedIcon };
                      return <ColoredOptionLabel icon={sc.icon} label={val as string} color={sc.color} bg={sc.bg} />;
                    },
                  }}
                >
                  {paymentItemStatusOptions.map((o) => {
                    const sc = statusConfig[o.value] ?? { color: brandColors.slate[500], bg: brandColors.slate[50], icon: CheckCircleOutlineRoundedIcon };
                    return (
                      <MenuItem key={o.value} value={o.value}>
                        <ColoredOptionLabel icon={sc.icon} label={o.label} color={sc.color} bg={sc.bg} />
                      </MenuItem>
                    );
                  })}
                </TextField>
              )} />
            </Grid>

            <Grid item xs={6} md={2.5}>
              <Controller name="issueDate" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Date d'émission" size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayRoundedIcon sx={inputIconSx} /></InputAdornment> }} />
              )} />
            </Grid>

            {/* ── ÉCHÉANCE — dynamic color by urgency ────────────── */}
            <Grid item xs={6} md={2.5}>
              <Controller name="dueDate" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth type="date" label="Échéance" size="small"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.dueDate}
                  helperText={errors.dueDate?.message || dueDateUrgency.helperText}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {dueDateUrgency.icon
                          ? <Box component={dueDateUrgency.icon} sx={{ fontSize: 18, color: dueDateUrgency.color }} />
                          : <EventRoundedIcon sx={inputIconSx} />}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': field.value ? {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(dueDateUrgency.color, 0.4) },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: dueDateUrgency.color },
                    } : {},
                    '& .MuiFormHelperText-root': field.value && !errors.dueDate ? { color: dueDateUrgency.color, fontWeight: 600 } : {},
                  }}
                />
              )} />
            </Grid>

            {/* ...existing alertEnabled and alertDaysBefore fields... */}
            <Grid item xs={6} md={2}>
              <Controller name="alertEnabled" control={control} render={({ field }) => (
                <TextField {...field} fullWidth select label="Alertes" size="small"
                  value={field.value ? 'true' : 'false'} onChange={(e) => field.onChange(e.target.value === 'true')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotificationsActiveRoundedIcon sx={inputIconSx} /></InputAdornment> }}>
                  <MenuItem value="true">Activées</MenuItem>
                  <MenuItem value="false">Désactivées</MenuItem>
                </TextField>
              )} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Controller name="alertDaysBefore" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="number" label="Jours avant" size="small"
                  value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)}
                  disabled={!watchedAlertEnabled} error={!!errors.alertDaysBefore} helperText={errors.alertDaysBefore?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={inputIconSx} /></InputAdornment> }} />
              )} />
            </Grid>
          </Grid>
        </Box>

        {/* ── Sections 4 & 5 + button — unchanged ──────────────── */}
        {/* ── Section 4 : Tireur / Tiré (readonly) ─────────────── */}
        <Box sx={sectionSx}>
          <Typography sx={sectionTitleSx}>Parties (auto-renseignées)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller name="drawer" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Tireur"
                  size="small"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon sx={inputIconSx} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputSx}
                />
              )} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="drawee" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Tiré"
                  size="small"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon sx={inputIconSx} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputSx}
                />
              )} />
            </Grid>
          </Grid>
        </Box>

        {/* ── Section 5 : Notes ────────────────────────────────── */}
        <Box sx={sectionSx}>
          <Typography sx={sectionTitleSx}>Notes</Typography>
          <Controller name="notes" control={control} render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              placeholder="Commentaires, informations complémentaires..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <NotesRoundedIcon sx={inputIconSx} />
                  </InputAdornment>
                ),
              }}
            />
          )} />
        </Box>

        {/* ── Bouton ─────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 140, fontWeight: 600 }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
