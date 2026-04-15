import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { FormDialog } from '@/components/ui/FormDialog';
import { useAlertPaymentItems } from '@/modules/alerts/hooks/useAlerts';
import { PaymentItem, Alert } from '@/types/domain';
import { brandColors, numericFont } from '@/app/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  getPaymentItemAccount,
  getPaymentItemAccountPrimary,
  getPaymentItemClientPrimary,
  getPaymentItemCurrency,
  getPaymentItemEffectiveDate,
  getPaymentItemNotes,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
} from '@/modules/payment-items/utils/paymentItemPresentation';

interface AlertPaymentDetailsDialogProps {
  open: boolean;
  alert: Alert | null;
  onClose: () => void;
}

const statusStyles = new Map<string, { color: string; bg: string }>([
  ['Reçu', { color: '#2563EB', bg: '#EFF6FF' }],
  ['Déposé', { color: '#D97706', bg: '#FFFBEB' }],
  ['Payé', { color: '#059669', bg: '#ECFDF5' }],
  ['Rejeté', { color: '#DC2626', bg: '#FEF2F2' }],
  ['Annulé', { color: '#64748B', bg: '#F1F5F9' }],
  ['En retard', { color: '#DC2626', bg: '#FEF2F2' }],
]);

const getErrorMessage = (error: unknown) => {
  const value = error as any;
  return value?.error?.message || value?.message || 'Impossible de charger les payment-items associés à cette alerte.';
};

function DetailField({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Stack spacing={0.6}>
      <Stack direction="row" spacing={0.8} alignItems="center">
        {icon ? (
          <Box sx={{ color: brandColors.slate[400], display: 'flex', alignItems: 'center' }}>{icon}</Box>
        ) : null}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: '0.92rem', color: 'text.primary', fontWeight: 600, lineHeight: 1.45 }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

function PaymentStatusChip({ status }: { status?: string | null }) {
  const label = getPaymentItemStatusLabel(status) as string;
  const style = statusStyles.get(label) ?? { color: brandColors.slate[600], bg: brandColors.slate[100] };

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 26,
        borderRadius: '8px',
        fontSize: '0.74rem',
        fontWeight: 700,
        color: style.color,
        backgroundColor: style.bg,
      }}
    />
  );
}

function PaymentItemDetailsCard({ item }: { item: PaymentItem }) {
  const account = getPaymentItemAccount(item);
  const effectiveDate = getPaymentItemEffectiveDate(item) || item.paymentDate || item.createdAt;
  const title = item.reference?.trim() || getPaymentItemReference(item);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '18px',
        borderColor: alpha(brandColors.blue[600], 0.16),
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: '0.83rem', color: 'text.secondary' }}>
              Référence : {getPaymentItemReference(item)}
            </Typography>
          </Box>
          <PaymentStatusChip status={item.status} />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DetailField
              label="Montant"
              icon={<ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />}
              value={
                <Typography
                  component="span"
                  sx={{
                    fontFamily: numericFont,
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: item.direction === 'IN' ? brandColors.credit : brandColors.debit,
                  }}
                >
                  {item.direction === 'IN' ? '+' : '-'}{formatCurrency(item.amount, getPaymentItemCurrency(item))}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField
              label="Date"
              icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />}
              value={effectiveDate ? formatDate(effectiveDate) : '—'}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField
              label="Client"
              icon={<BusinessRoundedIcon sx={{ fontSize: 16 }} />}
              value={getPaymentItemClientPrimary(item.client)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField
              label="Compte"
              icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 16 }} />}
              value={getPaymentItemAccountPrimary(account)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField label="Type" value={item.type || '—'} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField label="Sens" value={item.direction === 'IN' ? 'Entrant' : item.direction === 'OUT' ? 'Sortant' : '—'} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField label="Banque" value={item.bankName} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField label="Numéro instrument" value={item.instrumentAccountNumber} />
          </Grid>
          <Grid item xs={12}>
            <DetailField label="Notes" icon={<NotesRoundedIcon sx={{ fontSize: 16 }} />} value={getPaymentItemNotes(item)} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export function AlertPaymentDetailsDialog({ open, alert, onClose }: AlertPaymentDetailsDialogProps) {
  const { data = [], isLoading, isError, error, refetch } = useAlertPaymentItems(alert?.id, open);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={alert ? `Détails paiement — ${alert.title}` : 'Détails paiement'}
    >
      <Stack spacing={2.25}>
        {alert ? (
          <Box
            sx={{
              borderRadius: '16px',
              p: 1.6,
              border: `1px solid ${alpha(brandColors.alert, 0.14)}`,
              backgroundColor: alpha(brandColors.alert, 0.04),
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: brandColors.alert, mb: 0.45 }}>
              Alerte sélectionnée
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.primary' }}>
              {alert.title}
            </Typography>
            <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', mt: 0.6, lineHeight: 1.55 }}>
              {alert.message}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                {formatDate(alert.triggerDate || alert.createdAt)}
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {isLoading ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
            <CircularProgress size={28} thickness={4.5} />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', fontWeight: 500 }}>
              Chargement des payment-items associés...
            </Typography>
          </Stack>
        ) : isError ? (
          <Box
            sx={{
              py: 4,
              px: 2,
              borderRadius: '16px',
              border: `1px solid ${alpha(brandColors.debit, 0.14)}`,
              backgroundColor: alpha(brandColors.debit, 0.03),
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                mx: 'auto',
                mb: 1.2,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandColors.debit,
                backgroundColor: alpha(brandColors.debit, 0.08),
              }}
            >
              <ErrorOutlineRoundedIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.7 }}>
              Erreur de chargement
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55, mb: 1.6 }}>
              {getErrorMessage(error)}
            </Typography>
            <Button variant="contained" onClick={() => refetch()}>
              Réessayer
            </Button>
          </Box>
        ) : !data.length ? (
          <Box
            sx={{
              py: 5,
              px: 2,
              borderRadius: '16px',
              border: `1px dashed ${alpha(brandColors.slate[300], 0.9)}`,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 1.2,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandColors.slate[400],
                backgroundColor: brandColors.slate[100],
              }}
            >
              <ReceiptLongRoundedIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.6 }}>
              Aucun payment item associé
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Cette alerte n’est liée à aucun paiement exploitable pour le moment.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.75}>
            {data.map((item) => (
              <PaymentItemDetailsCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Stack>
    </FormDialog>
  );
}

