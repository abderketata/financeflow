import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
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
import { StatusChip } from '@/components/ui/StatusChip';
import { PaymentItemForm } from '@/modules/payment-items/components/PaymentItemForm';
import { usePaymentItems, useCreatePaymentItem, useDeletePaymentItem, useUpdatePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { clientService } from '@/modules/clients/services/client.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Client, PaymentItem } from '@/types/domain';
import { ClientAutocompleteField, getClientLabel } from '@/components/ui/EntityAutocompleteFields';
import { formatCurrency, formatDate, normalizeText } from '@/utils/format';
import { brandColors, numericFont } from '@/app/theme';
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

export default function PaymentItemsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [deleting, setDeleting] = useState<PaymentItem | null>(null);
  const debouncedClientSearchInput = useDebouncedValue(clientSearchInput, 350);
  const { data = [], isLoading, isError, refetch } = usePaymentItems();
  const { data: settings } = useSettings();
  const defaultCurrency = useDefaultCurrency();
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();
  const deleteMutation = useDeletePaymentItem();
  const { data: remoteClients = [], isFetching: isClientLookupLoading } = useQuery({
    queryKey: ['clients', 'payment-items-filter-lookup', debouncedClientSearchInput],
    queryFn: () => clientService.lookup(debouncedClientSearchInput, 50),
    staleTime: 30_000,
  });


  const clientFilterOptions = useMemo(() => {
    if (!selectedClient) {
      return remoteClients;
    }

    return remoteClients.some((client) => client.id === selectedClient.id)
      ? remoteClients
      : [selectedClient, ...remoteClients];
  }, [remoteClients, selectedClient]);

  const filteredRows = useMemo(() => data.filter((item) => {
    const account = getPaymentItemAccount(item);
    const searchOk = [
      getPaymentItemReference(item),
      item.type,
      getPaymentItemStatusLabel(item.status),
      getPaymentItemClientPrimary(item.client),
      getPaymentItemClientSecondary(item.client),
      getPaymentItemAccountPrimary(account),
      getPaymentItemAccountSecondary(account),
      item.drawer,
      item.drawee,
    ].map(normalizeText).join(' ').includes(normalizeText(search));
    const typeOk = !typeFilter || item.type === typeFilter;
    const statusOk = !statusFilter || normalizeText(getPaymentItemStatusLabel(item.status)) === normalizeText(statusFilter);
    const clientOk = !selectedClient?.id || item.client?.id === selectedClient.id;
    const effectiveDate = getPaymentItemEffectiveDate(item) ? new Date(getPaymentItemEffectiveDate(item)).getTime() : 0;
    const fromOk = !dateFrom || effectiveDate >= new Date(dateFrom).getTime();
    const toOk = !dateTo || effectiveDate <= new Date(dateTo).getTime();
    return searchOk && typeOk && statusOk && clientOk && fromOk && toOk;
  }), [selectedClient?.id, data, dateFrom, dateTo, search, statusFilter, typeFilter]);

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
    { field: 'type', headerName: 'Type', flex: 0.8, renderCell: ({ row }) => <StatusChip status={row.type} /> },
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
    { field: 'status', headerName: 'Statut', flex: 1, renderCell: ({ row }) => <StatusChip status={getPaymentItemStatusLabel(row.status)} /> },
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
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: alpha('#f59e0b', 0.1),
                color: '#b45309',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha('#f59e0b', 0.22),
                  color: '#92400e',
                  transform: 'scale(1.1)',
                },
              }}
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
        count={filteredRows.length}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setOpenForm(true); }}>Ajouter un paiement</Button>}
      />
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><SearchField value={search} onChange={setSearch} placeholder="Recherche globale..." /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem><MenuItem value="CHEQUE">Chèque</MenuItem><MenuItem value="TRAITE">Traite</MenuItem><MenuItem value="AUTRE">Autre</MenuItem></TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem>{paymentItemStatusOptions.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}>
              <ClientAutocompleteField
                value={selectedClient}
                inputValue={clientSearchInput}
                options={clientFilterOptions}
                loading={isClientLookupLoading}
                label="Client"
                placeholder="Rechercher par nom, société ou code…"
                onInputChange={(value, reason) => {
                  if (reason === 'input') {
                    setClientSearchInput(value);
                    return;
                  }
                  if (reason === 'clear') {
                    setClientSearchInput('');
                    return;
                  }
                  // reason === 'reset': accept MUI's synced label
                  setClientSearchInput(value);
                }}
                onChange={(value) => {
                  setSelectedClient(value);
                  setClientSearchInput(value ? getClientLabel(value) : '');
                }}
                noOptionsText="Aucun client trouvé"
              />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Date min" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Date max" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" /></Grid>
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
          onSubmit={async (values) => {
            const payload = {
              ...values,
              referenceNumber: buildPaymentItemReference(values.type, values.direction),
              paymentMethod: values.type === 'AUTRE' ? (values.paymentMethod || null) : null,
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
        title="Supprimer ce paiement ?"
        description="Cette action est irréversible."
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}
