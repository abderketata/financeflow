import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TransactionCard } from '@/components/cards/TransactionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useTransactions } from '@/modules/transactions/hooks/useTransactions';
import { MobileStackParamList } from '@/navigation/types';
import { useMemo, useState } from 'react';

export function TransactionListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'TransactionList'>) {
  const { data = [], isLoading, isError, refetch } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const rows = useMemo(() => data.filter((item) => {
    const textMatch = `${item.label}`.toLowerCase().includes(search.toLowerCase());
    const typeMatch = !typeFilter || item.operationType === typeFilter;
    return textMatch && typeMatch;
  }), [data, search, typeFilter]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Opérations</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('TransactionForm')}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </Pressable>
      </View>
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} placeholder="Rechercher..." value={search} onChangeText={setSearch} />
        <FilterChips options={['', 'DEBIT', 'CREDIT']} value={typeFilter} onChange={setTypeFilter} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('TransactionForm', { transaction: item })}>
            <TransactionCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucune opération" />}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  button: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  searchWrap: {
    padding: 16
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16
  }
});

