import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormDialog } from '@/components/ui/FormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusChip } from '@/components/ui/StatusChip';
import { AccountDetailsDrawer } from '@/modules/accounts/components/AccountDetailsDrawer';
import { AccountForm } from '@/modules/accounts/components/AccountForm';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/modules/accounts/hooks/useAccounts';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { useBanks } from '@/modules/banks/hooks/useBanks';
import { clientService } from '@/modules/clients/services/client.service';
import { useCreateClient } from '@/modules/clients/hooks/useClients';
import { buildClientMutationPayload } from '@/modules/clients/utils/clientPresentation';
import { Bank, BankAccount, Client } from '@/types/domain';
import { formatCurrency } from '@/utils/format';
import { actionIconButton, brandColors, numericFont } from '@/app/theme';
import {
  getAccountBalanceValue,
  getAccountClientPresentation,
  getAccountFormDefaults,
  getAccountStatusKey,
} from '@/modules/accounts/utils/accountPresentation';

export default function AccountsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [pendingToggleAccount, setPendingToggleAccount] = useState<BankAccount | null>(null);
  const debouncedSearchInput = useDebouncedValue(searchInput, 400);
  const debouncedClientSearchInput = useDebouncedValue(clientSearchInput, 350);
  const accountsQueryParams = useMemo(() => {
    const filters: Record<string, unknown>[] = [];

    if (searchQuery) {
      filters.push({
        $or: [
          { accountNumber: { $containsi: searchQuery } },
          { rib: { $containsi: searchQuery } },
          { iban: { $containsi: searchQuery } },
          { bank: { code: { $containsi: searchQuery } } },
          { client: { fullName: { $containsi: searchQuery } } },
          { client: { companyName: { $containsi: searchQuery } } },
        ],
      });
    }

    if (selectedBank?.id) {
      filters.push({ bank: { id: { $eq: selectedBank.id } } });
    }

    if (selectedClient?.id) {
      filters.push({ client: { id: { $eq: selectedClient.id } } });
    }

    if (statusFilter) {
      filters.push({ isActive: { $eq: statusFilter === 'ACTIVE' } });
    }

    if (!filters.length) {
      return undefined;
    }

    return {
      filters: filters.length === 1 ? filters[0] : { $and: filters },
    };
  }, [searchQuery, selectedBank?.id, selectedClient?.id, statusFilter]);
  const { data = [], isLoading, isError, refetch, isFetching } = useAccounts({ params: accountsQueryParams });
  const { data: banks = [] } = useBanks();
  const { data: remoteClients = [], isFetching: isClientLookupLoading } = useQuery({
    queryKey: ['clients', 'lookup', debouncedClientSearchInput],
    queryFn: () => clientService.lookup(debouncedClientSearchInput, 50),
    staleTime: 30_000,
  });
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const createClientMutation = useCreateClient();
  const defaultCurrency = useDefaultCurrency();
  const [clientFormSearchInput, setClientFormSearchInput] = useState('');
  const debouncedClientFormSearch = useDebouncedValue(clientFormSearchInput, 350);
  const { data: formClients = [], isLoading: isFormClientsLoading } = useQuery({
    queryKey: ['clients', 'form-lookup', debouncedClientFormSearch],
    queryFn: () => clientService.lookup(debouncedClientFormSearch, 50),
    enabled: openForm,
    staleTime: 30_000,
  });
  const accountFormDefaults = useMemo(() => getAccountFormDefaults(editing, defaultCurrency), [editing, defaultCurrency]);

  useEffect(() => {
    setSearchQuery(debouncedSearchInput.trim());
  }, [debouncedSearchInput]);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((account) => getAccountStatusKey(account) === 'ACTIVE').length,
      inactive: data.filter((account) => getAccountStatusKey(account) === 'INACTIVE').length,
      linkedClients: data.filter((account) => account.client?.id).length,
    }),
    [data],
  );

  const filteredRows = data;

  const clientFilterOptions = useMemo(() => {
    if (!selectedClient) {
      return remoteClients;
    }

    return remoteClients.some((client) => client.id === selectedClient.id)
      ? remoteClients
      : [selectedClient, ...remoteClients];
  }, [remoteClients, selectedClient]);

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedBank(null);
    setSelectedClient(null);
    setClientSearchInput('');
    setStatusFilter('');
  };

  const getBankOptionLabel = (bank: Bank) => `${bank.code || '—'} — ${bank.name}`;
  const getClientFilterPrimary = (client: Client) => client.companyName?.trim() || client.fullName?.trim() || client.code || 'Client';
  const getClientFilterSecondary = (client: Client) => client.companyName?.trim() ? client.fullName?.trim() || client.code || '' : client.code || '';

  const handleOpenForm = (account: BankAccount | null) => {
    setEditing(account);
    setOpenForm(true);
  };

  const handleOpenDetails = (account: BankAccount) => {
    setSelectedAccount(account);
  };


  const requestToggleStatus = (account: BankAccount) => {
    setPendingToggleAccount(account);
  };

  const confirmToggleStatus = async () => {
    if (!pendingToggleAccount) return;
    const account = pendingToggleAccount;
    const nextActive = getAccountStatusKey(account) !== 'ACTIVE';
    await updateMutation.mutateAsync({
      id: account.id,
      payload: { isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' } as any,
    });

    if (selectedAccount?.id === account.id) {
      setSelectedAccount({ ...selectedAccount, isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' });
    }
    setPendingToggleAccount(null);
  };

  const groupedAccounts = useMemo(() => {
    const groups = new Map<number, { clientId: number; primary: string; secondary: string; accounts: BankAccount[] }>();
    const unassigned: BankAccount[] = [];

    filteredRows.forEach((account) => {
      if (!account.client?.id) {
        unassigned.push(account);
        return;
      }

      const presentation = getAccountClientPresentation(account);
      const existing = groups.get(account.client.id);

      if (existing) {
        existing.accounts.push(account);
        return;
      }

      groups.set(account.client.id, {
        clientId: account.client.id,
        primary: presentation.primary,
        secondary: presentation.secondary,
        accounts: [account],
      });
    });

    return {
      clientGroups: Array.from(groups.values()).sort((a, b) => a.primary.localeCompare(b.primary, 'fr', { sensitivity: 'base' })),
      unassigned,
    };
  }, [filteredRows]);

  const isGroupExpanded = (groupKey: string) => expandedGroups[groupKey] ?? true;

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !(current[groupKey] ?? true),
    }));
  };

  const accountMetaLabelSx = {
    fontSize: '0.69rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  } as const;

  const ellipsisValueSx = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  } as const;

  const renderAccountLine = (account: BankAccount) => {
    const bankCode = account.bank?.code || '—';
    const secondaryNumber = account.iban || account.rib || 'IBAN / RIB non renseigné';

    return (
      <Box
        key={account.id}
        onClick={() => handleOpenDetails(account)}
        sx={{
          p: 0.85,
          borderRadius: 2,
          border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: alpha(brandColors.blue[50], 0.55),
            borderColor: alpha(brandColors.blue[300], 0.5),
            boxShadow: `0 8px 18px ${alpha(brandColors.slate[900], 0.04)}`,
          },
        }}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={1.55}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={accountMetaLabelSx}>Banque</Typography>
              <Typography sx={{ fontWeight: 800, color: bankCode === '—' ? 'text.secondary' : brandColors.blue[700], fontSize: '0.9rem' }} noWrap title={bankCode}>
                {bankCode}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3.6}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={accountMetaLabelSx}>Numéro</Typography>
              <Tooltip title={account.accountNumber}>
                <Typography sx={{ fontFamily: numericFont, fontWeight: 700, color: 'text.primary', fontSize: '0.88rem', ...ellipsisValueSx }}>
                  {account.accountNumber}
                </Typography>
              </Tooltip>
              <Tooltip title={secondaryNumber}>
                <Typography sx={{ color: secondaryNumber === 'IBAN / RIB non renseigné' ? 'text.disabled' : 'text.secondary', fontSize: '0.78rem', ...ellipsisValueSx }}>
                  {secondaryNumber}
                </Typography>
              </Tooltip>
            </Stack>
          </Grid>
          <Grid item xs={6} md={1.2}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={accountMetaLabelSx}>Devise</Typography>
              <Box><StatusChip status={account.currency || defaultCurrency} /></Box>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2.05}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={accountMetaLabelSx}>Solde</Typography>
              <Typography sx={{ fontFamily: numericFont, fontWeight: 800, color: getAccountBalanceValue(account) >= 0 ? brandColors.credit : brandColors.debit, fontSize: '0.9rem', ...ellipsisValueSx }} title={formatCurrency(getAccountBalanceValue(account), account.currency || defaultCurrency)}>
                {formatCurrency(getAccountBalanceValue(account), account.currency || defaultCurrency)}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={7} md={1.5}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={accountMetaLabelSx}>Statut</Typography>
              <Box><StatusChip status={getAccountStatusKey(account)} /></Box>
            </Stack>
          </Grid>
          <Grid item xs={5} md={2.1}>
            <Stack spacing={0.15} sx={{ minWidth: 0 }} alignItems="flex-end">
              <Typography sx={accountMetaLabelSx}>Actions</Typography>
              <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                <Tooltip title={getAccountStatusKey(account) === 'INACTIVE' ? 'Activer le compte' : 'Désactiver le compte'} arrow>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestToggleStatus(account);
                    }}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      backgroundColor: getAccountStatusKey(account) === 'INACTIVE' ? alpha('#4caf50', 0.1) : alpha('#ef5350', 0.08),
                      color: getAccountStatusKey(account) === 'INACTIVE' ? '#388e3c' : '#c62828',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: getAccountStatusKey(account) === 'INACTIVE' ? alpha('#4caf50', 0.22) : alpha('#ef5350', 0.18),
                        color: getAccountStatusKey(account) === 'INACTIVE' ? '#2e7d32' : '#b71c1c',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {getAccountStatusKey(account) === 'INACTIVE'
                      ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      : <PowerSettingsNewRoundedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier le compte" arrow>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenForm(account);
                    }}
                    sx={actionIconButton('#EAB308')}
                  >
                    <EditRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Voir le détail" arrow>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDetails(account);
                    }}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      backgroundColor: alpha('#2196f3', 0.1),
                      color: '#1565c0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha('#2196f3', 0.22),
                        color: '#0d47a1',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  };

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
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
        <Chip label={`Comptes (${stats.total})`} color="info" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Actifs (${stats.active})`} color="success" variant="filled" sx={{ fontWeight: 700 }} />
        <Chip label={`Inactifs (${stats.inactive})`} variant="outlined" sx={{ fontWeight: 700, color: brandColors.slate[600] }} />
        <Chip label={`Liés à un client (${stats.linkedClients})`} variant="outlined" sx={{ fontWeight: 700, color: brandColors.blue[700] }} />
      </Stack>

      <Card sx={{ mb: 1.25 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, '&:last-child': { pb: { xs: 1.5, md: 1.75 } } }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              alignItems: 'center',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'minmax(320px, 2.4fr) minmax(210px, 1.35fr) minmax(240px, 1.55fr) minmax(140px, 1fr) auto',
              },
            }}
          >
            <Box>
              <SearchField
                value={searchInput}
                onChange={setSearchInput}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setSearchQuery(searchInput.trim());
                  }
                }}
                placeholder="Rechercher en base par numéro, RIB, IBAN, code banque ou client..."
              />
            </Box>
            <Box>
              <Autocomplete
                options={banks}
                value={selectedBank}
                onChange={(_: SyntheticEvent, value: Bank | null) => setSelectedBank(value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={getBankOptionLabel}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                        {option.code || '—'}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                        {option.name}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Banque"
                    size="small"
                    placeholder="Code ou nom"
                    sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
                  />
                )}
              />
            </Box>
            <Box>
              <Autocomplete
                options={clientFilterOptions}
                value={selectedClient}
                inputValue={clientSearchInput}
                loading={isClientLookupLoading}
                filterOptions={(options) => options}
                onInputChange={(_, value) => setClientSearchInput(value)}
                onChange={(_: SyntheticEvent, value: Client | null) => setSelectedClient(value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => getClientFilterPrimary(option)}
                noOptionsText="Aucun client trouvé"
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                        {getClientFilterPrimary(option)}
                      </Typography>
                      {getClientFilterSecondary(option) ? (
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                          {getClientFilterSecondary(option)}
                        </Typography>
                      ) : null}
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Client"
                    size="small"
                    placeholder="Rechercher un client"
                    sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isClientLookupLoading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
            <Box>
              <TextField select fullWidth label="Statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="ACTIVE">Actifs</MenuItem>
                <MenuItem value="INACTIVE">Inactifs</MenuItem>
              </TextField>
            </Box>
          </Box>
          <Grid container spacing={1.5} alignItems="center" sx={{ mt: 0.1 }}>
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                  {filteredRows.length} compte(s) affiché(s). {isFetching ? 'Mise à jour des résultats en cours…' : 'Cliquez sur « Voir » ou sur une ligne pour ouvrir la fiche complète.'} Filtre client distant limité à 50 résultats.
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
        <CardContent sx={{ p: { xs: 1, md: 1.5 }, '&:last-child': { pb: { xs: 1, md: 1.5 } } }}>
          {filteredRows.length ? (
            <Stack spacing={0.75}>
              {groupedAccounts.clientGroups.map((group) => {
                const groupKey = `client-${group.clientId}`;
                const expanded = isGroupExpanded(groupKey);

                return (
                  <Card key={groupKey} sx={{ borderRadius: 2.5, border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`, boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)' }}>
                    <CardContent sx={{ p: { xs: 1.25, md: 1.5 }, '&:last-child': { pb: { xs: 1.25, md: 1.5 } } }}>
                      <Stack spacing={0.75}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.75} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.93rem', lineHeight: 1.25 }}>
                              {group.primary}
                            </Typography>
                            {group.secondary ? (
                              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.1 }}>
                                {group.secondary}
                              </Typography>
                            ) : null}
                          </Box>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Chip label={`${group.accounts.length} compte${group.accounts.length > 1 ? 's' : ''}`} color="info" variant="filled" size="small" sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }} />
                            <IconButton size="small" onClick={() => toggleGroup(groupKey)} sx={actionIconButton(brandColors.slate[600])}>
                              {expanded ? <KeyboardArrowUpRoundedIcon fontSize="small" /> : <KeyboardArrowDownRoundedIcon fontSize="small" />}
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Stack spacing={0.5}>
                            {group.accounts.map((account) => renderAccountLine(account))}
                          </Stack>
                        </Collapse>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}

              {groupedAccounts.unassigned.length ? (
                <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`, boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)' }}>
                  <CardContent sx={{ p: { xs: 1.25, md: 1.5 }, '&:last-child': { pb: { xs: 1.25, md: 1.5 } } }}>
                    <Stack spacing={0.75}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.75} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.93rem', lineHeight: 1.25 }}>
                            Comptes sans client
                          </Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.1 }}>
                            Comptes non rattachés, affichés individuellement.
                          </Typography>
                        </Box>
                        <Chip label={`${groupedAccounts.unassigned.length} compte${groupedAccounts.unassigned.length > 1 ? 's' : ''}`} variant="outlined" size="small" sx={{ fontWeight: 700, color: brandColors.slate[600], height: 22, fontSize: '0.75rem' }} />
                      </Stack>

                      <Stack spacing={0.5}>
                        {groupedAccounts.unassigned.map((account) => renderAccountLine(account))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}
            </Stack>
          ) : (
            <EmptyState title="Aucun compte trouvé" message="Aucun compte ne correspond aux filtres actuels. Ajustez la recherche ou retirez certains filtres." />
          )}
        </CardContent>
      </Card>


      <AccountDetailsDrawer
        account={selectedAccount}
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        onEdit={(account) => {
          setSelectedAccount(null);
          handleOpenForm(account);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingToggleAccount)}
        title={
          pendingToggleAccount && getAccountStatusKey(pendingToggleAccount) === 'ACTIVE'
            ? 'Désactiver ce compte'
            : 'Activer ce compte'
        }
        description={(() => {
          if (!pendingToggleAccount) return '';
          const clientName = pendingToggleAccount.client?.companyName?.trim()
            || pendingToggleAccount.client?.fullName?.trim()
            || 'Client inconnu';
          const rib = pendingToggleAccount.rib?.trim() || pendingToggleAccount.accountNumber || '—';
          const label = `${clientName} : ${rib}`;
          return getAccountStatusKey(pendingToggleAccount) === 'ACTIVE'
            ? `Voulez-vous vraiment désactiver le compte pour '${label}' ? Il ne sera plus utilisable pour les opérations.`
            : `Voulez-vous vraiment activer le compte pour '${label}' ? Il redeviendra disponible pour les opérations.`;
        })()}
        confirmLabel={
          pendingToggleAccount && getAccountStatusKey(pendingToggleAccount) === 'ACTIVE'
            ? 'Désactiver'
            : 'Activer'
        }
        confirmColor={
          pendingToggleAccount && getAccountStatusKey(pendingToggleAccount) === 'ACTIVE'
            ? 'error'
            : 'success'
        }
        loading={updateMutation.isPending}
        onClose={() => setPendingToggleAccount(null)}
        onConfirm={confirmToggleStatus}
      />

      <FormDialog open={openForm} title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => { setOpenForm(false); setEditing(null); }}>
        <AccountForm
          defaultValues={accountFormDefaults}
          defaultCurrency={defaultCurrency}
          banks={banks}
          clients={formClients}
          initialClient={editing?.client ?? null}
          clientsLoading={isFormClientsLoading}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setOpenForm(false); setEditing(null); }}
          onClientSearch={(q) => setClientFormSearchInput(q)}
          onQuickCreateClient={async (values) => {
            const payload = buildClientMutationPayload({
              ...values,
              isActive: true,
            });
            const created = await createClientMutation.mutateAsync(payload);
            return created as Client | null;
          }}
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
    </>
  );
}
