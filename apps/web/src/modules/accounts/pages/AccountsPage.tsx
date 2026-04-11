import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useMemo, useState } from 'react';
import { Button, Card, CardContent, IconButton, Stack, Tooltip, alpha } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/FormDialog';
import { AccountForm } from '@/modules/accounts/components/AccountForm';
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from '@/modules/accounts/hooks/useAccounts';
import { useBanks } from '@/modules/banks/hooks/useBanks';
import { useClients } from '@/modules/clients/hooks/useClients';
import { BankAccount } from '@/types/domain';
import { formatCurrency, normalizeText } from '@/utils/format';
import { actionIconButton, brandColors, numericFont } from '@/app/theme';

export default function AccountsPage() {
  const { data = [], isLoading, isError, refetch } = useAccounts();
  const { data: banks = [] } = useBanks();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);

  const filteredRows = useMemo(() => data.filter((account) => {
    const haystack = [account.label, account.accountNumber, account.bank?.name, account.client?.name].map(normalizeText).join(' ');
    return haystack.includes(normalizeText(search));
  }), [data, search]);

  const columns: GridColDef[] = [
    { field: 'label', headerName: 'Compte', flex: 1.2 },
    { field: 'accountNumber', headerName: 'Numéro', flex: 1.1 },
    { field: 'bankName', headerName: 'Banque', flex: 1.1, valueGetter: ({ row }) => row.bank?.name || '—' },
    { field: 'clientName', headerName: 'Client', flex: 1.1, valueGetter: ({ row }) => row.client?.name || '—' },
    { field: 'balance', headerName: 'Solde', flex: 1, valueGetter: ({ row }) => formatCurrency(row.balance, row.currency || 'TND') },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => { setEditing({ ...row, bank: row.bank?.id, client: row.client?.id } as any); setOpenForm(true); }} sx={actionIconButton(brandColors.blue[600])}>
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
        title="Comptes bancaires"
        subtitle="Gestion des comptes rattachés aux banques et clients"
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setOpenForm(true); }}>Ajouter un compte</Button>}
      />
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            <SearchField value={search} onChange={setSearch} placeholder="Rechercher un compte..." />
            {filteredRows.length ? (
              <div style={{ height: 600 }}>
                <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick />
              </div>
            ) : (
              <EmptyState title="Aucun compte trouvé" />
            )}
          </Stack>
        </CardContent>
      </Card>

      <FormDialog open={openForm} title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => setOpenForm(false)}>
        <AccountForm
          defaultValues={editing ? { ...editing, bank: (editing.bank as any)?.id || (editing as any).bank, client: (editing.client as any)?.id || (editing as any).client } : undefined}
          banks={banks}
          clients={clients}
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
