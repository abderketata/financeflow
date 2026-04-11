import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientCard } from '@/components/cards/ClientCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useClients } from '@/modules/clients/hooks/useClients';
import { MobileStackParamList } from '@/navigation/types';
import { useMemo, useState } from 'react';

export function ClientListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'ClientList'>) {
  const { data = [], isLoading, isError, refetch } = useClients();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => data.filter((item) => `${item.name} ${item.code || ''} ${item.phone || ''}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('ClientForm')}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </Pressable>
      </View>
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} placeholder="Rechercher..." value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('ClientForm', { client: item })}>
            <ClientCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucun client" />}
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

