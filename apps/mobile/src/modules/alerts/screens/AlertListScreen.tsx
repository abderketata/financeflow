import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState, useMemo } from 'react';
import { AlertCard } from '@/components/cards/AlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useAlerts, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';
import { AlertItem, PaymentItem } from '@/types';

type AlertFilter = 'all' | 'unread' | 'read';
type AlertSort = 'recent' | 'urgent';


const SORT_LABELS: Record<AlertSort, string> = {
  urgent: 'Plus urgentes',
  recent: 'Plus récentes',
};

const getAlertPaymentItems = (alert: AlertItem) => {
  if (Array.isArray(alert.paymentItems)) {
    return alert.paymentItems.filter(Boolean);
  }

  if (alert.paymentItems?.data) {
    return alert.paymentItems.data.filter(Boolean);
  }

  return alert.paymentItem ? [alert.paymentItem] : [];
};

const getPrimaryAlertPaymentItem = (alert: AlertItem): PaymentItem | null => getAlertPaymentItems(alert)[0] ?? null;

const getAlertScheduledAt = (alert: AlertItem) => {
  const paymentItem = getPrimaryAlertPaymentItem(alert);
  return alert.scheduledAt || alert.triggerDate || paymentItem?.dueDate || paymentItem?.paymentDate || paymentItem?.createdAt || null;
};

const getAlertSentAt = (alert: AlertItem) => alert.sentAt || alert.createdAt || alert.updatedAt || null;

const getAlertTimestamp = (value?: string | null, fallback = Number.POSITIVE_INFINITY) => {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
};

export function AlertListScreen() {
  const { data = [], isLoading, isError, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [sort, setSort] = useState<AlertSort>('urgent');

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

  const markAllRead = () => {
    data.filter((a) => !a.isRead).forEach((a) => {
      updateMutation.mutate({ id: a.id, payload: { isRead: true } });
    });
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const filterOptions = [
    'Toutes',
    `Non lues (${unreadCount})`,
    `Lues (${readCount})`,
  ];
  const filterValue =
    filter === 'unread' ? `Non lues (${unreadCount})` :
    filter === 'read'   ? `Lues (${readCount})` : 'Toutes';

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alertes</Text>
          <Text style={styles.subtitle}>{data.length} alerte(s) · {unreadCount} non lue(s)</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllBtnText}>✓ Tout lire</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterWrap}>
        <FilterChips
          options={filterOptions}
          value={filterValue}
          onChange={(label) => {
            if (label.startsWith('Non lues')) setFilter('unread');
            else if (label.startsWith('Lues')) setFilter('read');
            else setFilter('all');
          }}
        />
        <FilterChips
          options={['urgent', 'recent']}
          value={sort}
          onChange={(value) => setSort((value as AlertSort) || 'urgent')}
          labelMap={SORT_LABELS}
        />
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AlertCard
            item={item}
            onToggleRead={() => updateMutation.mutate({ id: item.id, payload: { isRead: !item.isRead } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucune alerte"
            message={filter === 'unread' ? 'Toutes vos alertes ont été lues.' : filter === 'read' ? 'Aucune alerte lue à afficher.' : 'Aucune alerte à afficher.'}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  markAllBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  markAllBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  filterWrap: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});




