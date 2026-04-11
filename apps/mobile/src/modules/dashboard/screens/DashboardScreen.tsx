import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { StatCard } from '@/components/ui/StatCard';
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { initNotifications } from '@/services/notifications/expoNotifications';
import { scheduleDueAlerts } from '@/services/notifications/scheduleDueAlerts';
import { formatCurrency, formatDate } from '@/utils/format';

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        <StatCard label="Crédits du mois" value={formatCurrency(data.monthlyCredits)} color="#16a34a" />
        <StatCard label="Débits du mois" value={formatCurrency(data.monthlyDebits)} color="#dc2626" />
        <StatCard label="Échéances cette semaine" value={data.dueThisWeekCount} color="#1d4ed8" />
        <StatCard label="En retard" value={data.overdueCount} color="#d97706" />
        <StatCard label="Alertes non lues" value={data.unreadAlertsCount} color="#7c3aed" />

        <Text style={styles.sectionTitle}>Échéances proches</Text>
        {data.upcomingPaymentItems.length ? data.upcomingPaymentItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.reference}</Text>
            <Text style={styles.itemMeta}>{formatCurrency(item.amount)} • {formatDate(item.dueDate)}</Text>
            <Text style={styles.itemMeta}>{item.type} • {item.status}</Text>
          </View>
        )) : <EmptyState title="Aucune échéance proche" />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  itemTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4
  },
  itemMeta: {
    color: '#64748b'
  }
});

