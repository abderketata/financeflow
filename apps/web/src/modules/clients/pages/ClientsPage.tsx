import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import ToggleOffRoundedIcon from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Avatar,
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
  Typography,
  alpha,
} from '@mui/material';
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormDialog } from '@/components/ui/FormDialog';
import { StatusChip } from '@/components/ui/StatusChip';
import { ClientDetailsDrawer } from '@/modules/clients/components/ClientDetailsDrawer';
import { ClientForm } from '@/modules/clients/components/ClientForm';
import { useClients, useCreateClient, useUpdateClient } from '@/modules/clients/hooks/useClients';
import { useAvailableAccounts, useCreateAccount } from '@/modules/accounts/hooks/useAccounts';
import { useBanks } from '@/modules/banks/hooks/useBanks';
import { Client, BankAccount } from '@/types/domain';
import { actionIconButton, brandColors } from '@/app/theme';
import {
  buildClientMutationPayload,
  getClientActivitySummary,
  getClientDisplayName,
  getClientFormDefaults,
  getClientInitials,
  getClientMetrics,
  getClientSecondaryName,
  getClientStatusKey,
  getDisplayValue,
} from '@/modules/clients/utils/clientPresentation';

type PresenceFilter = '' | 'WITH' | 'WITHOUT';

export default function ClientsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accountsFilter, setAccountsFilter] = useState<PresenceFilter>('');
  const [transactionsFilter, setTransactionsFilter] = useState<PresenceFilter>('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuClient, setMenuClient] = useState<Client | null>(null);
  const debouncedSearchInput = useDebouncedValue(searchInput, 400);
  const clientsQueryParams = useMemo(() => {
    if (!searchQuery) {
      return undefined;
    }

    return {
      filters: {
        $or: [
          { fullName: { $containsi: searchQuery } },
          { companyName: { $containsi: searchQuery } },
          { code: { $containsi: searchQuery } },
          { phone: { $containsi: searchQuery } },
          { email: { $containsi: searchQuery } },
          { accounts: { accountNumber: { $containsi: searchQuery } } },
          { accounts: { rib: { $containsi: searchQuery } } },
          { accounts: { iban: { $containsi: searchQuery } } },
          { transactions: { label: { $containsi: searchQuery } } },
          { paymentItems: { referenceNumber: { $containsi: searchQuery } } },
        ],
      },
    };
  }, [searchQuery]);
  const { data = [], isLoading, isError, isFetching, refetch } = useClients({ params: clientsQueryParams });
  const { data: availableAccounts = [], refetch: refetchAvailableAccounts } = useAvailableAccounts(editing?.id);
  const { data: banks = [] } = useBanks();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const createAccountMutation = useCreateAccount();
  const clientFormDefaults = useMemo(() => getClientFormDefaults(editing), [editing]);

  useEffect(() => {
    setSearchQuery(debouncedSearchInput.trim());
  }, [debouncedSearchInput]);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((client) => client.isActive !== false).length,
      inactive: data.filter((client) => client.isActive === false).length,
    }),
    [data],
  );

  const filteredRows = useMemo(
    () =>
      data.filter((client) => {
        const metrics = getClientMetrics(client);
        const typeOk = !typeFilter || client.type === typeFilter;
        const statusOk = !statusFilter || getClientStatusKey(client.isActive) === statusFilter;
        const accountsOk = !accountsFilter || (accountsFilter === 'WITH' ? metrics.accountsCount > 0 : metrics.accountsCount === 0);
        const transactionsOk = !transactionsFilter || (transactionsFilter === 'WITH' ? metrics.transactionsCount > 0 : metrics.transactionsCount === 0);

        return typeOk && statusOk && accountsOk && transactionsOk;
      }),
    [accountsFilter, data, statusFilter, transactionsFilter, typeFilter],
  );

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setAccountsFilter('');
    setTransactionsFilter('');
  };

  const handleOpenForm = (client: Client | null) => {
    setEditing(client);
    setOpenForm(true);
  };

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
  };

  const handleMenuOpen = (event: ReactMouseEvent<HTMLElement>, client: Client) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuClient(client);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuClient(null);
  };

  const handleToggleStatus = async (client: Client) => {
    await updateMutation.mutateAsync({
      id: client.id,
      payload: buildClientMutationPayload({ ...client, isActive: client.isActive === false }),
    });

    if (selectedClient?.id === client.id) {
      setSelectedClient({ ...selectedClient, isActive: client.isActive === false });
    }
  };

  const handleQuickCreateAccount = async (values: any): Promise<BankAccount | null | undefined> => {
    const payload = {
      label: values.label?.trim(),
      accountNumber: values.accountNumber?.trim(),
      iban: values.iban?.trim() || '',
      rib: values.rib?.trim() || '',
      currency: values.currency?.trim() || 'TND',
      openingBalance: Number(values.openingBalance ?? 0),
      currentBalance: Number(values.currentBalance ?? 0),
      balance: Number(values.currentBalance ?? 0),
      isActive: values.isActive ?? true,
      status: values.isActive !== false ? 'ACTIVE' : 'INACTIVE',
      bank: values.bank || undefined,
    };
    const created = await createAccountMutation.mutateAsync(payload as any);
    // Refresh available accounts list (filtered by current client context)
    await refetchAvailableAccounts();
    return created as BankAccount | null | undefined;
  };

  const columns: GridColDef<Client>[] = [
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.6,
      minWidth: 220,
      sortable: true,
      valueGetter: ({ row }: { row: Client }) => getClientDisplayName(row),
      renderCell: ({ row }: { row: Client }) => (
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0, width: '100%', py: 0.35 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              mt: 0.15,
              background: `linear-gradient(135deg, ${brandColors.blue[600]}, ${brandColors.blue[400]})`,
              boxShadow: `0 8px 18px ${alpha(brandColors.blue[500], 0.18)}`,
              fontSize: '0.76rem',
              flexShrink: 0,
            }}
          >
            {getClientInitials(row)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.88rem', lineHeight: 1.35, whiteSpace: 'normal' }}>
              {getClientDisplayName(row)}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.25, lineHeight: 1.35, whiteSpace: 'normal' }}>
              {getClientSecondaryName(row) || 'Aucune société renseignée'}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      flex: 1.1,
      minWidth: 170,
      sortable: false,
      renderCell: ({ row }: { row: Client }) => (
        <Box sx={{ py: 0.35 }}>
          <Typography sx={{ fontSize: '0.83rem', color: row.phone ? 'text.primary' : 'text.secondary', lineHeight: 1.35, whiteSpace: 'normal' }}>
            {getDisplayValue(row.phone, 'Téléphone non renseigné')}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: row.email ? 'text.secondary' : 'text.disabled', mt: 0.25, lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {getDisplayValue(row.email, 'Email non renseigné')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.62,
      minWidth: 105,
      renderCell: ({ row }: { row: Client }) => <StatusChip status={row.type} />,
    },
    {
      field: 'status',
      headerName: 'Statut',
      flex: 0.62,
      minWidth: 105,
      valueGetter: ({ row }: { row: Client }) => getClientStatusKey(row.isActive),
      renderCell: ({ row }: { row: Client }) => <StatusChip status={getClientStatusKey(row.isActive)} />,
    },
    {
      field: 'activity',
      headerName: 'Activité',
      flex: 1,
      minWidth: 170,
      sortable: false,
      renderCell: ({ row }: { row: Client }) => (
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.45, whiteSpace: 'normal' }}>
          {getClientActivitySummary(row)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.82,
      minWidth: 128,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }: { row: Client }) => (
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
          <IconButton
            size="small"
            onClick={(event) => handleMenuOpen(event, row)}
            sx={actionIconButton(brandColors.slate[600])}
          >
            <MoreHorizRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  if (isLoading) return <LoadingState message="Chargement des clients..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Gestion opérationnelle des clients, avec accès rapide aux détails, au statut et aux informations clés."
        count={filteredRows.length}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpenForm(null)}>
            Ajouter un client
          </Button>
        }
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`Clients (${stats.total})`} color="info" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Actifs (${stats.active})`} color="success" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Inactifs (${stats.inactive})`} variant="outlined" sx={{ fontWeight: 700, color: brandColors.slate[600] }} />
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 }, '&:last-child': { pb: { xs: 2, md: 2.25 } } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} lg={4.2}>
              <SearchField
                value={searchInput}
                onChange={setSearchInput}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setSearchQuery(searchInput.trim());
                  }
                }}
                placeholder="Rechercher en base par client, société, téléphone, email, compte ou transaction..."
              />
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} size="small">
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="INDIVIDUAL">Particulier</MenuItem>
                <MenuItem value="COMPANY">Société</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} size="small">
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="ACTIVE">Actifs</MenuItem>
                <MenuItem value="INACTIVE">Inactifs</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Comptes" value={accountsFilter} onChange={(event) => setAccountsFilter(event.target.value as PresenceFilter)} size="small">
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="WITH">Avec comptes</MenuItem>
                <MenuItem value="WITHOUT">Sans compte</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} lg={1.95}>
              <TextField select fullWidth label="Transactions" value={transactionsFilter} onChange={(event) => setTransactionsFilter(event.target.value as PresenceFilter)} size="small">
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="WITH">Avec transactions</MenuItem>
                <MenuItem value="WITHOUT">Sans transaction</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                  {filteredRows.length} client(s) affiché(s). {isFetching ? 'Mise à jour des résultats en cours…' : 'Cliquez sur "Voir" ou sur une ligne pour ouvrir la fiche complète.'}
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
                  sorting: { sortModel: [{ field: 'client', sort: 'asc' }] },
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                onRowClick={({ row }: { row: Client }) => handleOpenDetails(row)}
                sx={{
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                    maxHeight: 'none !important',
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
            <EmptyState
              title="Aucun client trouvé"
              message="Aucun client ne correspond aux critères actuels. Ajustez la recherche ou retirez certains filtres."
            />
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuClient) {
              handleOpenDetails(menuClient);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Voir le détail</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuClient) {
              handleOpenForm(menuClient);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Modifier la fiche</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (menuClient) {
              await handleToggleStatus(menuClient);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            {menuClient?.isActive === false ? <ToggleOnRoundedIcon fontSize="small" /> : <ToggleOffRoundedIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{menuClient?.isActive === false ? 'Activer le client' : 'Désactiver le client'}</ListItemText>
        </MenuItem>
      </Menu>

      <ClientDetailsDrawer
        client={selectedClient}
        open={Boolean(selectedClient)}
        onClose={() => setSelectedClient(null)}
        onEdit={(client) => {
          setSelectedClient(null);
          handleOpenForm(client);
        }}
      />

      <FormDialog open={openForm} title={editing ? 'Modifier le client' : 'Nouveau client'} onClose={() => setOpenForm(false)}>
        <ClientForm
          defaultValues={clientFormDefaults}
          availableAccounts={availableAccounts}
          banks={banks}
          mode={editing ? 'edit' : 'create'}
          loading={createMutation.isPending || updateMutation.isPending || createAccountMutation.isPending}
          onQuickCreateAccount={handleQuickCreateAccount}
          onCancel={() => { setOpenForm(false); setEditing(null); }}
          onSubmit={async (values) => {
            const { accountIds, ...clientValues } = values;
            const payload = {
              ...buildClientMutationPayload(clientValues),
              accounts: accountIds,
            };
            console.log('[ClientsPage] mode:', editing ? 'edit' : 'create');
            console.log('[ClientsPage] clientId:', editing?.id);
            console.log('[ClientsPage] payload:', payload);
            console.log('[ClientsPage] accounts:', accountIds);
            try {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              await refetch();
              setOpenForm(false);
              setEditing(null);
            } catch (error) {
              console.error('[ClientsPage] submit error:', error);
            }
          }}
        />
      </FormDialog>
    </>
  );
}
