import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { addWeeks, endOfWeek, format, isSameWeek, startOfWeek, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusChip } from '@/components/ui/StatusChip';
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { MonthlyOperationsChart } from '@/modules/dashboard/components/MonthlyOperationsChart';
import { WeeklyOperationsChart } from '@/modules/dashboard/components/WeeklyOperationsChart';
import { WeekNavigator } from '@/modules/dashboard/components/WeekNavigator';
import { formatCurrency, formatDate } from '@/utils/format';
import { brandColors, iconBox, numericFont } from '@/app/theme';

export default function DashboardPage() {
  const currentDate = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const { data, isLoading, isError, refetch } = useDashboard(selectedWeekStart);
  const defaultCurrency = useDefaultCurrency();

  const firstNavigableWeek = useMemo(() => startOfWeek(startOfYear(currentDate), { weekStartsOn: 1 }), [currentDate]);
  const lastNavigableWeek = useMemo(() => startOfWeek(new Date(currentDate.getFullYear(), 11, 31), { weekStartsOn: 1 }), [currentDate]);
  const selectedWeekEnd = useMemo(() => endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), [selectedWeekStart]);
  const isCurrentWeek = isSameWeek(selectedWeekStart, currentWeekStart, { weekStartsOn: 1 });
  const canGoPrevious = selectedWeekStart.getTime() > firstNavigableWeek.getTime();
  const canGoNext = selectedWeekStart.getTime() < lastNavigableWeek.getTime();

  const selectedWeekLabel = useMemo(() => {
    const sameMonth = selectedWeekStart.getMonth() === selectedWeekEnd.getMonth() && selectedWeekStart.getFullYear() === selectedWeekEnd.getFullYear();

    if (sameMonth) {
      return `${format(selectedWeekStart, 'd', { locale: fr })}–${format(selectedWeekEnd, 'd MMM yyyy', { locale: fr })}`;
    }

    return `${format(selectedWeekStart, 'd MMM', { locale: fr })} – ${format(selectedWeekEnd, 'd MMM yyyy', { locale: fr })}`;
  }, [selectedWeekEnd, selectedWeekStart]);

  const renderWeekNavigator = () => (
    <WeekNavigator
      weekLabel={selectedWeekLabel}
      onPrevious={() => setSelectedWeekStart((value) => addWeeks(value, -1))}
      onNext={() => setSelectedWeekStart((value) => addWeeks(value, 1))}
      onCurrentWeek={() => setSelectedWeekStart(currentWeekStart)}
      disablePrevious={!canGoPrevious}
      disableNext={!canGoNext}
      isCurrentWeek={isCurrentWeek}
    />
  );

  if (isLoading) return <LoadingState message="Chargement du tableau de bord..." />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} message="Impossible de charger le dashboard." />;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble en temps réel de vos flux financiers, échéances et alertes"
      />

      {/* ── KPI Cards — CSS Grid for perfect equal-height alignment ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <StatCard
          label="Crédits du mois"
          value={formatCurrency(data.monthlyCredits, defaultCurrency)}
          color={brandColors.credit}
          icon={<TrendingUpRoundedIcon />}
          helper="Entrées mensuelles"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          label="Débits du mois"
          value={formatCurrency(data.monthlyDebits, defaultCurrency)}
          color={brandColors.debit}
          icon={<TrendingDownRoundedIcon />}
          helper="Sorties mensuelles"
        />
        <StatCard
          label="Échéances semaine"
          value={data.dueThisWeekCount}
          color={brandColors.info}
          icon={<CalendarTodayRoundedIcon />}
          helper="À traiter cette semaine"
        />
        <StatCard
          label="En retard"
          value={data.overdueCount}
          color={brandColors.warning}
          icon={<WarningAmberRoundedIcon />}
          helper="Paiements en souffrance"
          trend={data.overdueCount > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          label="Alertes non lues"
          value={data.unreadAlertsCount}
          color={brandColors.alert}
          icon={<NotificationsActiveRoundedIcon />}
          helper="Requièrent attention"
        />
      </Box>

      {/* ── Charts + Upcoming ── */}
      <Grid container spacing={2.5}>
        {/* Weekly chart */}
        <Grid item xs={12} lg={7}>
          <WeeklyOperationsChart
            data={data.weeklyChart}
            currency={defaultCurrency}
            subtitle={`Comparatif crédits vs débits • ${selectedWeekLabel}`}
            headerAction={renderWeekNavigator()}
          />
        </Grid>

        {/* Upcoming payments */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: '22px 24px !important' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={iconBox(brandColors.info, 38)}>
                    <ReceiptLongRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '0.95rem' }}>
                      Échéances de la semaine
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedWeekLabel} • {data.upcomingPaymentItems.length} élément{data.upcomingPaymentItems.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Stack>
                {renderWeekNavigator()}
              </Stack>
              <Divider sx={{ mb: 1.5, borderColor: alpha(brandColors.slate[200], 0.6) }} />

              {data.upcomingPaymentItems.length ? (
                <Stack spacing={0} divider={<Divider />}>
                  {data.upcomingPaymentItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        py: 1.5,
                        px: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.2s ease',
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: alpha(brandColors.info, 0.03), transform: 'translateX(2px)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 38,
                          borderRadius: 2,
                          flexShrink: 0,
                          background:
                            item.direction === 'IN'
                              ? `linear-gradient(180deg, ${brandColors.credit}, ${alpha(brandColors.credit, 0.25)})`
                              : `linear-gradient(180deg, ${brandColors.debit}, ${alpha(brandColors.debit, 0.25)})`,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.2 }}>
                          <Typography
                            sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}
                            noWrap
                          >
                            {item.reference}
                          </Typography>
                          <StatusChip status={item.status} />
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatDate(item.dueDate)} • {item.type}
                          </Typography>
                        </Stack>
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          fontFamily: numericFont,
                          color: item.direction === 'IN' ? brandColors.credit : brandColors.debit,
                          flexShrink: 0,
                        }}
                      >
                        {item.direction === 'IN' ? '+' : '-'}{formatCurrency(item.amount, defaultCurrency)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  title="Aucune échéance"
                  message="Pas d'échéances prévues cette semaine"
                  icon={<CalendarTodayRoundedIcon />}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly chart */}
        <Grid item xs={12}>
          <MonthlyOperationsChart data={data.monthlyChart} currency={defaultCurrency} />
        </Grid>
      </Grid>
    </>
  );
}

