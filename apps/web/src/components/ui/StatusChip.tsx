import { Box, Chip, alpha } from '@mui/material';

const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default'; dotColor: string }> = {
  PAID:         { label: 'Payé',         color: 'success', dotColor: '#059669' },
  ENCASHED:     { label: 'Encaissé',     color: 'success', dotColor: '#059669' },
  DONE:         { label: 'Terminé',      color: 'success', dotColor: '#059669' },
  SETTLED:      { label: 'Réglé',        color: 'success', dotColor: '#059669' },
  VALIDATED:    { label: 'Validé',       color: 'success', dotColor: '#059669' },
  ACTIVE:       { label: 'Actif',        color: 'success', dotColor: '#059669' },
  RECONCILED:   { label: 'Rapproché',    color: 'success', dotColor: '#059669' },
  UNRECONCILED: { label: 'Non rapproché',color: 'warning', dotColor: '#D97706' },
  LU:           { label: 'Lue',          color: 'success', dotColor: '#059669' },
  CREDIT:       { label: 'Crédit',       color: 'success', dotColor: '#059669' },
  PENDING:      { label: 'En attente',   color: 'warning', dotColor: '#D97706' },
  IN_PROGRESS:  { label: 'En cours',     color: 'warning', dotColor: '#D97706' },
  SCHEDULED:    { label: 'Programmé',    color: 'warning', dotColor: '#D97706' },
  DRAFT:        { label: 'Brouillon',    color: 'warning', dotColor: '#D97706' },
  OUT:          { label: 'Sortant',      color: 'warning', dotColor: '#D97706' },
  INACTIVE:     { label: 'Inactif',      color: 'default', dotColor: '#94A3B8' },
  INDIVIDUAL:   { label: 'Particulier',  color: 'info',    dotColor: '#2563EB' },
  COMPANY:      { label: 'Société',      color: 'info',    dotColor: '#2563EB' },
  IN:           { label: 'Entrant',      color: 'info',    dotColor: '#2563EB' },
  CHEQUE:       { label: 'Chèque',       color: 'info',    dotColor: '#2563EB' },
  TRAITE:       { label: 'Traite',       color: 'info',    dotColor: '#2563EB' },
  OVERDUE:      { label: 'En retard',    color: 'error',   dotColor: '#DC2626' },
  LATE:         { label: 'En retard',    color: 'error',   dotColor: '#DC2626' },
  UNPAID:       { label: 'Impayé',       color: 'error',   dotColor: '#DC2626' },
  DEBIT:        { label: 'Débit',        color: 'error',   dotColor: '#DC2626' },
  REJECTED:     { label: 'Rejeté',       color: 'error',   dotColor: '#DC2626' },
};

const resolveStatus = (status: string) => {
  const normalized = status.toUpperCase();
  return statusMap[normalized] || { label: status, color: 'info' as const, dotColor: '#2563EB' };
};

export function StatusChip({ status }: { status?: string }) {
  const { label, color, dotColor } = resolveStatus(status || '');
  return (
    <Chip
      size="small"
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: `0 0 0 2px ${alpha(dotColor, 0.2)}`,
              flexShrink: 0,
            }}
          />
          {label}
        </Box>
      }
      color={color}
      variant="filled"
      sx={{
        fontWeight: 600,
        fontSize: '0.72rem',
        letterSpacing: '0.02em',
        borderRadius: '7px',
        height: 24,
        '.MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
}
