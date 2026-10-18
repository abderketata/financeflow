import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { addMonths, addWeeks, endOfWeek, format, isSameWeek, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
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
import { useDashboard, useMonthlyWindow } from '@/modules/dashboard/hooks/useDashboard';
import { MONTHLY_WINDOW_MONTHS_BEFORE } from '@/modules/dashboard/services/dashboard.service';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { MonthlyCreditDebitComparisonChart } from '@/modules/dashboard/components/MonthlyCreditDebitComparisonChart';
import { MonthlyOperationsChart } from '@/modules/dashboard/components/MonthlyOperationsChart';
import { MonthWindowNavigator } from '@/modules/dashboard/components/MonthWindowNavigator';
import { WeeklyOperationsChart } from '@/modules/dashboard/components/WeeklyOperationsChart';
import { WeekNavigator } from '@/modules/dashboard/components/WeekNavigator';
import { PaymentItemDetailsDialog } from '@/modules/payment-items/components/PaymentItemDetailsDialog';
import { formatCurrency, formatDate } from '@/utils/format';
import { PaymentItem } from '@/types/domain';
import { brandColors, iconBox, numericFont } from '@/app/theme';

export default function DashboardPage() {
  const currentDate = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [detailsPaymentItem, setDetailsPaymentItem] = useState<Partial<PaymentItem> | null>(null);
  const { data, isLoading, isError, refetch } = useDashboard(selectedWeekStart);
  const defaultCurrency = useDefaultCurrency();
  // Chaque graphique mensuel a sa propre fenêtre de 12 mois : 4 mois avant le mois en cours, celui-ci et 7 après au départ.
  const initialMonthlyWindowStart = useMemo(
    () => addMonths(startOfMonth(currentDate), -MONTHLY_WINDOW_MONTHS_BEFORE),
    [currentDate],
  );
  const operationsWindow = useMonthlyWindow(initialMonthlyWindowStart);
  const comparisonWindow = useMonthlyWindow(initialMonthlyWindowStart);

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

  const renderMonthWindowNavigator = (monthWindow: ReturnType<typeof useMonthlyWindow>) => (
    <MonthWindowNavigator label={monthWindow.label} onPrevious={monthWindow.showPrevious} onNext={monthWindow.showNext} />
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
              <Stack direction="column" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%', minWidth: 0 }}>
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
                      <Tooltip title="Voir les détails de l’opération" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setDetailsPaymentItem(item)}
                          sx={{
                            flexShrink: 0,
                            width: 30,
                            height: 30,
                            color: brandColors.blue[600],
                            border: `1px solid ${alpha(brandColors.blue[600], 0.2)}`,
                            backgroundColor: alpha(brandColors.blue[600], 0.04),
                            '&:hover': {
                              borderColor: alpha(brandColors.blue[600], 0.35),
                              backgroundColor: alpha(brandColors.blue[600], 0.1),
                            },
                          }}
                        >
                          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
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
          <MonthlyOperationsChart
            data={operationsWindow.data ?? []}
            currency={defaultCurrency}
            headerAction={renderMonthWindowNavigator(operationsWindow)}
            loading={operationsWindow.isPending || operationsWindow.isPlaceholderData}
            onRetry={operationsWindow.isError ? () => operationsWindow.refetch() : undefined}
          />
        </Grid>

        {/* Monthly credit / debit comparison chart */}
        <Grid item xs={12}>
          <MonthlyCreditDebitComparisonChart
            data={comparisonWindow.data ?? []}
            currency={defaultCurrency}
            headerAction={renderMonthWindowNavigator(comparisonWindow)}
            loading={comparisonWindow.isPending || comparisonWindow.isPlaceholderData}
            onRetry={comparisonWindow.isError ? () => comparisonWindow.refetch() : undefined}
          />
        </Grid>
      </Grid>

      {/* ── Détail de l'opération sélectionnée ── */}
      <PaymentItemDetailsDialog
        open={Boolean(detailsPaymentItem)}
        paymentItem={detailsPaymentItem}
        onClose={() => setDetailsPaymentItem(null)}
      />
    </>
  );
}

