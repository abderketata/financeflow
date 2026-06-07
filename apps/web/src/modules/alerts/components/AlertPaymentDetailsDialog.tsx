import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import {
  Alert as MuiAlert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/FormDialog';
import { useAlertPaymentItems } from '@/modules/alerts/hooks/useAlerts';
import { useUpdatePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { Alert, PaymentItem, RelationCollection } from '@/types/domain';
import { brandColors, numericFont } from '@/app/theme';
import { formatAmountInWords, formatCurrency, formatDate } from '@/utils/format';
import { getAlertScheduledAt, getAlertSentAt } from '@/modules/alerts/utils/alertPresentation';
import {
  getPaymentItemClientPrimary,
  getPaymentItemCurrency,
  getPaymentItemNotes,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemTypeLabel,
  isPaymentItemClosedStatus,
} from '@/modules/payment-items/utils/paymentItemPresentation';

interface AlertPaymentDetailsDialogProps {
  open: boolean;
  alert: Alert | null;
  onClose: () => void;
}

type TargetStatus = 'Payé' | 'Annulé';

type FeedbackState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
};

const statusStyles = new Map<string, { color: string; bg: string }>([
  ['Reçu', { color: '#2563EB', bg: '#EFF6FF' }],
  ['Déposé', { color: '#D97706', bg: '#FFFBEB' }],
  ['Payé', { color: '#059669', bg: '#ECFDF5' }],
  ['Rejeté', { color: '#DC2626', bg: '#FEF2F2' }],
  ['Annulé', { color: '#64748B', bg: '#F1F5F9' }],
  ['En retard', { color: '#DC2626', bg: '#FEF2F2' }],
]);

const typeStyles: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  CHEQUE: { label: 'Chèque', color: '#D97706', bg: '#FFFBEB', icon: ReceiptLongRoundedIcon },
  TRAITE: { label: 'Traite', color: '#7C3AED', bg: '#F5F3FF', icon: DescriptionRoundedIcon },
  AUTRE: { label: 'Autre', color: '#64748B', bg: '#F1F5F9', icon: MoreHorizRoundedIcon },
};

const getErrorMessage = (error: unknown) => {
  const value = error as any;
  return value?.error?.message || value?.message || 'Impossible de charger les payment-items associés à cette alerte.';
};

const getMutationErrorMessage = (error: unknown) => {
  const value = error as any;
  return value?.error?.message || value?.message || 'Impossible de mettre à jour le statut du paiement.';
};


const hasDisplayValue = (value?: React.ReactNode) => value !== undefined && value !== null && value !== '' && value !== '—';

const replacePaymentItemInRelation = (relation: RelationCollection<PaymentItem> | undefined, updatedItem: PaymentItem) => {
  if (!relation) {
    return relation;
  }

  if (Array.isArray(relation)) {
    let changed = false;
    const nextRelation = relation.map((item) => {
      if (item.id !== updatedItem.id) {
        return item;
      }

      changed = true;
      return updatedItem;
    });

    return changed ? nextRelation : relation;
  }

  const currentItems = relation.data ?? [];
  let changed = false;
  const nextItems = currentItems.map((item) => {
    if (item.id !== updatedItem.id) {
      return item;
    }

    changed = true;
    return updatedItem;
  });

  return changed ? { ...relation, data: nextItems } : relation;
};

const patchAlertsWithUpdatedPaymentItem = (alerts: Alert[] | undefined, updatedItem: PaymentItem) =>
  alerts?.map((entry) => {
    const nextPaymentItem = entry.paymentItem?.id === updatedItem.id ? updatedItem : entry.paymentItem;
    const nextPaymentItems = replacePaymentItemInRelation(entry.paymentItems, updatedItem);

    if (nextPaymentItem === entry.paymentItem && nextPaymentItems === entry.paymentItems) {
      return entry;
    }

    return {
      ...entry,
      paymentItem: nextPaymentItem,
      paymentItems: nextPaymentItems,
    };
  });

function DetailField({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  if (!hasDisplayValue(value)) {
    return null;
  }

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
      <Typography sx={{ fontSize: '0.88rem', color: 'text.primary', fontWeight: 600, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
        {value}
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

function PaymentTypeInline({ item }: { item: PaymentItem }) {
  const config = typeStyles[item.type] ?? typeStyles.AUTRE;
  const Icon = config.icon;
  const label = getPaymentItemTypeLabel(item);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: config.bg,
          color: config.color,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 13 }} />
      </Box>
      <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: config.color }}>{label}</Typography>
    </Box>
  );
}

function PaymentItemDetailsCard({
  item,
  alert,
  onStatusAction,
  pendingStatus,
  loading,
}: {
  item: PaymentItem;
  alert: Alert;
  onStatusAction: (item: PaymentItem, status: TargetStatus) => void;
  pendingStatus?: TargetStatus | null;
  loading: boolean;
}) {
  const title = getPaymentItemReference(item);
  const currency = getPaymentItemCurrency(item);
  const amountInWords = formatAmountInWords(item.amount, currency);
  const paymentStatus = getPaymentItemStatusLabel(item.status) as string;
  const isClosed = isPaymentItemClosedStatus(item.status);
  const scheduledAt = formatDate(getAlertScheduledAt(alert));
  const sentAt = formatDate(getAlertSentAt(alert));
  const isIncoming = item.direction === 'IN';
  const DirectionIcon = isIncoming ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  const directionColor = isIncoming ? brandColors.credit : brandColors.debit;
  const directionBackground = alpha(directionColor, 0.12);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '18px',
        borderColor: alpha(brandColors.blue[600], 0.16),
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 1.75 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: directionBackground,
                  color: directionColor,
                  flexShrink: 0,
                }}
              >
                <DirectionIcon sx={{ fontSize: 15 }} />
              </Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
                {title}
              </Typography>
            </Stack>
          </Box>
          <PaymentStatusChip status={item.status} />
        </Stack>

        <Box
          sx={{
            mt: 1.35,
            p: 1.35,
            borderRadius: '14px',
            backgroundColor: alpha(item.direction === 'IN' ? brandColors.credit : brandColors.debit, 0.06),
            border: `1px solid ${alpha(item.direction === 'IN' ? brandColors.credit : brandColors.debit, 0.14)}`,
          }}
        >
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
            Montant
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              fontFamily: numericFont,
              fontSize: '1.18rem',
              fontWeight: 800,
              color: item.direction === 'IN' ? brandColors.credit : brandColors.debit,
            }}
          >
            {item.direction === 'IN' ? '+' : '-'}{formatCurrency(item.amount, currency)}
          </Typography>
          {amountInWords ? (
            <Typography sx={{ mt: 0.55, fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.45 }}>
              {amountInWords}
            </Typography>
          ) : null}
        </Box>

        <Divider sx={{ my: 1.45 }} />

        <Grid container spacing={1.35}>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Client"
              icon={<BusinessRoundedIcon sx={{ fontSize: 16 }} />}
              value={getPaymentItemClientPrimary(item.client)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Type" value={<PaymentTypeInline item={item} />} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Tireur" value={item.drawer} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Tiré" value={item.drawee} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Date d'émission" icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />} value={formatDate(item.issueDate)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Jours avant" value={typeof item.alertDaysBefore === 'number' ? `${item.alertDaysBefore} jour(s)` : '—'} />
          </Grid>
          <Grid item xs={12}>
            <DetailField label="Notes" icon={<NotesRoundedIcon sx={{ fontSize: 16 }} />} value={getPaymentItemNotes(item)} />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 1.45,
            p: 1.2,
            borderRadius: '12px',
            border: `1px solid ${alpha(brandColors.alert, 0.14)}`,
            backgroundColor: alpha(brandColors.alert, 0.04),
          }}
        >
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.85 }}>
            <NotificationsActiveRoundedIcon sx={{ fontSize: 16, color: brandColors.alert }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: brandColors.alert }}>
              Informations de l’alerte liée
            </Typography>
          </Stack>
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={4}>
              <DetailField label="Échéance" value={scheduledAt} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DetailField label="Date d’envoi" value={sentAt} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DetailField label="Lu" value={alert.isRead ? 'Oui' : 'Non'} />
            </Grid>
          </Grid>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 1.75, pb: 1.75, pt: 0, justifyContent: 'flex-end', alignItems: 'center', gap: 1.1, flexWrap: 'wrap' }}>
        {isClosed ? (
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: 'text.secondary', width: '100%', justifyContent: 'flex-end' }}>
            <InfoRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
              Ce paiement est déjà marqué comme {paymentStatus.toLowerCase()}.
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', ml: 'auto' }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelRoundedIcon />}
              onClick={() => onStatusAction(item, 'Annulé')}
              disabled={loading}
            >
              Annulé
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<PaidRoundedIcon />}
              onClick={() => onStatusAction(item, 'Payé')}
              disabled={loading}
            >
              Payé
            </Button>
          </Stack>
        )}

        {loading && pendingStatus ? (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600, width: '100%', textAlign: 'right' }}>
            Mise à jour vers “{pendingStatus}”…
          </Typography>
        ) : null}
      </CardActions>
    </Card>
  );
}

export function AlertPaymentDetailsDialog({ open, alert, onClose }: AlertPaymentDetailsDialogProps) {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error, refetch } = useAlertPaymentItems(alert?.id, open);
  const updatePaymentItemMutation = useUpdatePaymentItem();
  const [confirmAction, setConfirmAction] = useState<{ item: PaymentItem; status: TargetStatus } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ open: false, severity: 'success', message: '' });

  const handleClose = () => {
    setConfirmAction(null);
    onClose();
  };

  const syncCaches = (updatedItem: PaymentItem) => {
    if (!alert?.id) {
      return;
    }

    queryClient.setQueryData<PaymentItem[]>(['alerts', 'payment-items', alert.id], (current) => {
      if (!current?.length) {
        return [updatedItem];
      }

      let found = false;
      const nextItems = current.map((item) => {
        if (item.id !== updatedItem.id) {
          return item;
        }

        found = true;
        return updatedItem;
      });

      return found ? nextItems : [updatedItem, ...current];
    });

    queryClient.setQueryData<Alert[]>(['alerts'], (current) => patchAlertsWithUpdatedPaymentItem(current, updatedItem));
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      const updatedItem = await updatePaymentItemMutation.mutateAsync({
        id: confirmAction.item.id,
        payload: { status: confirmAction.status },
      });

      syncCaches((updatedItem ?? { ...confirmAction.item, status: confirmAction.status }) as PaymentItem);
      setFeedback({
        open: true,
        severity: 'success',
        message: `Le paiement ${getPaymentItemReference(confirmAction.item)} est maintenant “${confirmAction.status}”.`,
      });
      setConfirmAction(null);
    } catch (mutationError) {
      setFeedback({
        open: true,
        severity: 'error',
        message: getMutationErrorMessage(mutationError),
      });
    }
  };

  const pendingItemId = updatePaymentItemMutation.isPending ? confirmAction?.item.id : null;

  return (
    <>
      <FormDialog
        open={open}
        onClose={handleClose}
        title={alert ? `Détails paiement — ${alert.title}` : 'Détails paiement'}
      >
        <Stack spacing={1.5} sx={{ maxHeight: '72vh' }}>
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
              {alert
                ? data.map((item) => (
                    <PaymentItemDetailsCard
                      key={item.id}
                      item={item}
                      alert={alert}
                      onStatusAction={(targetItem, status) => setConfirmAction({ item: targetItem, status })}
                      pendingStatus={pendingItemId === item.id ? confirmAction?.status : null}
                      loading={pendingItemId === item.id}
                    />
                  ))
                : null}
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction ? `Marquer ${getPaymentItemReference(confirmAction.item)} comme ${confirmAction.status} ?` : 'Confirmer le changement de statut'}
        description={confirmAction ? `Le statut du payment-item lié à cette alerte sera mis à jour vers “${confirmAction.status}”.` : ''}
        confirmLabel={confirmAction?.status ?? 'Confirmer'}
        loading={updatePaymentItemMutation.isPending}
        onClose={() => {
          if (!updatePaymentItemMutation.isPending) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirmStatusChange}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4500}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={feedback.severity}
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
}
