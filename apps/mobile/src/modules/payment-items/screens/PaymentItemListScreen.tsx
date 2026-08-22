// PaymentItemListScreen — parité métier avec la page web `/payment-items`.
//
// Points repris du web (`apps/web/src/modules/payment-items/pages/PaymentItemsPage.tsx`) :
//   - recherche et filtres appliqués CÔTÉ SERVEUR (référence, réf. paiement,
//     tireur, tiré / type / statut / client / période sur l'échéance) ;
//   - totaux crédits / débits / solde calculés sur l'ensemble des éléments
//     filtrés, pas sur la page affichée ;
//   - période valide uniquement si les deux dates sont saisies et que la date
//     min est strictement inférieure à la date max ;
//   - suppression logique (`supprimer = true`), jamais physique.
//
// La pagination du web devient ici un chargement au défilement, plus naturel
// sur mobile.
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PaymentItemCard } from '@/components/cards/PaymentItemCard';
import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ClientFilterPicker } from '@/modules/payment-items/components/ClientFilterPicker';
import { PaymentItemDetailsModal } from '@/modules/payment-items/components/PaymentItemDetailsModal';
import {
  usePaymentItemsInfinite,
  usePaymentItemsTotals,
  useSoftDeletePaymentItem,
} from '@/modules/payment-items/hooks/usePaymentItems';
import {
  getPaymentItemReference,
  paymentItemStatusOptions,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { typeConfig } from '@/modules/payment-items/utils/paymentItemVisuals';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { MobileStackParamList } from '@/navigation/types';
import { Client, PaymentItem } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';
import { confirmAction, notify } from '@/utils/confirm';
import { formatCurrency } from '@/utils/format';

const TYPE_OPTIONS = ['', ...Object.keys(typeConfig)];
const TYPE_LABELS: Record<string, string> = {
  '': 'Tous les types',
  ...Object.fromEntries(Object.entries(typeConfig).map(([key, config]) => [key, config.label])),
};
const STATUS_OPTIONS = ['', ...paymentItemStatusOptions.map((option) => option.value)];
const STATUS_LABELS: Record<string, string> = { '': 'Tous les statuts' };
const DIR_OPTIONS = ['', 'IN', 'OUT'];
const DIR_LABELS: Record<string, string> = { '': 'Tous sens', IN: '↑ Entrant', OUT: '↓ Sortant' };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Métrique de totaux, transposition du `TotalMetric` du web. */
function TotalMetric({ label, value, color, background }: { label: string; value: string; color: string; background: string }) {
  return (
    <View style={[styles.metric, { backgroundColor: background, borderColor: `${color}29` }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export function PaymentItemListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemList'>) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dirFilter, setDirFilter] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentItem | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  const softDeleteMutation = useSoftDeletePaymentItem();
  const defaultCurrency = useDefaultCurrency();

  // Période appliquée seulement si les deux bornes sont saisies, au bon format,
  // et strictement ordonnées — même règle que le web.
  const datesFilled = ISO_DATE_PATTERN.test(dateFrom) && ISO_DATE_PATTERN.test(dateTo);
  const datesValid = datesFilled && dateFrom < dateTo;
  const dateError = datesFilled && !datesValid
    ? 'La date min doit être strictement inférieure à la date max'
    : (dateFrom || dateTo) && !datesFilled
      ? 'Renseignez les deux bornes au format AAAA-MM-JJ'
      : '';

  const filterParams = useMemo(() => {
    const filters: Record<string, unknown>[] = [];
    const term = debouncedSearch.trim();

    if (term) {
      filters.push({
        $or: [
          { referenceNumber: { $containsi: term } },
          { referencePayment: { $containsi: term } },
          { drawer: { $containsi: term } },
          { drawee: { $containsi: term } },
        ],
      });
    }

    if (typeFilter) filters.push({ type: { $eq: typeFilter } });
    if (statusFilter) filters.push({ status: { $eq: statusFilter } });
    if (dirFilter) filters.push({ direction: { $eq: dirFilter } });
    if (client?.id) filters.push({ client: { id: { $eq: client.id } } });
    if (datesValid) filters.push({ echeance: { $gte: dateFrom, $lte: dateTo } });

    if (!filters.length) return {};

    return { filters: filters.length === 1 ? filters[0] : { $and: filters } };
  }, [debouncedSearch, typeFilter, statusFilter, dirFilter, client?.id, datesValid, dateFrom, dateTo]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentItemsInfinite(filterParams);
  const { data: totals, isFetching: isTotalsFetching } = usePaymentItemsTotals(filterParams);

  const rows = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const totalCount = data?.pages[0]?.pagination.total ?? 0;
  const currency = defaultCurrency || 'TND';

  const activeFilterCount = [typeFilter, statusFilter, dirFilter, client ? 'client' : '', datesValid ? 'dates' : '']
    .filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setDirFilter('');
    setClient(null);
    setDateFrom('');
    setDateTo('');
  };

  const handleDelete = async (item: PaymentItem) => {
    const reference = getPaymentItemReference(item);
    const confirmed = await confirmAction({
      title: 'Supprimer ce paiement ?',
      message: `"${reference}" sera retiré de la liste. L'enregistrement est conservé en base.`,
      confirmLabel: 'Supprimer',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      await softDeleteMutation.mutateAsync(item.id);
    } catch {
      notify('Erreur', 'Impossible de supprimer ce paiement.');
    }
  };

  if (isLoading && !data) return <LoadingState message="Chargement des chèques / traites..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Chèques / Traites</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{totalCount}</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            Suivi des échéances, statuts, montants et relations clients
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('PaymentItemForm', undefined)}>
          <Ionicons name="add" size={16} color={brand.white} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </Pressable>
      </View>

      {/* ── Totaux sur l'ensemble filtré ── */}
      <View style={styles.metricsRow}>
        <TotalMetric
          label="Crédits"
          value={totals ? `+${formatCurrency(totals.totalCredits, currency)}` : '—'}
          color={brand.credit}
          background={brand.creditBg}
        />
        <TotalMetric
          label="Débits"
          value={totals ? `-${formatCurrency(totals.totalDebits, currency)}` : '—'}
          color={brand.danger}
          background={brand.dangerBg}
        />
        <TotalMetric
          label="Solde"
          value={totals ? `${totals.balance < 0 ? '-' : ''}${formatCurrency(Math.abs(totals.balance), currency)}` : '—'}
          color={(totals?.balance ?? 0) >= 0 ? brand.credit : brand.danger}
          background={(totals?.balance ?? 0) >= 0 ? brand.blue50 : brand.dangerBg}
        />
      </View>
      {isTotalsFetching ? <Text style={styles.totalsHint}>Recalcul des totaux sur l'ensemble filtré…</Text> : null}

      {/* ── Recherche ── */}
      <View style={styles.searchRow}>
        <SearchField
          style={styles.searchField}
          placeholder="Référence, réf. paiement, tireur, tiré..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <Pressable style={[styles.filterToggle, activeFilterCount > 0 && styles.filterToggleActive]} onPress={() => setShowFilters((v) => !v)}>
          <Ionicons name="options-outline" size={15} color={activeFilterCount > 0 ? brand.white : brand.slate600} />
          <Text style={[styles.filterToggleText, activeFilterCount > 0 && styles.filterToggleTextActive]}>
            {activeFilterCount > 0 ? String(activeFilterCount) : 'Filtres'}
          </Text>
        </Pressable>
      </View>

      {/* ── Filtres ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Type</Text>
          <FilterChips options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} labelMap={TYPE_LABELS} />

          <Text style={styles.filterLabel}>Statut</Text>
          <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} labelMap={STATUS_LABELS} />

          <Text style={styles.filterLabel}>Sens</Text>
          <FilterChips options={DIR_OPTIONS} value={dirFilter} onChange={setDirFilter} labelMap={DIR_LABELS} />

          <Text style={styles.filterLabel}>Client</Text>
          <ClientFilterPicker value={client} onChange={setClient} />

          <Text style={styles.filterLabel}>Période (échéance)</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <AppTextField
                label="Date min"
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="AAAA-MM-JJ"
                icon="calendar-outline"
              />
            </View>
            <View style={styles.dateField}>
              <AppTextField
                label="Date max"
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="AAAA-MM-JJ"
                icon="calendar-outline"
              />
            </View>
          </View>
          {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}

          <Pressable style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
          </Pressable>
        </View>
      )}

      {/* ── Liste ── */}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedItem(item)}>
            <PaymentItemCard
              item={item}
              onEdit={() => navigation.navigate('PaymentItemForm', { paymentItem: item })}
              onDelete={() => handleDelete(item)}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} tintColor={brand.blue600} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={brand.blue600} />
              <Text style={styles.footerText}>Chargement…</Text>
            </View>
          ) : rows.length && !hasNextPage ? (
            <Text style={styles.footerEnd}>
              {rows.length} élément{rows.length > 1 ? 's' : ''} sur {totalCount}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucun paiement"
            message="Aucun paiement ne correspond aux critères. Ajustez la recherche ou réinitialisez les filtres."
          />
        }
      />

      {/* ── Détail ── */}
      <PaymentItemDetailsModal
        visible={Boolean(selectedItem)}
        paymentItem={selectedItem}
        onClose={() => setSelectedItem(null)}
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
    paddingBottom: 10,
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
    backgroundColor: brand.blue50,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: brand.blue700,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: brand.slate500,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.blue700,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: brand.white,
    fontWeight: '700',
    fontSize: 13.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: brand.slate500,
  },
  metricValue: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchField: {
    flex: 1,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: brand.slate100,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  filterToggleActive: {
    backgroundColor: brand.blue700,
  },
  filterToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate600,
  },
  filterToggleTextActive: {
    color: brand.white,
  },
  filtersPanel: {
    backgroundColor: brand.slate50,
    marginHorizontal: 16,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: brand.slate200,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.slate500,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
  },
  dateField: {
    flex: 1,
  },
  dateError: {
    marginTop: -6,
    marginBottom: 4,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
  resetBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: brand.slate200,
    alignItems: 'center',
  },
  resetBtnText: {
    color: brand.slate700,
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: 12.5,
    color: brand.slate500,
  },
  footerEnd: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontSize: 12,
    color: brand.slate400,
  },
  totalsHint: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontSize: 11.5,
    color: brand.slate400,
  },
});
