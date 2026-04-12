import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useMemo, useState } from 'react';
import { Button, Card, CardContent, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, alpha } from '@mui/material';
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
import { useClients } from '@/modules/clients/hooks/useClients';
import { useAccounts } from '@/modules/accounts/hooks/useAccounts';
import { PaymentItem } from '@/types/domain';
import { formatCurrency, formatDate, normalizeText } from '@/utils/format';
import { brandColors, numericFont } from '@/app/theme';

export default function PaymentItemsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [deleting, setDeleting] = useState<PaymentItem | null>(null);
  const { data = [], isLoading, isError, refetch } = usePaymentItems();
  const { data: clients = [], isLoading: isClientsLoading } = useClients({ enabled: openForm });
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccounts({ enabled: openForm });
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();
  const deleteMutation = useDeletePaymentItem();

  const availableClients = useMemo(
    () => Array.from(new Map(data.filter((item) => item.client?.id).map((item) => [item.client!.id, item.client!])).values()),
    [data],
  );

  const availableAccounts = useMemo(
    () => Array.from(new Map(data.filter((item) => item.bankAccount?.id).map((item) => [item.bankAccount!.id, item.bankAccount!])).values()),
    [data],
  );

  const filteredRows = useMemo(() => data.filter((item) => {
    const searchOk = [item.reference, item.type, item.status, item.client?.name, item.bankAccount?.label].map(normalizeText).join(' ').includes(normalizeText(search));
    const typeOk = !typeFilter || item.type === typeFilter;
    const statusOk = !statusFilter || normalizeText(item.status) === normalizeText(statusFilter);
    const clientOk = !clientFilter || String(item.client?.id || '') === clientFilter;
    const accountOk = !accountFilter || String(item.bankAccount?.id || '') === accountFilter;
    const dueDate = item.dueDate ? new Date(item.dueDate).getTime() : 0;
    const fromOk = !dateFrom || dueDate >= new Date(dateFrom).getTime();
    const toOk = !dateTo || dueDate <= new Date(dateTo).getTime();
    return searchOk && typeOk && statusOk && clientOk && accountOk && fromOk && toOk;
  }), [accountFilter, clientFilter, data, dateFrom, dateTo, search, statusFilter, typeFilter]);

  const columns: GridColDef[] = [
    { field: 'reference', headerName: 'Référence', flex: 1.2 },
    { field: 'type', headerName: 'Type', flex: 0.8 },
    { field: 'direction', headerName: 'Sens', flex: 0.8 },
    {
      field: 'amount',
      headerName: 'Montant',
      flex: 1,
      renderCell: ({ row }) => (
        <span style={{ fontFamily: numericFont, fontWeight: 600, color: row.direction === 'IN' ? brandColors.credit : brandColors.debit }}>
          {row.direction === 'IN' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    { field: 'dueDate', headerName: 'Échéance', flex: 1, valueGetter: ({ row }) => formatDate(row.dueDate) },
    { field: 'status', headerName: 'Statut', flex: 1, renderCell: ({ row }) => <StatusChip status={row.status} /> },
    { field: 'clientName', headerName: 'Client', flex: 1, valueGetter: ({ row }) => row.client?.name || '—' },
    { field: 'accountName', headerName: 'Compte', flex: 1, valueGetter: ({ row }) => row.bankAccount?.label || '—' },
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
            <Grid item xs={12} md={2}><TextField fullWidth select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem><MenuItem value="CHEQUE">Chèque</MenuItem><MenuItem value="TRAITE">Traite</MenuItem></TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small" /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem>{availableClients.map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Compte" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem>{availableAccounts.map((account) => <MenuItem key={account.id} value={String(account.id)}>{account.label}</MenuItem>)}</TextField></Grid>
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
          defaultValues={editing ? { ...editing, client: editing.client?.id, bankAccount: editing.bankAccount?.id } as any : undefined}
          clients={clients}
          accounts={accounts}
          clientsLoading={isClientsLoading}
          accountsLoading={isAccountsLoading}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, payload: values as any });
            } else {
              await createMutation.mutateAsync(values as any);
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
