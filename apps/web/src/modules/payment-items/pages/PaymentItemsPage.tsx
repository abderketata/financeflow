import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocalAtmRoundedIcon from '@mui/icons-material/LocalAtmRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography, alpha } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/FormDialog';
import { PaymentItemForm } from '@/modules/payment-items/components/PaymentItemForm';
import { usePaymentItems, useCreatePaymentItem, useDeletePaymentItem, useUpdatePaymentItem, useSoftDeletePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { clientService } from '@/modules/clients/services/client.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Client, PaymentItem } from '@/types/domain';
import { ClientAutocompleteField, getClientLabel } from '@/components/ui/EntityAutocompleteFields';
import { formatCurrency, formatDate, normalizeText } from '@/utils/format';
import { actionIconButton, brandColors, numericFont } from '@/app/theme';
import {
  buildPaymentItemReference,
  getPaymentItemAccount,
  getPaymentItemAccountPrimary,
  getPaymentItemAccountSecondary,
  getPaymentItemClientPrimary,
  getPaymentItemClientSecondary,
  getPaymentItemCurrency,
  getPaymentItemEffectiveDate,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  paymentItemStatusOptions,
} from '@/modules/payment-items/utils/paymentItemPresentation';

// ── Configs visuelles (identiques au formulaire) ─────────────────────
const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  CHEQUE: { label: 'Chèque', color: '#D97706', bg: '#FFFBEB', icon: ReceiptLongRoundedIcon },
  TRAITE: { label: 'Traite', color: '#7C3AED', bg: '#F5F3FF', icon: DescriptionRoundedIcon },
  AUTRE:  { label: 'Autre',  color: '#64748B', bg: '#F1F5F9', icon: MoreHorizRoundedIcon },
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Reçu':      { color: '#2563EB', bg: '#EFF6FF', icon: CheckCircleRoundedIcon },
  'Déposé':    { color: '#D97706', bg: '#FFFBEB', icon: AccountBalanceWalletRoundedIcon },
  'Payé':      { color: '#059669', bg: '#ECFDF5', icon: PaidRoundedIcon },
  'Rejeté':    { color: '#DC2626', bg: '#FEF2F2', icon: CancelRoundedIcon },
  'Annulé':    { color: '#64748B', bg: '#F1F5F9', icon: BlockRoundedIcon },
  'En retard': { color: '#DC2626', bg: '#FEF2F2', icon: WarningAmberRoundedIcon },
};

const paymentMethodConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ESPECES:  { label: 'Espèces',  color: '#059669', bg: '#ECFDF5', icon: LocalAtmRoundedIcon },
  VIREMENT: { label: 'Virement', color: '#2563EB', bg: '#EFF6FF', icon: SyncAltRoundedIcon },
  CARTE:    { label: 'Carte',    color: '#0891B2', bg: '#ECFEFF', icon: CreditCardRoundedIcon },
};

function ColoredChip({ icon: Icon, label, color, bg }: { icon: React.ElementType; label: string; color: string; bg: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
      <Box sx={{ width: 22, height: 22, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg, color, flexShrink: 0 }}>
        <Icon sx={{ fontSize: 13 }} />
      </Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color }}>{label}</Typography>
    </Box>
  );
}

export default function PaymentItemsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [deleting, setDeleting] = useState<PaymentItem | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedClientSearchInput = useDebouncedValue(clientSearchInput, 350);

  // ── Date validation ───────────────────────────────────────────────
  // Dates are only applied when both are filled and dateFrom < dateTo (strict)
  const datesValid = dateFrom && dateTo && dateFrom < dateTo;
  const datesPartial = (dateFrom && !dateTo) || (!dateFrom && dateTo);

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (value && dateTo && value >= dateTo) {
      setDateError('La date min doit être strictement inférieure à la date max');
    } else {
      setDateError('');
    }
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (dateFrom && value && dateFrom >= value) {
      setDateError('La date min doit être strictement inférieure à la date max');
    } else {
      setDateError('');
    }
  };

  // ── Server-side query params ──────────────────────────────────────
  const queryParams = useMemo(() => {
    const filters: Record<string, unknown>[] = [];

    if (debouncedSearch.trim()) {
      filters.push({
        $or: [
          { referenceNumber: { $containsi: debouncedSearch.trim() } },
          { drawer: { $containsi: debouncedSearch.trim() } },
          { drawee: { $containsi: debouncedSearch.trim() } },
        ],
      });
    }

    if (typeFilter) {
      filters.push({ type: { $eq: typeFilter } });
    }

    if (statusFilter) {
      filters.push({ status: { $eq: statusFilter } });
    }

    if (selectedClient?.id) {
      filters.push({ client: { id: { $eq: selectedClient.id } } });
    }

    // Date filter: only when both dates are filled and valid
    if (datesValid) {
      filters.push({
        $or: [
          { echeance: { $gte: dateFrom, $lte: dateTo } },
          { issueDate: { $gte: dateFrom, $lte: dateTo } },
        ],
      });
    }

    if (!filters.length) return undefined;
    return { filters: filters.length === 1 ? filters[0] : { $and: filters } };
  }, [debouncedSearch, typeFilter, statusFilter, selectedClient?.id, datesValid, dateFrom, dateTo]);

  const { data = [], isLoading, isError, refetch, isFetching } = usePaymentItems({ params: queryParams });
  const { data: settings } = useSettings();
  const defaultCurrency = useDefaultCurrency();
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();
  const deleteMutation = useDeletePaymentItem();
  const softDeleteMutation = useSoftDeletePaymentItem();

  // Client lookup: limit to 10 on initial load, dynamic on search
  const { data: remoteClients = [], isFetching: isClientLookupLoading } = useQuery({
    queryKey: ['clients', 'payment-items-filter-lookup', debouncedClientSearchInput],
    queryFn: () => clientService.lookup(debouncedClientSearchInput, debouncedClientSearchInput.trim() ? 50 : 10),
    staleTime: 30_000,
  });

  const clientFilterOptions = useMemo(() => {
    if (!selectedClient) return remoteClients;
    return remoteClients.some((c) => c.id === selectedClient.id)
      ? remoteClients
      : [selectedClient, ...remoteClients];
  }, [remoteClients, selectedClient]);

  // No local filtering — all filtering is server-side
  const filteredRows = data;

  const columns: GridColDef<PaymentItem>[] = [
    {
      field: 'referenceNumber',
      headerName: 'Référence',
      flex: 1.2,
      valueGetter: ({ row }) => getPaymentItemReference(row),
      renderCell: ({ row }) => (
        <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.84rem' }}>
          {getPaymentItemReference(row)}
        </Typography>
      ),
    },
    {
      field: 'clientName',
      headerName: 'Client',
      flex: 1.2,
      valueGetter: ({ row }) => getPaymentItemClientPrimary(row.client),
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.35, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.83rem', lineHeight: 1.3, whiteSpace: 'normal' }}>
            {getPaymentItemClientPrimary(row.client)}
          </Typography>
          {getPaymentItemClientSecondary(row.client) ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem', mt: 0.2, lineHeight: 1.3, whiteSpace: 'normal' }}>
              {getPaymentItemClientSecondary(row.client)}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      valueGetter: ({ row }) => {
        if (row.type === 'AUTRE' && row.paymentMethod) {
          return paymentMethodConfig[row.paymentMethod]?.label ?? row.paymentMethod;
        }
        return typeConfig[row.type]?.label ?? row.type;
      },
      renderCell: ({ row }) => {
        // Si type = AUTRE et qu'une méthode est renseignée, afficher la méthode
        if (row.type === 'AUTRE' && row.paymentMethod) {
          const pm = paymentMethodConfig[row.paymentMethod];
          if (pm) return <ColoredChip icon={pm.icon} label={pm.label} color={pm.color} bg={pm.bg} />;
        }
        const tc = typeConfig[row.type] ?? typeConfig.AUTRE;
        return <ColoredChip icon={tc.icon} label={tc.label} color={tc.color} bg={tc.bg} />;
      },
    },
    {
      field: 'direction',
      headerName: 'Sens',
      flex: 0.5,
      renderCell: ({ row }) => {
        const isIn = row.direction === 'IN';
        const color = isIn ? '#059669' : '#DC2626';
        const bg    = isIn ? '#ECFDF5' : '#FEF2F2';
        const Icon  = isIn ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
        return (
          <Tooltip title={isIn ? 'Entrant' : 'Sortant'} arrow>
            <Box sx={{
              width: 24, height: 24, borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: bg, color, flexShrink: 0,
            }}>
              <Icon sx={{ fontSize: 14 }} />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Montant',
      flex: 1,
      renderCell: ({ row }) => (
        <Typography sx={{ fontFamily: numericFont, fontWeight: 700, color: row.direction === 'IN' ? brandColors.credit : brandColors.debit, fontSize: '0.84rem' }}>
          {row.direction === 'IN' ? '+' : '-'}{formatCurrency(row.amount, getPaymentItemCurrency(row))}
        </Typography>
      ),
    },
    {
      field: 'effectiveDate',
      headerName: 'Échéance / émission',
      flex: 1,
      valueGetter: ({ row }) => getPaymentItemEffectiveDate(row) ? formatDate(getPaymentItemEffectiveDate(row)) : '—',
    },
    {
      field: 'status',
      headerName: 'Statut',
      flex: 1,
      valueGetter: ({ row }) => getPaymentItemStatusLabel(row.status),
      renderCell: ({ row }) => {
        const label = getPaymentItemStatusLabel(row.status) as string;
        const sc = statusConfig[label] ?? { color: brandColors.slate[500], bg: brandColors.slate[100], icon: CheckCircleOutlineRoundedIcon };
        return <ColoredChip icon={sc.icon} label={label} color={sc.color} bg={sc.bg} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center" sx={{ width: '100%' }}>
          <Tooltip title="Modifier le paiement" arrow>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setEditing(row);
                setOpenForm(true);
              }}
              sx={actionIconButton('#EAB308')}
            >
              <EditRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer le paiement" arrow>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setDeleting(row);
              }}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: alpha('#ef5350', 0.08),
                color: '#c62828',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha('#ef5350', 0.18),
                  color: '#b71c1c',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Chèques / Traites"
        subtitle="Suivi des échéances, statuts, montants et relations clients/comptes"
        count={data.length}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setOpenForm(true); }}>Ajouter un paiement</Button>}
      />
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><SearchField value={search} onChange={setSearch} placeholder="Recherche : référence, tireur, tiré…" /></Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value) {
                        return (
                          <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1.35 }}>
                            Tous les types
                          </Typography>
                        );
                      }

                      const tc = typeConfig[value as string] ?? typeConfig.AUTRE;
                      return <ColoredChip icon={tc.icon} label={tc.label} color={tc.color} bg={tc.bg} />;
                    },
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '22px',
                      py: 1.05,
                      pr: typeFilter ? 8 : 4.5,
                    },
                  }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontWeight: 500 }}>
                      Tous les types
                    </Typography>
                  </MenuItem>
                  {Object.entries(typeConfig).map(([key, tc]) => (
                    <MenuItem key={key} value={key}>
                      <ColoredChip icon={tc.icon} label={tc.label} color={tc.color} bg={tc.bg} />
                    </MenuItem>
                  ))}
                </TextField>

                {typeFilter && (
                  <Tooltip title="Vider le type" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setTypeFilter('')}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      sx={{
                        position: 'absolute',
                        right: 28,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24,
                        height: 24,
                        color: brandColors.debit,
                        backgroundColor: alpha(brandColors.debit, 0.08),
                        border: `1px solid ${alpha(brandColors.debit, 0.14)}`,
                        '&:hover': {
                          backgroundColor: alpha(brandColors.debit, 0.14),
                          borderColor: alpha(brandColors.debit, 0.24),
                        },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  select
                  label="Statut"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value) {
                        return (
                          <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1.35 }}>
                            Tous les statuts
                          </Typography>
                        );
                      }

                      const label = getPaymentItemStatusLabel(value as string) as string;
                      const sc = statusConfig[label] ?? {
                        color: brandColors.slate[500],
                        bg: brandColors.slate[100],
                        icon: CheckCircleOutlineRoundedIcon,
                      };

                      return <ColoredChip icon={sc.icon} label={label} color={sc.color} bg={sc.bg} />;
                    },
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '22px',
                      py: 1.05,
                      pr: statusFilter ? 8 : 4.5,
                    },
                  }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontWeight: 500 }}>
                      Tous les statuts
                    </Typography>
                  </MenuItem>
                  {paymentItemStatusOptions.map((status) => {
                    const sc = statusConfig[status.value] ?? {
                      color: brandColors.slate[500],
                      bg: brandColors.slate[100],
                      icon: CheckCircleOutlineRoundedIcon,
                    };

                    return (
                      <MenuItem key={status.value} value={status.value}>
                        <ColoredChip icon={sc.icon} label={status.label} color={sc.color} bg={sc.bg} />
                      </MenuItem>
                    );
                  })}
                </TextField>

                {statusFilter && (
                  <Tooltip title="Vider le statut" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setStatusFilter('')}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      sx={{
                        position: 'absolute',
                        right: 28,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24,
                        height: 24,
                        color: brandColors.debit,
                        backgroundColor: alpha(brandColors.debit, 0.08),
                        border: `1px solid ${alpha(brandColors.debit, 0.14)}`,
                        '&:hover': {
                          backgroundColor: alpha(brandColors.debit, 0.14),
                          borderColor: alpha(brandColors.debit, 0.24),
                        },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <ClientAutocompleteField
                value={selectedClient}
                inputValue={clientSearchInput}
                options={clientFilterOptions}
                loading={isClientLookupLoading}
                label="Client"
                placeholder="Rechercher par nom, société ou code…"
                onInputChange={(value, reason) => {
                  if (reason === 'input') { setClientSearchInput(value); return; }
                  if (reason === 'clear') { setClientSearchInput(''); return; }
                  setClientSearchInput(value);
                }}
                onChange={(value) => {
                  setSelectedClient(value);
                  setClientSearchInput(value ? getClientLabel(value) : '');
                }}
                noOptionsText="Aucun client trouvé"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date min"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ onClick: (e) => (e.target as HTMLInputElement).showPicker?.() }}
                size="small"
                error={!!dateError && !!dateFrom}
                sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date max"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ onClick: (e) => (e.target as HTMLInputElement).showPicker?.() }}
                size="small"
                error={!!dateError && !!dateTo}
                helperText={dateError || (datesPartial ? 'Saisir les deux dates pour filtrer par période' : '')}
                sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' } }}
              />
            </Grid>
            {(dateFrom || dateTo) && (
              <Grid item xs={12} md="auto" sx={{ display: 'flex', alignItems: 'flex-start', pt: { xs: 0, md: '8px !important' } }}>
                <Tooltip title="Effacer le filtre par date" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setDateError('');
                    }}
                    sx={{
                      border: `1px solid`,
                      borderColor: 'divider',
                      borderRadius: '8px',
                      color: 'text.secondary',
                      '&:hover': { borderColor: 'error.main', color: 'error.main', backgroundColor: 'error.50' },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
            {isFetching && !isLoading && (
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Mise à jour des résultats…</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3.5 }, '&:last-child': { pb: { xs: 2, md: 3.5 } } }}>
          {filteredRows.length ? (
            <div style={{ height: 620 }}>
              <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick />
            </div>
          ) : (
            <EmptyState title="Aucun élément trouvé" />
          )}
        </CardContent>
      </Card>

      <FormDialog open={openForm} title={editing ? 'Modifier le paiement' : 'Nouveau paiement'} onClose={() => setOpenForm(false)}>
        <PaymentItemForm
          defaultValues={editing ? {
            ...editing,
            status: getPaymentItemStatusLabel(editing.status) as any,
            client: editing.client?.id,
            account: getPaymentItemAccount(editing)?.id,
          } as any : undefined}
          defaultCurrency={defaultCurrency}
          defaultAlertDays={settings?.alertDaysBefore}
          initialClient={editing?.client ?? null}
          initialAccount={editing ? getPaymentItemAccount(editing) : null}
          companyName={settings?.companyName || ''}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setOpenForm(false); setEditing(null); }}
          onSubmit={async (values) => {
            const payload = {
              ...values,
              referenceNumber: buildPaymentItemReference(values.type, values.direction),
              paymentMethod: values.type === 'AUTRE' ? (values.paymentMethod || null) : null,
              supprimer: false,
            };

            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, payload: payload as any });
            } else {
              await createMutation.mutateAsync(payload as any);
            }
            setOpenForm(false);
            setEditing(null);
          }}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Archiver ce paiement ?"
        description="Ce paiement sera masqué de la liste. Il ne sera pas supprimé définitivement de la base de données."
        confirmLabel="Archiver"
        loading={softDeleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await softDeleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}
