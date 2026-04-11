import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, IconButton, Stack, Tooltip, Typography, alpha } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/FormDialog';
import { BankForm } from '@/modules/banks/components/BankForm';
import { useBanks, useCreateBank, useDeleteBank, useUpdateBank } from '@/modules/banks/hooks/useBanks';
import { Bank } from '@/types/domain';
import { normalizeText } from '@/utils/format';
import { actionIconButton, brandColors } from '@/app/theme';

export default function BanksPage() {
  const { data = [], isLoading, isError, refetch } = useBanks();
  const createMutation = useCreateBank();
  const updateMutation = useUpdateBank();
  const deleteMutation = useDeleteBank();
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [deleting, setDeleting] = useState<Bank | null>(null);

  const filteredRows = useMemo(() => data.filter((bank) => {
    const haystack = [bank.name, bank.code, bank.swiftCode].map(normalizeText).join(' ');
    return haystack.includes(normalizeText(search));
  }), [data, search]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Banque',
      flex: 1.3,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(brandColors.info, 0.12)}, ${alpha(brandColors.info, 0.06)})`,
              border: `1px solid ${alpha(brandColors.info, 0.1)}`,
              color: brandColors.info,
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {row.name?.substring(0, 2)?.toUpperCase() || '??'}
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.87rem', color: 'text.primary' }} noWrap>
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    { field: 'code', headerName: 'Code', flex: 1 },
    { field: 'swiftCode', headerName: 'SWIFT', flex: 1.2 },
    { field: 'notes', headerName: 'Notes', flex: 1.4 },
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
      <PageHeader title="Banques" subtitle="Gestion des établissements bancaires" count={filteredRows.length} action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setOpenForm(true); }}>Ajouter une banque</Button>} />
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            <SearchField value={search} onChange={setSearch} placeholder="Rechercher une banque..." />
            {filteredRows.length ? (
              <div style={{ height: 600 }}>
                <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick />
              </div>
            ) : (
              <EmptyState title="Aucune banque trouvée" />
            )}
          </Stack>
        </CardContent>
      </Card>

      <FormDialog open={openForm} title={editing ? 'Modifier la banque' : 'Nouvelle banque'} onClose={() => setOpenForm(false)}>
        <BankForm
          defaultValues={editing || undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, payload: values });
            } else {
              await createMutation.mutateAsync(values);
            }
            setOpenForm(false);
            setEditing(null);
          }}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Supprimer cette banque ?"
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
