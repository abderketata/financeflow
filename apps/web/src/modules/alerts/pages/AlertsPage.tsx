import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
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
import { useAlerts, useDeleteAlert, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';
import { formatDate } from '@/utils/format';
import { actionIconButton, brandColors, iconBox } from '@/app/theme';
import { useState } from 'react';

type AlertFilter = 'all' | 'unread' | 'read';

export default function AlertsPage() {
  const { data = [], isLoading, isError, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();
  const deleteMutation = useDeleteAlert();
  const [filter, setFilter] = useState<AlertFilter>('all');

  const filteredAlerts = data.filter((alert) => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'read') return alert.isRead;
    return true;
  });

  const unreadCount = data.filter((a) => !a.isRead).length;

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

      {/* Filter chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
        {(['all', 'unread', 'read'] as AlertFilter[]).map((f) => (
          <Chip
            key={f}
            label={f === 'all' ? 'Toutes' : f === 'unread' ? `Non lues (${unreadCount})` : 'Lues'}
            onClick={() => setFilter(f)}
            color={filter === f ? 'primary' : 'default'}
            variant={filter === f ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        ))}
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
                        label={alert.isRead ? 'Lue' : 'Non lue'}
                        color={alert.isRead ? 'success' : 'warning'}
                        sx={{ height: 20, fontSize: '0.68rem' }}
                      />
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', lineHeight: 1.5, mb: 0.5 }}>
                      {alert.message}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDate(alert.triggerDate || alert.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    {!alert.isRead && (
                      <Tooltip title="Marquer comme lue">
                        <IconButton
                          size="small"
                          onClick={() => updateMutation.mutate({ id: alert.id, payload: { isRead: true } })}
                          sx={actionIconButton(brandColors.blue[600])}
                        >
                          <MarkEmailReadRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={() => deleteMutation.mutate(alert.id)}
                        sx={actionIconButton(brandColors.debit)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              title="Aucune alerte"
              message={filter === 'unread' ? 'Toutes vos alertes ont été lues' : 'Toutes vos notifications sont à jour'}
              icon={<NotificationsActiveRoundedIcon />}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

