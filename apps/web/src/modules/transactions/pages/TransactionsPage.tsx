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
import { TransactionForm } from '@/modules/transactions/components/TransactionForm';
import { useTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/modules/transactions/hooks/useTransactions';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useAccounts } from '@/modules/accounts/hooks/useAccounts';
import { usePaymentItems } from '@/modules/payment-items/hooks/usePaymentItems';
import { Transaction } from '@/types/domain';
import { formatCurrency, formatDate, normalizeText } from '@/utils/format';
import { actionIconButton, brandColors, numericFont } from '@/app/theme';
import { getPaymentItemReference } from '@/modules/payment-items/utils/paymentItemPresentation';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const { data = [], isLoading, isError, refetch } = useTransactions();
  const { data: clients = [], isLoading: isClientsLoading } = useClients({ enabled: openForm });
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccounts({ enabled: openForm });
  const { data: paymentItems = [], isLoading: isPaymentItemsLoading } = usePaymentItems({ enabled: openForm });
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const availableClients = useMemo(
    () => Array.from(new Map(data.filter((item) => item.client?.id).map((item) => [item.client!.id, item.client!])).values()),
    [data],
  );

  const availableAccounts = useMemo(
    () => Array.from(new Map(data.filter((item) => item.bankAccount?.id).map((item) => [item.bankAccount!.id, item.bankAccount!])).values()),
    [data],
  );

  const filteredRows = useMemo(() => data.filter((item) => {
    const searchOk = [item.label, item.operationType, item.client?.name, item.bankAccount?.label, getPaymentItemReference(item.paymentItem)].map(normalizeText).join(' ').includes(normalizeText(search));
    const typeOk = !typeFilter || item.operationType === typeFilter;
    const clientOk = !clientFilter || String(item.client?.id || '') === clientFilter;
    const accountOk = !accountFilter || String(item.bankAccount?.id || '') === accountFilter;
    const currentDate = item.operationDate ? new Date(item.operationDate).getTime() : 0;
    const fromOk = !dateFrom || currentDate >= new Date(dateFrom).getTime();
    const toOk = !dateTo || currentDate <= new Date(dateTo).getTime();
    return searchOk && typeOk && clientOk && accountOk && fromOk && toOk;
  }), [accountFilter, clientFilter, data, dateFrom, dateTo, search, typeFilter]);

  const columns: GridColDef[] = [
    { field: 'label', headerName: 'Libellé', flex: 1.3 },
    { field: 'operationType', headerName: 'Type', flex: 0.9, renderCell: ({ row }) => <StatusChip status={row.operationType} /> },
    {
      field: 'amount',
      headerName: 'Montant',
      flex: 1,
      renderCell: ({ row }) => (
        <span style={{ fontFamily: numericFont, fontWeight: 600, color: row.operationType === 'CREDIT' ? brandColors.credit : brandColors.debit }}>
          {row.operationType === 'CREDIT' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    { field: 'operationDate', headerName: 'Date', flex: 1, valueGetter: ({ row }) => formatDate(row.operationDate) },
    { field: 'clientName', headerName: 'Client', flex: 1, valueGetter: ({ row }) => row.client?.name || '—' },
    { field: 'accountName', headerName: 'Compte', flex: 1, valueGetter: ({ row }) => row.bankAccount?.label || '—' },
    { field: 'paymentItemRef', headerName: 'Paiement lié', flex: 1, valueGetter: ({ row }) => getPaymentItemReference(row.paymentItem) },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => { setEditing(row); setOpenForm(true); }} sx={actionIconButton(brandColors.blue[600])}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" onClick={() => setDeleting(row)} sx={actionIconButton(brandColors.debit)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
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
        title="Débits / Crédits"
        subtitle="Gestion des opérations financières liées ou non à un paiement"
        count={filteredRows.length}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setOpenForm(true); }}>Ajouter une opération</Button>}
      />
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><SearchField value={search} onChange={setSearch} placeholder="Recherche globale..." /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} size="small"><MenuItem value="">Tous</MenuItem><MenuItem value="DEBIT">Débit</MenuItem><MenuItem value="CREDIT">Crédit</MenuItem></TextField></Grid>
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
            <EmptyState title="Aucune opération trouvée" />
          )}
        </CardContent>
      </Card>

      <FormDialog open={openForm} title={editing ? 'Modifier l\'opération' : 'Nouvelle opération'} onClose={() => setOpenForm(false)}>
        <TransactionForm
          defaultValues={editing ? { ...editing, client: editing.client?.id, bankAccount: editing.bankAccount?.id, paymentItem: editing.paymentItem?.id } as any : undefined}
          clients={clients}
          accounts={accounts}
          paymentItems={paymentItems}
          clientsLoading={isClientsLoading}
          accountsLoading={isAccountsLoading}
          paymentItemsLoading={isPaymentItemsLoading}
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
        title="Supprimer cette opération ?"
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
