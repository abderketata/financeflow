import { useEffect, useMemo, useState } from 'react';
import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
      <Grid container spacing={2} sx={{ mt: 0.5 }}>

        {/* ── Ligne 1 : Client + Compte ──────────────────────── */}
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

        {/* ── Ligne 2 : Type + Sens + Montant + Devise ───────── */}
        <Grid item xs={6} md={3}>
          <Controller name="type" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Type">
              {paymentItemTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Controller name="direction" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Sens">
              <MenuItem value="IN">Entrant</MenuItem>
              <MenuItem value="OUT">Sortant</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={8} md={4}>
          <Controller name="amount" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="number" label="Montant" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value)} error={!!errors.amount} helperText={errors.amount?.message} />
          )} />
        </Grid>
        <Grid item xs={4} md={2}>
          <Controller name="currency" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Devise" error={!!errors.currency} helperText={errors.currency?.message} />
          )} />
        </Grid>

        {/* ── Ligne 3 : Statut + Date émission + Échéance + Alertes + Jours alerte */}
        <Grid item xs={12} md={3}>
          <Controller name="status" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Statut" error={!!errors.status} helperText={errors.status?.message}>
              {paymentItemStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={6} md={2.5}>
          <Controller name="issueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Date d'émission" InputLabelProps={{ shrink: true }} />
          )} />
        </Grid>
        <Grid item xs={6} md={2.5}>
          <Controller name="dueDate" control={control} render={({ field }) => (
            <TextField {...field} fullWidth type="date" label="Échéance" InputLabelProps={{ shrink: true }} error={!!errors.dueDate} helperText={errors.dueDate?.message} />
          )} />
        </Grid>
        <Grid item xs={6} md={2}>
          <Controller name="alertEnabled" control={control} render={({ field }) => (
            <TextField {...field} fullWidth select label="Alertes" value={field.value ? 'true' : 'false'} onChange={(e) => field.onChange(e.target.value === 'true')}>
              <MenuItem value="true">Activées</MenuItem>
              <MenuItem value="false">Désactivées</MenuItem>
            </TextField>
          )} />
        </Grid>
        <Grid item xs={6} md={2}>
          <Controller name="alertDaysBefore" control={control} render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label="Jours avant alerte"
              value={field.value ?? 0}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={!watchedAlertEnabled}
              error={!!errors.alertDaysBefore}
              helperText={errors.alertDaysBefore?.message}
            />
          )} />
        </Grid>

        {/* ── Ligne 4 : Tireur + Tiré ────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Controller name="drawer" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Tireur" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { backgroundColor: '#f8fafc', color: '#475569' } }} />
          )} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name="drawee" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Tiré" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { backgroundColor: '#f8fafc', color: '#475569' } }} />
          )} />
        </Grid>

        {/* ── Ligne 5 : Notes ────────────────────────────────── */}
        <Grid item xs={12}>
          <Controller name="notes" control={control} render={({ field }) => <TextField {...field} fullWidth multiline rows={4} label="Notes" />} />
        </Grid>

        {/* ── Bouton ─────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>Enregistrer</Button>
        </Grid>
      </Grid>
    </form>
  );
}
