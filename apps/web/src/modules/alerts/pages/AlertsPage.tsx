import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertPaymentDetailsDialog } from '@/modules/alerts/components/AlertPaymentDetailsDialog';
import { useAlerts, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';
import { Alert, PaymentItem } from '@/types/domain';
import { formatDate } from '@/utils/format';
import { actionIconButton, brandColors, iconBox } from '@/app/theme';
import { getPaymentItemClientPrimary, getPaymentItemReference, getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import { getAlertAssociatedLabel, getAlertScheduledAt, getAlertSentAt, getAlertTimestamp, getPrimaryAlertPaymentItem } from '@/modules/alerts/utils/alertPresentation';
import { useMemo, useState } from 'react';

type AlertFilter = 'all' | 'unread' | 'read';
type AlertSort = 'recent' | 'urgent';


export default function AlertsPage() {
  const { data = [], isLoading, isError, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [sort, setSort] = useState<AlertSort>('urgent');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const unreadCount = useMemo(() => data.filter((a) => !a.isRead).length, [data]);
  const readCount = Math.max(data.length - unreadCount, 0);

  const filteredAlerts = useMemo(() => {
    const filtered = data.filter((alert) => {
      if (filter === 'unread') return !alert.isRead;
      if (filter === 'read') return alert.isRead;
      return true;
    });

    return filtered.sort((left, right) => {
      if (left.isRead !== right.isRead) {
        return Number(left.isRead) - Number(right.isRead);
      }

      if (sort === 'urgent') {
        const leftUrgency = getAlertTimestamp(getAlertScheduledAt(left));
        const rightUrgency = getAlertTimestamp(getAlertScheduledAt(right));
        if (leftUrgency !== rightUrgency) {
          return leftUrgency - rightUrgency;
        }
      }

      const leftRecent = getAlertTimestamp(getAlertSentAt(left), 0);
      const rightRecent = getAlertTimestamp(getAlertSentAt(right), 0);
      return rightRecent - leftRecent;
    });
  }, [data, filter, sort]);

  if (isLoading) return <LoadingState message="Chargement des alertes..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle="Notifications liées aux échéances et événements importants"
        count={data.length}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outlined"
              startIcon={<DoneAllRoundedIcon />}
              onClick={() => {
                data.filter((a) => !a.isRead).forEach((a) => {
                  updateMutation.mutate({ id: a.id, payload: { isRead: true } });
                });
              }}
              size="small"
            >
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {([
            { value: 'all', label: `Toutes (${data.length})` },
            { value: 'unread', label: `Non lues (${unreadCount})` },
            { value: 'read', label: `Lues (${readCount})` },
          ] as Array<{ value: AlertFilter; label: string }>).map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => setFilter(item.value)}
              color={filter === item.value ? 'primary' : 'default'}
              variant={filter === item.value ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {([
            { value: 'urgent', label: 'Plus urgentes' },
            { value: 'recent', label: 'Plus récentes' },
          ] as Array<{ value: AlertSort; label: string }>).map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => setSort(item.value)}
              color={sort === item.value ? 'secondary' : 'default'}
              variant={sort === item.value ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: '4px 0 !important' }}>
          {filteredAlerts.length ? (
            <Stack divider={<Divider />}>
              {filteredAlerts.map((alert) => (
                <Box
                  key={alert.id}
                  sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    borderLeft: alert.isRead ? 'none' : `3px solid ${brandColors.alert}`,
                    backgroundColor: alert.isRead ? 'transparent' : alpha(brandColors.alert, 0.02),
                    transition: 'all 0.25s ease',
                    '&:hover': { backgroundColor: alpha(brandColors.alert, 0.04) },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      ...iconBox(alert.isRead ? brandColors.navy[300] : brandColors.alert, 40),
                      mt: 0.3,
                    }}
                  >
                    <NotificationsActiveRoundedIcon fontSize="small" />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.3 }}>
                      <Typography
                        sx={{
                          fontWeight: alert.isRead ? 500 : 700,
                          fontSize: '0.92rem',
                          color: 'text.primary',
                        }}
                        noWrap
                      >
                        {alert.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={alert.isRead ? 'Lu' : 'Non lu'}
                        color={alert.isRead ? 'success' : 'warning'}
                        sx={{ height: 20, fontSize: '0.68rem' }}
                      />
                      {getPrimaryAlertPaymentItem(alert) ? (
                        <Chip
                          size="small"
                          label={String(getPaymentItemStatusLabel(getPrimaryAlertPaymentItem(alert)?.status))}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      ) : null}
                    </Stack>
                    <Typography sx={{ color: alert.isRead ? 'text.secondary' : 'text.primary', fontSize: '0.84rem', lineHeight: 1.5, mb: 1 }}>
                      {alert.message}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ScheduleRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Échéance : {formatDate(getAlertScheduledAt(alert))}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <SendRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Envoi : {formatDate(getAlertSentAt(alert))}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <BusinessRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {getAlertAssociatedLabel(alert)}
                        </Typography>
                      </Stack>
                      {getPrimaryAlertPaymentItem(alert) ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ReceiptLongRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Paiement : {getPaymentItemReference(getPrimaryAlertPaymentItem(alert))}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Tooltip title={alert.isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}>
                      <IconButton
                        size="small"
                        onClick={() => updateMutation.mutate({ id: alert.id, payload: { isRead: !alert.isRead } })}
                        sx={actionIconButton(alert.isRead ? brandColors.slate[500] : brandColors.blue[600])}
                      >
                        <MarkEmailReadRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Afficher les détails du paiement associé">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setSelectedAlert(alert)}
                        sx={{
                          minWidth: 'auto',
                          px: 1.25,
                          py: 0.55,
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          whiteSpace: 'nowrap',
                          color: brandColors.blue[600],
                          borderColor: alpha(brandColors.blue[600], 0.2),
                          backgroundColor: alpha(brandColors.blue[600], 0.03),
                          '&:hover': {
                            borderColor: alpha(brandColors.blue[600], 0.35),
                            backgroundColor: alpha(brandColors.blue[600], 0.08),
                          },
                        }}
                      >
                        Détails paiement
                      </Button>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              title="Aucune alerte"
              message={filter === 'unread' ? 'Toutes vos alertes ont été lues' : filter === 'read' ? 'Aucune alerte lue à afficher' : 'Aucune alerte disponible pour le moment'}
              icon={<NotificationsActiveRoundedIcon />}
            />
          )}
        </CardContent>
      </Card>

      <AlertPaymentDetailsDialog
        open={Boolean(selectedAlert)}
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </>
  );
}

