import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCard } from '@/components/cards/AlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useAlerts, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';

export function AlertListScreen() {
  const { data = [], isLoading, isError, refetch } = useAlerts();
  const updateMutation = useUpdateAlert();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Alertes</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => !item.isRead && updateMutation.mutate({ id: item.id, payload: { isRead: true } })}>
            <AlertCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucune alerte" />}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  content: {
    padding: 16
  }
});

