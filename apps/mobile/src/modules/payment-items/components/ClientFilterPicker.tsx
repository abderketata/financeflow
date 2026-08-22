import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchField } from '@/components/ui/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { clientService } from '@/modules/clients/services/client.service';
import { getClientDisplayName, getClientSecondaryName } from '@/modules/clients/utils/clientPresentation';
import { Client } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';

interface ClientFilterPickerProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
}

/**
 * Filtre « Client » de la liste des chèques / traites.
 *
 * Équivalent de l'autocomplete du web : 10 clients récents à l'ouverture, puis
 * recherche serveur (`clientService.lookup`) dès la saisie — la liste complète
 * n'est jamais chargée sur mobile.
 */
export function ClientFilterPicker({ value, onChange }: ClientFilterPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: clients = [], isFetching } = useQuery({
    queryKey: ['clients', 'payment-items-filter-lookup', debouncedSearch],
    enabled: open,
    staleTime: 30_000,
    queryFn: () => clientService.lookup(debouncedSearch, debouncedSearch.trim() ? 50 : 10),
  });

  const select = (client: Client | null) => {
    onChange(client);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="people-outline" size={16} color={value ? brand.blue600 : brand.slate400} />
        <Text style={[styles.triggerText, value && styles.triggerTextActive]} numberOfLines={1}>
          {value ? getClientDisplayName(value) : 'Tous les clients'}
        </Text>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Retirer le filtre client"
          >
            <Ionicons name="close-circle" size={16} color={brand.slate400} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={14} color={brand.slate400} />
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrer par client</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
              <Ionicons name="close" size={18} color={brand.slate600} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <SearchField
              placeholder="Nom, société ou code client..."
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>

          <FlatList
            data={clients}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable style={styles.option} onPress={() => select(null)}>
                <Ionicons name="layers-outline" size={16} color={brand.slate500} />
                <Text style={styles.optionAll}>Tous les clients</Text>
                {!value ? <Ionicons name="checkmark" size={16} color={brand.blue600} /> : null}
              </Pressable>
            }
            renderItem={({ item }) => {
              const selected = value?.id === item.id;
              const secondary = getClientSecondaryName(item);

              return (
                <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={() => select(item)}>
                  <Ionicons name="person-outline" size={16} color={selected ? brand.blue600 : brand.slate400} />
                  <View style={styles.optionBody}>
                    <Text style={styles.optionName} numberOfLines={1}>
                      {getClientDisplayName(item)}
                    </Text>
                    {secondary ? (
                      <Text style={styles.optionMeta} numberOfLines={1}>
                        {secondary}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <Ionicons name="checkmark" size={16} color={brand.blue600} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              isFetching ? (
                <View style={styles.state}>
                  <ActivityIndicator size="small" color={brand.blue600} />
                </View>
              ) : (
                <View style={styles.state}>
                  <Text style={styles.stateText}>Aucun client ne correspond à cette recherche.</Text>
                </View>
              )
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 13.5,
    color: brand.slate500,
  },
  triggerTextActive: {
    color: brand.navy900,
    fontWeight: '700',
  },
  modal: {
    flex: 1,
    backgroundColor: brand.canvas,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: brand.navy900,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
  searchWrap: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: brand.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brand.slate200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: brand.blue300,
    backgroundColor: brand.blue50,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionAll: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: brand.slate600,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.navy900,
  },
  optionMeta: {
    marginTop: 1,
    fontSize: 12,
    color: brand.slate500,
  },
  state: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 13,
    color: brand.slate500,
  },
});
