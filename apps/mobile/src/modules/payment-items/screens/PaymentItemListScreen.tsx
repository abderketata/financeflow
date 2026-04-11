import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PaymentItemCard } from '@/components/cards/PaymentItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { usePaymentItems } from '@/modules/payment-items/hooks/usePaymentItems';
import { MobileStackParamList } from '@/navigation/types';
import { useMemo, useState } from 'react';

export function PaymentItemListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemList'>) {
  const { data = [], isLoading, isError, refetch } = usePaymentItems();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const rows = useMemo(() => data.filter((item) => {
    const textMatch = `${item.reference} ${item.status}`.toLowerCase().includes(search.toLowerCase());
    const typeMatch = !typeFilter || item.type === typeFilter;
    return textMatch && typeMatch;
  }), [data, search, typeFilter]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Chèques / Traites</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('PaymentItemForm')}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </Pressable>
      </View>
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} placeholder="Rechercher..." value={search} onChangeText={setSearch} />
        <FilterChips options={['', 'CHEQUE', 'TRAITE']} value={typeFilter} onChange={setTypeFilter} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('PaymentItemForm', { paymentItem: item })}>
            <PaymentItemCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucun paiement" />}
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

