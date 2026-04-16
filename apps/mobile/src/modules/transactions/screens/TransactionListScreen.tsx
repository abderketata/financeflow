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
import { TransactionCard } from '@/components/cards/TransactionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useTransactions, useDeleteTransaction } from '@/modules/transactions/hooks/useTransactions';
import { MobileStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/format';

const TYPE_OPTIONS = ['', 'DEBIT', 'CREDIT'];
const TYPE_LABELS: Record<string, string> = { '': 'Tous', DEBIT: 'Débit', CREDIT: 'Crédit' };

export function TransactionListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'TransactionList'>) {
  const { data = [], isLoading, isError, isFetching, refetch } = useTransactions();
  const deleteMutation = useDeleteTransaction();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const stats = useMemo(() => ({
    total: data.length,
    credits: data.filter((t) => t.operationType === 'CREDIT').reduce((s, t) => s + Number(t.amount ?? 0), 0),
    debits: data.filter((t) => t.operationType === 'DEBIT').reduce((s, t) => s + Number(t.amount ?? 0), 0),
  }), [data]);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((item) => {
      const textMatch = !q || [item.label, item.client?.name, item.bankAccount?.label].join(' ').toLowerCase().includes(q);
      const typeMatch = !typeFilter || item.operationType === typeFilter;
      return textMatch && typeMatch;
    });
  }, [data, search, typeFilter]);

  const handleDelete = (id: number, label: string) => {
    Alert.alert(
      'Supprimer cette opération ?',
      `"${label}" sera supprimée définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cette opération.');
            }
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
          <Text style={styles.title}>Opérations</Text>
          <Text style={styles.subtitle}>{rows.length} affiché(s){isFetching ? ' · Mise à jour…' : ''}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('TransactionForm', undefined)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statLabel, { color: '#16a34a' }]}>Crédits</Text>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatCurrency(stats.credits)}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.statLabel, { color: '#dc2626' }]}>Débits</Text>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{formatCurrency(stats.debits)}</Text>
        </View>
      </View>

      {/* Recherche + filtre type */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher par libellé, client, compte..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <FilterChips
          options={TYPE_OPTIONS.map((k) => TYPE_LABELS[k] ?? k)}
          value={TYPE_LABELS[typeFilter] ?? typeFilter}
          onChange={(label) => {
            const entry = Object.entries(TYPE_LABELS).find(([, v]) => v === label);
            setTypeFilter(entry ? entry[0] : '');
          }}
        />
      </View>

      {/* Liste */}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('TransactionForm', { transaction: item })}
            onLongPress={() => handleDelete(item.id, item.label)}
          >
            <TransactionCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucune opération"
            message="Aucune opération ne correspond à la recherche ou aux filtres."
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addBtn: { backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  stat: { flex: 1, borderRadius: 12, padding: 10, gap: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '800' },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 4 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
