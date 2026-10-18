// Sélecteurs « Client » et « Compte » du formulaire de paiement.
//
// Équivalents mobiles des autocomplétions du web
// (`apps/web/src/components/ui/EntityAutocompleteFields.tsx`) : le client est
// cherché côté serveur, le compte est choisi parmi ceux du client sélectionné.
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchField } from '@/components/ui/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { clientService } from '@/modules/clients/services/client.service';
import { getClientDisplayName, getClientSecondaryName } from '@/modules/clients/utils/clientPresentation';
import { BankAccount, Client } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';

export const getAccountPrimaryLabel = (account?: BankAccount | null) =>
  account?.label?.trim() || account?.accountNumber?.trim() || '—';

export const getAccountSecondaryLabel = (account?: BankAccount | null) => {
  if (!account) {
    return '';
  }

  return [account.accountNumber?.trim(), account.bank?.code?.trim(), account.currency]
    .filter(Boolean)
    .join(' • ');
};

interface PickerFieldProps {
  label: string;
  placeholder: string;
  displayValue?: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  onOpen: () => void;
  onClear?: () => void;
}

/** Déclencheur : même coque que `AppTextField`, avec chevron ou croix de retrait. */
function PickerField({
  label,
  placeholder,
  displayValue,
  icon,
  error,
  helperText,
  disabled,
  onOpen,
  onClear,
}: PickerFieldProps) {
  const filled = Boolean(displayValue);
  const accentColor = error ? brand.danger : filled ? brand.blue600 : brand.slate400;

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={disabled ? undefined : onOpen}
        style={[
          styles.shell,
          Boolean(error) && styles.shellError,
          disabled && styles.shellDisabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={18} color={accentColor} />
        <Text style={[styles.shellText, filled && styles.shellTextFilled]} numberOfLines={1}>
          {displayValue || placeholder}
        </Text>
        {filled && onClear && !disabled ? (
          <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retirer la sélection">
            <Ionicons name="close-circle" size={18} color={brand.slate400} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={16} color={brand.slate400} />
        )}
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}
    </View>
  );
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  children: ReactNode;
}

function PickerModal({
  visible,
  title,
  searchPlaceholder,
  search,
  onSearchChange,
  onClose,
  children,
}: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={18} color={brand.slate600} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SearchField
            placeholder={searchPlaceholder}
            value={search}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
        </View>

        {children}
      </View>
    </Modal>
  );
}

interface OptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  primary: string;
  secondary?: string;
  selected: boolean;
  onPress: () => void;
}

function OptionRow({ icon, primary, secondary, selected, onPress }: OptionRowProps) {
  return (
    <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={selected ? brand.blue600 : brand.slate400} />
      <View style={styles.optionBody}>
        <Text style={styles.optionName} numberOfLines={1}>
          {primary}
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
}

interface ClientPickerFieldProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
  error?: string;
  label?: string;
}

/**
 * Client du paiement — recherche serveur (`clientService.lookup`) : 10 clients
 * récents à l'ouverture, puis résultats de la recherche, comme sur le web.
 */
export function ClientPickerField({ value, onChange, error, label = 'Client *' }: ClientPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: clients = [], isFetching, isError, refetch } = useQuery({
    queryKey: ['clients', 'payment-form-lookup', debouncedSearch],
    enabled: open,
    staleTime: 30_000,
    queryFn: () => clientService.lookup(debouncedSearch, debouncedSearch.trim() ? 50 : 10),
  });

  // Le client déjà sélectionné reste visible même s'il sort des résultats.
  const options = useMemo(() => {
    if (!value) {
      return clients;
    }

    return clients.some((client) => client.id === value.id) ? clients : [value, ...clients];
  }, [clients, value]);

  const select = (client: Client | null) => {
    onChange(client);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <PickerField
        label={label}
        placeholder="Rechercher par nom, société ou code…"
        displayValue={value ? getClientDisplayName(value) : undefined}
        icon="people-outline"
        error={error}
        onOpen={() => setOpen(true)}
        onClear={() => onChange(null)}
      />

      <PickerModal
        visible={open}
        title="Choisir un client"
        searchPlaceholder="Nom, société ou code client..."
        search={search}
        onSearchChange={setSearch}
        onClose={() => setOpen(false)}
      >
        <FlatList
          data={options}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <OptionRow
              icon="person-outline"
              primary={getClientDisplayName(item)}
              secondary={getClientSecondaryName(item)}
              selected={value?.id === item.id}
              onPress={() => select(item)}
            />
          )}
          ListEmptyComponent={
            isFetching ? (
              <View style={styles.state}>
                <ActivityIndicator size="small" color={brand.blue600} />
              </View>
            ) : isError ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>Impossible de charger les clients.</Text>
                <Pressable onPress={() => refetch()} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.retryText}>Réessayer</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateText}>Aucun client ne correspond à cette recherche.</Text>
              </View>
            )
          }
        />
      </PickerModal>
    </>
  );
}

interface AccountPickerFieldProps {
  value: BankAccount | null;
  options: BankAccount[];
  onChange: (account: BankAccount | null) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
}

/**
 * Compte bancaire du paiement — restreint aux comptes du client sélectionné,
 * inactif tant qu'aucun client n'est choisi (règle du web).
 */
export function AccountPickerField({
  value,
  options,
  onChange,
  loading,
  disabled,
  error,
  label = 'Compte',
}: AccountPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return options;
    }

    return options.filter((account) =>
      [account.label, account.accountNumber, account.rib, account.iban, account.bank?.code, account.bank?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [options, search]);

  const select = (account: BankAccount | null) => {
    onChange(account);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <PickerField
        label={label}
        placeholder={disabled ? "Sélectionnez d'abord un client" : 'Rechercher un compte…'}
        displayValue={value ? getAccountPrimaryLabel(value) : undefined}
        icon="wallet-outline"
        error={error}
        disabled={disabled}
        helperText={value ? getAccountSecondaryLabel(value) : undefined}
        onOpen={() => setOpen(true)}
        onClear={() => onChange(null)}
      />

      <PickerModal
        visible={open}
        title="Choisir un compte"
        searchPlaceholder="Libellé, RIB ou numéro de compte..."
        search={search}
        onSearchChange={setSearch}
        onClose={() => setOpen(false)}
      >
        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Pressable style={styles.option} onPress={() => select(null)}>
              <Ionicons name="remove-circle-outline" size={16} color={brand.slate500} />
              <Text style={styles.optionAll}>Aucun compte</Text>
              {!value ? <Ionicons name="checkmark" size={16} color={brand.blue600} /> : null}
            </Pressable>
          }
          renderItem={({ item }) => (
            <OptionRow
              icon="wallet-outline"
              primary={getAccountPrimaryLabel(item)}
              secondary={getAccountSecondaryLabel(item)}
              selected={value?.id === item.id}
              onPress={() => select(item)}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.state}>
                <ActivityIndicator size="small" color={brand.blue600} />
              </View>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateText}>Aucun compte trouvé pour ce client.</Text>
              </View>
            )
          }
        />
      </PickerModal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: spacing.lg - 2,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate700,
    marginBottom: 6,
  },
  fieldError: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
  fieldHelper: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 11.5,
    color: brand.slate500,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    minHeight: 52,
  },
  shellError: {
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
  },
  shellDisabled: {
    backgroundColor: brand.slate100,
  },
  shellText: {
    flex: 1,
    fontSize: 14.5,
    color: brand.slate400,
  },
  shellTextFilled: {
    color: brand.navy900,
    fontWeight: '600',
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
  retryText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: brand.blue600,
  },
});
