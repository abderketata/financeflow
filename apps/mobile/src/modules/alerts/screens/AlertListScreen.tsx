import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState, useMemo } from 'react';
import { AlertCard } from '@/components/cards/AlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useAlerts, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';

type AlertFilter = 'all' | 'unread' | 'read';

const FILTER_LABELS: Record<string, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  read: 'Lues',
};

export function AlertListScreen() {
  const { data = [], isLoading, isError, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();
  const [filter, setFilter] = useState<AlertFilter>('unread');

  const unreadCount = useMemo(() => data.filter((a) => !a.isRead).length, [data]);

  const filteredAlerts = useMemo(() => data.filter((alert) => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'read') return alert.isRead;
    return true;
  }), [data, filter]);

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
    'Lues',
  ];
  const filterValue =
    filter === 'unread' ? `Non lues (${unreadCount})` :
    filter === 'read'   ? 'Lues' : 'Toutes';

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
            else if (label === 'Lues') setFilter('read');
            else setFilter('all');
          }}
        />
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AlertCard
            item={item}
            onMarkRead={!item.isRead ? () => updateMutation.mutate({ id: item.id, payload: { isRead: true } }) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucune alerte"
            message={filter === 'unread' ? 'Toutes vos alertes ont été lues.' : 'Aucune alerte à afficher.'}
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




