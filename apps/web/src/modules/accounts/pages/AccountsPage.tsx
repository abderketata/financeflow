import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import ToggleOffRoundedIcon from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MouseEvent as ReactMouseEvent, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/FormDialog';
import { StatusChip } from '@/components/ui/StatusChip';
import { AccountDetailsDrawer } from '@/modules/accounts/components/AccountDetailsDrawer';
import { AccountForm } from '@/modules/accounts/components/AccountForm';
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from '@/modules/accounts/hooks/useAccounts';
import { useBanks } from '@/modules/banks/hooks/useBanks';
import { useClients } from '@/modules/clients/hooks/useClients';
import { BankAccount } from '@/types/domain';
import { formatCurrency, normalizeText } from '@/utils/format';
import { actionIconButton, brandColors, numericFont } from '@/app/theme';
import {
  buildAccountSearchHaystack,
  getAccountBalanceValue,
  getAccountClientPresentation,
  getAccountFormDefaults,
  getAccountStatusKey,
} from '@/modules/accounts/utils/accountPresentation';

type PresenceFilter = '' | 'WITH' | 'WITHOUT';

export default function AccountsPage() {
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [ibanFilter, setIbanFilter] = useState<PresenceFilter>('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuAccount, setMenuAccount] = useState<BankAccount | null>(null);
  const { data = [], isLoading, isError, refetch } = useAccounts();
  const { data: banks = [] } = useBanks();
  const { data: clients = [], isLoading: isClientsLoading } = useClients({ enabled: openForm });
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const accountFormDefaults = useMemo(() => getAccountFormDefaults(editing), [editing]);
  const normalizedSearch = normalizeText(search);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((account) => getAccountStatusKey(account) === 'ACTIVE').length,
      inactive: data.filter((account) => getAccountStatusKey(account) === 'INACTIVE').length,
      linkedClients: data.filter((account) => account.client?.id).length,
    }),
    [data],
  );

  const availableBanks = useMemo(
    () => Array.from(new Map(data.filter((account) => account.bank?.id).map((account) => [account.bank!.id, account.bank!])).values()),
    [data],
  );

  const availableClients = useMemo(
    () => Array.from(new Map(data.filter((account) => account.client?.id).map((account) => [account.client!.id, account.client!])).values()),
    [data],
  );

  const availableCurrencies = useMemo(
    () => Array.from(new Set(data.map((account) => account.currency).filter(Boolean))).sort(),
    [data],
  );

  const filteredRows = useMemo(
    () => data.filter((account) => {
      const searchOk = !normalizedSearch || buildAccountSearchHaystack(account).includes(normalizedSearch);
      const bankOk = !bankFilter || String(account.bank?.id || '') === bankFilter;
      const clientOk = !clientFilter || String(account.client?.id || '') === clientFilter;
      const statusOk = !statusFilter || getAccountStatusKey(account) === statusFilter;
      const currencyOk = !currencyFilter || account.currency === currencyFilter;
      const ibanOk = !ibanFilter || (ibanFilter === 'WITH' ? Boolean(account.iban) : !account.iban);

      return searchOk && bankOk && clientOk && statusOk && currencyOk && ibanOk;
    }),
    [bankFilter, clientFilter, currencyFilter, data, ibanFilter, normalizedSearch, statusFilter],
  );

  const resetFilters = () => {
    setSearch('');
    setBankFilter('');
    setClientFilter('');
    setStatusFilter('');
    setCurrencyFilter('');
    setIbanFilter('');
  };

  const handleOpenForm = (account: BankAccount | null) => {
    setEditing(account);
    setOpenForm(true);
  };

  const handleOpenDetails = (account: BankAccount) => {
    setSelectedAccount(account);
  };

  const handleMenuOpen = (event: ReactMouseEvent<HTMLElement>, account: BankAccount) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuAccount(account);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuAccount(null);
  };

  const handleToggleStatus = async (account: BankAccount) => {
    const nextActive = getAccountStatusKey(account) !== 'ACTIVE';
    await updateMutation.mutateAsync({
      id: account.id,
      payload: { isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' } as any,
    });

    if (selectedAccount?.id === account.id) {
      setSelectedAccount({ ...selectedAccount, isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' });
    }
  };

  const columns: GridColDef<BankAccount>[] = [
    {
      field: 'bankName',
      headerName: 'Banque',
      flex: 0.95,
      minWidth: 150,
      valueGetter: ({ row }: { row: BankAccount }) => row.bank?.name || '—',
      renderCell: ({ row }: { row: BankAccount }) => (
        <Box sx={{ py: 0.35, minWidth: 0, width: '100%' }}>
          <Typography sx={{ fontSize: '0.83rem', color: row.bank?.name ? 'text.primary' : 'text.secondary', lineHeight: 1.35, fontWeight: row.bank?.name ? 700 : 500 }} noWrap title={row.bank?.name || '—'}>
            {row.bank?.name || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: row.bank?.code ? 'text.secondary' : 'text.disabled', mt: 0.25, lineHeight: 1.35 }} noWrap title={row.bank?.code || 'Code banque non renseigné'}>
            {row.bank?.code || 'Code banque non renseigné'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'number',
      headerName: 'Numéro',
      flex: 1.15,
      minWidth: 190,
      sortable: false,
      renderCell: ({ row }: { row: BankAccount }) => (
        <Box sx={{ py: 0.35, minWidth: 0, width: '100%' }}>
          <Tooltip title={row.accountNumber}>
            <Typography sx={{ fontSize: '0.83rem', color: 'text.primary', lineHeight: 1.35, fontFamily: numericFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {row.accountNumber}
            </Typography>
          </Tooltip>
          <Tooltip title={row.iban || row.rib || 'IBAN / RIB non renseigné'}>
            <Typography sx={{ fontSize: '0.78rem', color: row.iban || row.rib ? 'text.secondary' : 'text.disabled', mt: 0.25, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {row.iban || row.rib || 'IBAN / RIB non renseigné'}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'clientName',
      headerName: 'Client',
      flex: 1,
      minWidth: 150,
      valueGetter: ({ row }: { row: BankAccount }) => getAccountClientPresentation(row).primary,
      renderCell: ({ row }: { row: BankAccount }) => {
        const clientPresentation = getAccountClientPresentation(row);

        return (
          <Box sx={{ py: 0.35 }}>
            <Typography sx={{ fontSize: '0.83rem', color: clientPresentation.primary === '—' ? 'text.secondary' : 'text.primary', lineHeight: 1.35, whiteSpace: 'normal', fontWeight: clientPresentation.primary === '—' ? 500 : 700 }}>
              {clientPresentation.primary}
            </Typography>
            {clientPresentation.secondary ? (
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25, lineHeight: 1.35, whiteSpace: 'normal' }}>
                {clientPresentation.secondary}
              </Typography>
            ) : null}
          </Box>
        );
      },
    },
    {
      field: 'currency',
      headerName: 'Devise',
      flex: 0.62,
      minWidth: 100,
      renderCell: ({ row }: { row: BankAccount }) => <StatusChip status={row.currency || 'TND'} />,
    },
    {
      field: 'balance',
      headerName: 'Solde',
      flex: 0.92,
      minWidth: 150,
      valueGetter: ({ row }: { row: BankAccount }) => formatCurrency(getAccountBalanceValue(row), row.currency || 'TND'),
      renderCell: ({ row }: { row: BankAccount }) => (
        <Typography sx={{ fontFamily: numericFont, fontWeight: 700, color: getAccountBalanceValue(row) >= 0 ? brandColors.credit : brandColors.debit }}>
          {formatCurrency(getAccountBalanceValue(row), row.currency || 'TND')}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      flex: 0.72,
      minWidth: 105,
      valueGetter: ({ row }: { row: BankAccount }) => getAccountStatusKey(row),
      renderCell: ({ row }: { row: BankAccount }) => <StatusChip status={getAccountStatusKey(row)} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.88,
      minWidth: 128,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }: { row: BankAccount }) => (
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center" sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityRoundedIcon />}
            onClick={(event) => {
              event.stopPropagation();
              handleOpenDetails(row);
            }}
            sx={{ minWidth: 0, px: 1.15 }}
          >
            Voir
          </Button>
          <IconButton size="small" onClick={(event) => handleMenuOpen(event, row)} sx={actionIconButton(brandColors.slate[600])}>
            <MoreHorizRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Comptes bancaires"
        subtitle="Pilotage des comptes bancaires, des rattachements et des soldes dans une vue claire et opérationnelle."
        count={filteredRows.length}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpenForm(null)}>Ajouter un compte</Button>}
      />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`Comptes (${stats.total})`} color="info" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Actifs (${stats.active})`} color="success" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Inactifs (${stats.inactive})`} variant="outlined" sx={{ fontWeight: 700, color: brandColors.slate[600] }} />
        <Chip label={`Liés à un client (${stats.linkedClients})`} variant="outlined" sx={{ fontWeight: 700, color: brandColors.blue[700] }} />
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 }, '&:last-child': { pb: { xs: 2, md: 2.25 } } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} lg={4.2}>
              <SearchField value={search} onChange={setSearch} placeholder="Rechercher par compte, numéro, IBAN, banque, client ou devise..." />
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Banque" value={bankFilter} onChange={(event) => setBankFilter(event.target.value)} size="small">
                <MenuItem value="">Toutes</MenuItem>
                {availableBanks.map((bank) => <MenuItem key={bank.id} value={String(bank.id)}>{bank.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Client" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} size="small">
                <MenuItem value="">Tous</MenuItem>
                {availableClients.map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.6}>
              <TextField select fullWidth label="Statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} size="small">
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="ACTIVE">Actifs</MenuItem>
                <MenuItem value="INACTIVE">Inactifs</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.6}>
              <TextField select fullWidth label="IBAN" value={ibanFilter} onChange={(event) => setIbanFilter(event.target.value as PresenceFilter)} size="small">
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="WITH">Avec IBAN</MenuItem>
                <MenuItem value="WITHOUT">Sans IBAN</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.6}>
              <TextField select fullWidth label="Devise" value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)} size="small">
                <MenuItem value="">Toutes</MenuItem>
                {availableCurrencies.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                  {filteredRows.length} compte(s) affiché(s). Cliquez sur « Voir » ou sur une ligne pour ouvrir la fiche complète.
                </Typography>
                <Button variant="text" size="small" startIcon={<FilterAltOffRoundedIcon />} onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
          {filteredRows.length ? (
            <Box sx={{ height: 'calc(100vh - 285px)', minHeight: 680 }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                disableRowSelectionOnClick
                getRowHeight={() => 'auto'}
                columnHeaderHeight={52}
                density="comfortable"
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  sorting: { sortModel: [{ field: 'bankName', sort: 'asc' }] },
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                onRowClick={({ row }: { row: BankAccount }) => handleOpenDetails(row)}
                sx={{
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                    maxHeight: 'none !important',
                    '&:hover': {
                      backgroundColor: alpha(brandColors.blue[50], 0.55),
                    },
                  },
                  '& .MuiDataGrid-cell': {
                    py: 1.2,
                    whiteSpace: 'normal !important',
                    overflow: 'visible',
                    lineHeight: '1.45 !important',
                  },
                  '& .MuiDataGrid-cellContent': {
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    textOverflow: 'clip',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'hidden',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    borderRadius: 2.5,
                  },
                }}
              />
            </Box>
          ) : (
            <EmptyState title="Aucun compte trouvé" message="Aucun compte ne correspond aux filtres actuels. Ajustez la recherche ou retirez certains filtres." />
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuAccount) {
              handleOpenDetails(menuAccount);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Voir le détail</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAccount) {
              handleOpenForm(menuAccount);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Modifier le compte</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (menuAccount) {
              await handleToggleStatus(menuAccount);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            {getAccountStatusKey(menuAccount) === 'INACTIVE' ? <ToggleOnRoundedIcon fontSize="small" /> : <ToggleOffRoundedIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{getAccountStatusKey(menuAccount) === 'INACTIVE' ? 'Activer le compte' : 'Désactiver le compte'}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAccount) {
              setDeleting(menuAccount);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      <AccountDetailsDrawer
        account={selectedAccount}
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        onEdit={(account) => {
          setSelectedAccount(null);
          handleOpenForm(account);
        }}
      />

      <FormDialog open={openForm} title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => { setOpenForm(false); setEditing(null); }}>
        <AccountForm
          defaultValues={accountFormDefaults}
          banks={banks}
          clients={clients}
          clientsLoading={isClientsLoading}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setOpenForm(false); setEditing(null); }}
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
        title="Supprimer ce compte ?"
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
