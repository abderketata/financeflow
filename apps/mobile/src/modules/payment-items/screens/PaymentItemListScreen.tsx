// PaymentItemListScreen — migration Web → Mobile complète
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { PaymentItemCard } from '@/components/cards/PaymentItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { usePaymentItems, useSoftDeletePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { getPaymentItemReference, getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import { MobileStackParamList } from '@/navigation/types';

const TYPE_OPTIONS = ['', 'CHEQUE', 'TRAITE', 'AUTRE'];
const TYPE_LABELS: Record<string, string> = { '': 'Tous', CHEQUE: 'Chèque', TRAITE: 'Traite', AUTRE: 'Autre' };
const STATUS_OPTIONS = ['', 'Déposé', 'Payé', 'Annulé', 'En retard'];
const DIR_OPTIONS = ['', 'IN', 'OUT'];
const DIR_LABELS: Record<string, string> = { '': 'Tous sens', IN: '↑ Entrant', OUT: '↓ Sortant' };

export function PaymentItemListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemList'>) {
  const { data = [], isLoading, isError, isFetching, refetch } = usePaymentItems();
  const softDeleteMutation = useSoftDeletePaymentItem();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dirFilter, setDirFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((item) => {
      if (q) {
        const hay = [
            getPaymentItemReference(item),
            String(getPaymentItemStatusLabel(item.status)),
            item.referencePayment,
            item.drawer,
            item.drawee,
            item.client?.name,
          ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter && item.type !== typeFilter) return false;
      if (statusFilter && String(getPaymentItemStatusLabel(item.status)) !== statusFilter) return false;
      if (dirFilter && item.direction !== dirFilter) return false;
      return true;
    });
  }, [data, search, typeFilter, statusFilter, dirFilter]);

  const handleArchive = (id: number, ref: string) => {
    Alert.alert(
      'Archiver ce paiement ?',
      `"${ref}" sera masqué de la liste mais conservé en base.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          style: 'destructive',
          onPress: async () => {
            try { await softDeleteMutation.mutateAsync(id); }
            catch { Alert.alert('Erreur', 'Impossible d\'archiver ce paiement.'); }
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chèques / Traites</Text>
          <Text style={styles.subtitle}>{rows.length} affiché(s){isFetching ? ' · Mise à jour…' : ''}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('PaymentItemForm', undefined)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>

      {/* Recherche */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Référence, réf. paiement, tireur, tiré..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <Pressable style={styles.filterToggle} onPress={() => setShowFilters((v) => !v)}>
          <Text style={styles.filterToggleText}>{showFilters ? '▲' : 'Filtres ▼'}</Text>
        </Pressable>
      </View>

      {/* Filtres */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Type</Text>
          <FilterChips
            options={TYPE_OPTIONS.map((k) => TYPE_LABELS[k] ?? k)}
            value={TYPE_LABELS[typeFilter] ?? typeFilter}
            onChange={(label) => { const e = Object.entries(TYPE_LABELS).find(([, v]) => v === label); setTypeFilter(e ? e[0] : ''); }}
          />
          <Text style={styles.filterLabel}>Statut</Text>
          <FilterChips
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v === statusFilter ? '' : v)}
          />
          <Text style={styles.filterLabel}>Sens</Text>
          <FilterChips
            options={DIR_OPTIONS.map((k) => DIR_LABELS[k] ?? k)}
            value={DIR_LABELS[dirFilter] ?? dirFilter}
            onChange={(label) => { const e = Object.entries(DIR_LABELS).find(([, v]) => v === label); setDirFilter(e ? e[0] : ''); }}
          />
          <Pressable style={styles.resetBtn} onPress={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setDirFilter(''); }}>
            <Text style={styles.resetBtnText}>Réinitialiser</Text>
          </Pressable>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PaymentItemForm', { paymentItem: item })}
            onLongPress={() => handleArchive(item.id, getPaymentItemReference(item))}
          >
            <PaymentItemCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucun paiement" message="Aucun paiement ne correspond aux critères." />}
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
  addBtn: { backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  filterToggle: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, justifyContent: 'center' },
  filterToggleText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  filtersPanel: { backgroundColor: '#f8fafc', marginHorizontal: 16, borderRadius: 14, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginTop: 8, marginBottom: 2 },
  resetBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' },
  resetBtnText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});


