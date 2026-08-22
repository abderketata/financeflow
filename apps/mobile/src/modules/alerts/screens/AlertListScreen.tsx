// AlertListScreen — parité métier avec la page web `/alerts`.
//
// Règles reprises (`apps/web/src/modules/alerts/pages/AlertsPage.tsx`) :
//   - filtres Toutes / Non lues / Lues avec compteurs ;
//   - tri « Plus urgentes » (échéance la plus proche) ou « Plus récentes »
//     (envoi le plus récent), les non lues restant toujours en tête ;
//   - « Tout marquer comme lu » visible uniquement s'il reste des non lues.
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AlertCard } from '@/components/cards/AlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { AlertPaymentDetailsModal } from '@/modules/alerts/components/AlertPaymentDetailsModal';
import { useAlerts, useMarkAllAlertsRead, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';
import {
  getAlertScheduledAt,
  getAlertSentAt,
  getAlertTimestamp,
} from '@/modules/alerts/utils/alertPresentation';
import { AlertItem } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';

type AlertFilter = 'all' | 'unread' | 'read';
type AlertSort = 'recent' | 'urgent';

const SORT_OPTIONS: AlertSort[] = ['urgent', 'recent'];
const SORT_LABELS: Record<string, string> = {
  urgent: 'Plus urgentes',
  recent: 'Plus récentes',
};

export function AlertListScreen() {
  const { data = [], isLoading, isError, isFetching, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();
  const markAllReadMutation = useMarkAllAlertsRead();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [sort, setSort] = useState<AlertSort>('urgent');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const unreadCount = useMemo(() => data.filter((alert) => !alert.isRead).length, [data]);
  const readCount = Math.max(data.length - unreadCount, 0);

  const filteredAlerts = useMemo(() => {
    const filtered = data.filter((alert) => {
      if (filter === 'unread') return !alert.isRead;
      if (filter === 'read') return alert.isRead;
      return true;
    });

    return filtered.sort((left, right) => {
      // Les non lues remontent toujours, quel que soit le tri choisi.
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

  // Chips pilotées par la valeur, pas par le libellé : les compteurs peuvent
  // changer sans casser la sélection courante.
  const FILTER_OPTIONS: AlertFilter[] = ['all', 'unread', 'read'];
  const filterLabels: Record<string, string> = {
    all: `Toutes (${data.length})`,
    unread: `Non lues (${unreadCount})`,
    read: `Lues (${readCount})`,
  };

  if (isLoading) return <LoadingState message="Chargement des alertes..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Alertes</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{data.length}</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            Notifications liées aux échéances et événements importants
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            style={[styles.markAllBtn, markAllReadMutation.isPending && styles.markAllBtnBusy]}
            disabled={markAllReadMutation.isPending}
            onPress={() => markAllReadMutation.mutate(data)}
          >
            <Ionicons name="checkmark-done" size={15} color={brand.blue700} />
            <Text style={styles.markAllBtnText}>
              {markAllReadMutation.isPending ? 'En cours…' : 'Tout lire'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Filtres et tri ── */}
      <View style={styles.filterWrap}>
        <FilterChips
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => setFilter((value as AlertFilter) || 'all')}
          labelMap={filterLabels}
        />
        <FilterChips
          options={SORT_OPTIONS}
          value={sort}
          onChange={(value) => setSort((value as AlertSort) || 'urgent')}
          labelMap={SORT_LABELS}
        />
      </View>

      {/* ── Liste ── */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AlertCard
            item={item}
            onToggleRead={() => updateMutation.mutate({ id: item.id, payload: { isRead: !item.isRead } })}
            onViewPayment={() => setSelectedAlert(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={brand.blue600} />}
        ListEmptyComponent={
          <EmptyState
            title="Aucune alerte"
            message={
              filter === 'unread'
                ? 'Toutes vos alertes ont été lues.'
                : filter === 'read'
                  ? 'Aucune alerte lue à afficher.'
                  : 'Aucune alerte à afficher.'
            }
            icon="notifications-outline"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <AlertPaymentDetailsModal
        visible={Boolean(selectedAlert)}
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: brand.navy900,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: brand.violetBg,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: brand.violet,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: brand.slate500,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: brand.blue50,
    borderWidth: 1,
    borderColor: brand.blue100,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  markAllBtnBusy: {
    opacity: 0.6,
  },
  markAllBtnText: {
    color: brand.blue700,
    fontWeight: '700',
    fontSize: 13,
  },
  filterWrap: {
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
});
