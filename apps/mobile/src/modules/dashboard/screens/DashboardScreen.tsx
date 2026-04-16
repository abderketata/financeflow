// DashboardScreen — migration Web → Mobile complète
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { initNotifications } from '@/services/notifications/expoNotifications';
import { scheduleDueAlerts } from '@/services/notifications/scheduleDueAlerts';
import { formatCurrency, formatDate } from '@/utils/format';

type KpiItem = { label: string; value: string | number; color: string; bg: string; icon: string };

function KpiCard({ item }: { item: KpiItem }) {
  return (
    <View style={[kpi.card, { backgroundColor: item.bg }]}>
      <Text style={kpi.icon}>{item.icon}</Text>
      <Text style={[kpi.value, { color: item.color }]}>{item.value}</Text>
      <Text style={kpi.label}>{item.label}</Text>
    </View>
  );
}

const kpi = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', borderRadius: 16, padding: 14, gap: 4 },
  icon: { fontSize: 20 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});

export function DashboardScreen() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: settings } = useSettings();

  useEffect(() => {
    const run = async () => {
      if (!data || !settings) return;
      await initNotifications();
      await scheduleDueAlerts(data.upcomingPaymentItems, settings.alertDaysBefore || 3);
    };
    run();
  }, [data, settings]);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} message="Impossible de charger le dashboard." />;

  const defaultCurrency = settings?.currency ?? 'TND';

  const kpis: KpiItem[] = [
    { label: 'Crédits du mois',   value: formatCurrency(data.monthlyCredits, defaultCurrency),  color: '#16a34a', bg: '#f0fdf4', icon: '📈' },
    { label: 'Débits du mois',    value: formatCurrency(data.monthlyDebits, defaultCurrency),   color: '#dc2626', bg: '#fef2f2', icon: '📉' },
    { label: 'Échéances semaine', value: data.dueThisWeekCount,   color: '#2563eb', bg: '#eff6ff', icon: '📅' },
    { label: 'En retard',         value: data.overdueCount,       color: '#d97706', bg: '#fffbeb', icon: '⚠️' },
    { label: 'Alertes non lues',  value: data.unreadAlertsCount,  color: '#7c3aed', bg: '#f5f3ff', icon: '🔔' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>Vue en temps réel de vos flux financiers</Text>

        <View style={styles.kpiGrid}>
          {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
        </View>

        <Text style={styles.sectionTitle}>📋 Échéances de la semaine ({data.upcomingPaymentItems.length})</Text>
        {data.upcomingPaymentItems.length ? (
          data.upcomingPaymentItems.map((item) => {
            const isIn = item.direction === 'IN';
            return (
              <View key={item.id} style={[styles.paymentCard, isIn ? styles.paymentCardIn : styles.paymentCardOut]}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentRef} numberOfLines={1}>{item.reference ?? item.referenceNumber}</Text>
                  <Text style={[styles.paymentAmount, { color: isIn ? '#16a34a' : '#dc2626' }]}>
                    {isIn ? '+' : '-'}{formatCurrency(item.amount, defaultCurrency)}
                  </Text>
                </View>
                <Text style={styles.paymentMeta}>{formatDate(item.dueDate)} · {item.type} · {item.status}</Text>
              </View>
            );
          })
        ) : (
          <EmptyState title="Aucune échéance proche" message="Pas d'échéances prévues cette semaine" />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  paymentCardIn:  { borderLeftWidth: 3, borderLeftColor: '#16a34a' },
  paymentCardOut: { borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentRef: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '800', flexShrink: 0 },
  paymentMeta: { fontSize: 12, color: '#64748b' },
});


