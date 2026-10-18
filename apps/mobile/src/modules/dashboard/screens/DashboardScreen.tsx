// DashboardScreen — portage complet du métier de la page Dashboard du web.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { MonthlyCreditDebitComparisonChart } from '@/modules/dashboard/components/MonthlyCreditDebitComparisonChart';
import { MonthlyOperationsChart } from '@/modules/dashboard/components/MonthlyOperationsChart';
import { MonthlyChartFrame, MonthWindowNavigator } from '@/modules/dashboard/components/MonthWindowNavigator';
import { WeeklyOperationsChart } from '@/modules/dashboard/components/WeeklyOperationsChart';
import { WeekNavigator } from '@/modules/dashboard/components/WeekNavigator';
import { PaymentItemDetailsModal } from '@/modules/payment-items/components/PaymentItemDetailsModal';
import { useDashboard, useMonthlyWindow } from '@/modules/dashboard/hooks/useDashboard';
import { MONTHLY_WINDOW_MONTHS_BEFORE } from '@/modules/dashboard/services/dashboard.service';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { initNotifications } from '@/services/notifications/expoNotifications';
import { scheduleDueAlerts } from '@/services/notifications/scheduleDueAlerts';
import { PaymentItem } from '@/types';
import { brand, getStatusStyle, radius, spacing } from '@/theme/brand';
import { formatCurrency, formatDate } from '@/utils/format';

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date) => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addWeeks = (date: Date, count: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count * 7);
  return result;
};

interface KpiDefinition {
  label: string;
  value: string | number;
  helper: string;
  color: string;
  background: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/** Indicateur : médaillon d'icône, valeur, libellé, précision — carte blanche. */
function KpiCard({ item }: { item: KpiDefinition }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiMedallion, { backgroundColor: item.background }]}>
          <Ionicons name={item.icon} size={18} color={item.color} />
        </View>
        <View style={[styles.kpiAccent, { backgroundColor: item.color }]} />
      </View>
      <Text style={[styles.kpiValue, { color: item.color }]} numberOfLines={1} adjustsFontSizeToFit>
        {item.value}
      </Text>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      <Text style={styles.kpiHelper}>{item.helper}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeek(today), [today]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [detailsPaymentItem, setDetailsPaymentItem] = useState<Partial<PaymentItem> | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useDashboard(selectedWeekStart);
  const { data: settings } = useSettings();
  // Chaque graphique mensuel a sa propre fenêtre de 12 mois : 4 mois avant le mois en cours, celui-ci et 7 après au départ.
  const initialMonthlyWindowStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - MONTHLY_WINDOW_MONTHS_BEFORE, 1),
    [today],
  );
  const operationsWindow = useMonthlyWindow(initialMonthlyWindowStart);
  const comparisonWindow = useMonthlyWindow(initialMonthlyWindowStart);

  // Bornes de navigation : l'année civile en cours, comme sur le web.
  const firstNavigableWeek = useMemo(() => startOfWeek(new Date(today.getFullYear(), 0, 1)), [today]);
  const lastNavigableWeek = useMemo(() => startOfWeek(new Date(today.getFullYear(), 11, 31)), [today]);
  const selectedWeekEnd = useMemo(() => endOfWeek(selectedWeekStart), [selectedWeekStart]);
  const isCurrentWeek = selectedWeekStart.getTime() === currentWeekStart.getTime();

  const weekLabel = useMemo(() => {
    const sameMonth =
      selectedWeekStart.getMonth() === selectedWeekEnd.getMonth() &&
      selectedWeekStart.getFullYear() === selectedWeekEnd.getFullYear();

    if (sameMonth) {
      return `${selectedWeekStart.getDate()}–${selectedWeekEnd.getDate()} ${MONTHS[selectedWeekEnd.getMonth()]} ${selectedWeekEnd.getFullYear()}`;
    }

    return `${selectedWeekStart.getDate()} ${MONTHS_SHORT[selectedWeekStart.getMonth()]} – ${selectedWeekEnd.getDate()} ${MONTHS_SHORT[selectedWeekEnd.getMonth()]} ${selectedWeekEnd.getFullYear()}`;
  }, [selectedWeekEnd, selectedWeekStart]);

  useEffect(() => {
    const run = async () => {
      if (!data || !settings) return;
      await initNotifications();
      await scheduleDueAlerts(
        data.upcomingPaymentItems,
        settings.defaultAlertDays ?? settings.alertDaysBefore ?? 3,
      );
    };
    // Sans `catch`, un échec de programmation (permission refusée, plateforme
    // non supportée) remonterait en rejet de promesse non traité.
    run().catch((error) => {
      console.warn("[FinanceFlow] Programmation des alertes d'échéance impossible", error);
    });
  }, [data, settings]);

  if (isLoading && !data) return <LoadingState message="Chargement du tableau de bord..." />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Impossible de charger le tableau de bord." />;
  }

  const currency = settings?.defaultCurrency ?? settings?.currency ?? 'TND';

  const refreshAll = () => {
    refetch();
    operationsWindow.refetch();
    comparisonWindow.refetch();
  };

  const renderMonthlyChart = (
    monthWindow: ReturnType<typeof useMonthlyWindow>,
    Chart: typeof MonthlyOperationsChart | typeof MonthlyCreditDebitComparisonChart,
  ) => (
    <>
      <MonthWindowNavigator label={monthWindow.label} onPrevious={monthWindow.showPrevious} onNext={monthWindow.showNext} />
      <MonthlyChartFrame
        loading={monthWindow.isPending || monthWindow.isPlaceholderData}
        onRetry={monthWindow.isError ? () => monthWindow.refetch() : undefined}
      >
        <Chart data={monthWindow.data ?? []} currency={currency} />
      </MonthlyChartFrame>
    </>
  );

  const kpis: KpiDefinition[] = [
    {
      label: 'Crédits du mois',
      value: formatCurrency(data.monthlyCredits, currency),
      helper: 'Entrées mensuelles',
      color: brand.credit,
      background: brand.creditBg,
      icon: 'trending-up',
    },
    {
      label: 'Débits du mois',
      value: formatCurrency(data.monthlyDebits, currency),
      helper: 'Sorties mensuelles',
      color: brand.danger,
      background: brand.dangerBg,
      icon: 'trending-down',
    },
    {
      label: 'Échéances semaine',
      value: data.dueThisWeekCount,
      helper: 'À traiter cette semaine',
      color: brand.blue600,
      background: brand.blue50,
      icon: 'calendar',
    },
    {
      label: 'En retard',
      value: data.overdueCount,
      helper: 'Paiements en souffrance',
      color: brand.warning,
      background: brand.warningBg,
      icon: 'warning',
    },
    {
      label: 'Alertes non lues',
      value: data.unreadAlertsCount,
      helper: 'Requièrent attention',
      color: brand.violet,
      background: brand.violetBg,
      icon: 'notifications',
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refreshAll} tintColor={brand.blue600} />
        }
      >
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>
          Vue d'ensemble en temps réel de vos flux financiers, échéances et alertes
        </Text>

        {/* ── Indicateurs ── */}
        <View style={styles.kpiGrid}>
          {kpis.map((item) => (
            <KpiCard key={item.label} item={item} />
          ))}
        </View>

        {/* ── Opérations de la semaine ── */}
        <AppCard>
          <SectionTitle title="Opérations de la semaine" subtitle="Comparatif crédits vs débits" />
          <WeekNavigator
            label={weekLabel}
            isCurrentWeek={isCurrentWeek}
            canGoPrevious={selectedWeekStart.getTime() > firstNavigableWeek.getTime()}
            canGoNext={selectedWeekStart.getTime() < lastNavigableWeek.getTime()}
            onPrevious={() => setSelectedWeekStart((week) => addWeeks(week, -1))}
            onNext={() => setSelectedWeekStart((week) => addWeeks(week, 1))}
            onCurrent={() => setSelectedWeekStart(currentWeekStart)}
          />
          <View style={styles.chartSpacer}>
            <WeeklyOperationsChart data={data.weeklyChart} currency={currency} />
          </View>
        </AppCard>

        {/* ── Échéances de la semaine ── */}
        <AppCard>
          <SectionTitle
            title="Échéances de la semaine"
            subtitle={`${weekLabel} • ${data.upcomingPaymentItems.length} élément${data.upcomingPaymentItems.length !== 1 ? 's' : ''}`}
          />
          {data.upcomingPaymentItems.length ? (
            data.upcomingPaymentItems.map((item, index) => {
              const isIn = item.direction === 'IN';
              const amountColor = isIn ? brand.credit : brand.danger;
              const status = String(getPaymentItemStatusLabel(item.status));
              const statusStyle = getStatusStyle(status);

              return (
                <View
                  key={item.id}
                  style={[styles.dueRow, index > 0 && styles.dueRowDivided]}
                >
                  <View style={[styles.dueBar, { backgroundColor: amountColor }]} />
                  <View style={styles.dueBody}>
                    <View style={styles.dueTitleRow}>
                      <Text style={styles.dueReference} numberOfLines={1}>
                        {item.reference || item.referenceNumber}
                      </Text>
                      <StatusPill
                        label={status}
                        color={statusStyle.color}
                        backgroundColor={statusStyle.bg}
                      />
                    </View>
                    <View style={styles.dueMetaRow}>
                      <Ionicons name="time-outline" size={12} color={brand.slate400} />
                      <Text style={styles.dueMeta}>
                        {formatDate(item.dueDate)} • {item.type}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dueRight}>
                    <Text style={[styles.dueAmount, { color: amountColor }]} numberOfLines={1}>
                      {isIn ? '+' : '-'}
                      {formatCurrency(item.amount, currency)}
                    </Text>
                    <Pressable
                      onPress={() => setDetailsPaymentItem(item)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Voir les détails de ${item.reference || item.referenceNumber}`}
                      style={({ pressed }) => [styles.dueDetailsButton, pressed && styles.dueDetailsButtonPressed]}
                    >
                      <Ionicons name="eye-outline" size={15} color={brand.blue600} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              title="Aucune échéance"
              message="Pas d'échéances prévues cette semaine"
              icon="calendar-outline"
            />
          )}
        </AppCard>

        {/* ── Vue mensuelle : attendu vs réalisé ── */}
        <AppCard>
          <SectionTitle
            title="Vue mensuelle"
            subtitle="Attendu (trait plein) et réellement réglé (pointillés) — l'écart reste à encaisser"
          />
          {renderMonthlyChart(operationsWindow, MonthlyOperationsChart)}
        </AppCard>

        {/* ── Comparatif mensuel ── */}
        <AppCard>
          <SectionTitle title="Comparatif mensuel" subtitle="Crédits en barres, débits en courbe" />
          {renderMonthlyChart(comparisonWindow, MonthlyCreditDebitComparisonChart)}
        </AppCard>
      </ScrollView>

      {/* ── Détail de l'opération sélectionnée ── */}
      <PaymentItemDetailsModal
        visible={Boolean(detailsPaymentItem)}
        paymentItem={detailsPaymentItem}
        onClose={() => setDetailsPaymentItem(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: brand.navy900,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.xl,
    fontSize: 12.5,
    lineHeight: 18,
    color: brand.slate500,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.md + 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiMedallion: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiAccent: {
    width: 22,
    height: 4,
    borderRadius: 2,
    opacity: 0.35,
  },
  kpiValue: {
    marginTop: spacing.md,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: brand.slate700,
  },
  kpiHelper: {
    marginTop: 1,
    fontSize: 10.5,
    color: brand.slate400,
  },
  chartSpacer: {
    marginTop: spacing.lg,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  dueRowDivided: {
    borderTopWidth: 1,
    borderTopColor: brand.slate100,
  },
  dueBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
    flexShrink: 0,
  },
  dueBody: {
    flex: 1,
    minWidth: 0,
  },
  dueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dueReference: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: brand.navy900,
  },
  dueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dueMeta: {
    fontSize: 11.5,
    color: brand.slate500,
  },
  dueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  dueAmount: {
    fontSize: 13.5,
    fontWeight: '800',
    flexShrink: 0,
  },
  dueDetailsButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.blue100,
    backgroundColor: brand.blue50,
  },
  dueDetailsButtonPressed: {
    backgroundColor: brand.blue100,
  },
});
