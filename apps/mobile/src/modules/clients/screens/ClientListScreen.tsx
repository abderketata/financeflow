import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ClientCard } from '@/components/cards/ClientCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { useClients, useUpdateClient } from '@/modules/clients/hooks/useClients';
import { confirmAction, notify } from '@/utils/confirm';
import { MobileStackParamList } from '@/navigation/types';
import { Client } from '@/types';
import {
  getClientDisplayName,
  getClientInitials,
  getClientSecondaryName,
  getClientTypeLabel,
  getClientStatusLabel,
  getClientActivitySummary,
  getDisplayValue,
  getClientAccounts,
  getClientMetrics,
  buildClientMutationPayload,
} from '@/modules/clients/utils/clientPresentation';

type PresenceFilter = '' | 'WITH' | 'WITHOUT';

// Options avec labels traduits directement dans la valeur affichée
const TYPE_CHIP_OPTIONS = ['', 'INDIVIDUAL', 'COMPANY'];
const TYPE_CHIP_LABELS: Record<string, string> = { '': 'Tous types', INDIVIDUAL: 'Particulier', COMPANY: 'Société' };
const STATUS_CHIP_OPTIONS = ['', 'ACTIVE', 'INACTIVE'];
const STATUS_CHIP_LABELS: Record<string, string> = { '': 'Tous statuts', ACTIVE: 'Actifs', INACTIVE: 'Inactifs' };
const ACCOUNTS_CHIP_OPTIONS = ['', 'WITH', 'WITHOUT'];
const ACCOUNTS_CHIP_LABELS: Record<string, string> = { '': 'Tous', WITH: 'Avec comptes', WITHOUT: 'Sans compte' };
const TRANSACTIONS_CHIP_OPTIONS = ['', 'WITH', 'WITHOUT'];
const TRANSACTIONS_CHIP_LABELS: Record<string, string> = { '': 'Toutes', WITH: 'Avec transactions', WITHOUT: 'Sans transaction' };

/** Modal de détail client */
function ClientDetailModal({
  client,
  onClose,
  onEdit,
}: {
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
}) {
  if (!client) return null;
  const accounts = getClientAccounts(client);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        {/* Header */}
        <View style={modal.header}>
          <View style={modal.avatar}>
            <Text style={modal.avatarText}>{getClientInitials(client)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={modal.name}>{getClientDisplayName(client)}</Text>
            {getClientSecondaryName(client) ? (
              <Text style={modal.company}>{getClientSecondaryName(client)}</Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} style={modal.closeBtn}>
            <Text style={modal.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={modal.body} showsVerticalScrollIndicator={false}>
          {/* Badges statut + type */}
          <View style={modal.row}>
            <View style={[modal.badge, client.isActive === false ? modal.badgeInactive : modal.badgeActive]}>
              <Text style={modal.badgeText}>{getClientStatusLabel(client.isActive)}</Text>
            </View>
            <View style={modal.badgeType}>
              <Text style={modal.badgeTypeText}>{getClientTypeLabel(client.type)}</Text>
            </View>
          </View>

          {/* Informations contact */}
          <DetailRow label="Téléphone" value={getDisplayValue(client.phone)} />
          <DetailRow label="Email" value={getDisplayValue(client.email)} />
          <DetailRow label="Adresse" value={getDisplayValue(client.address)} />
          {client.identityNumber ? <DetailRow label="Identifiant" value={client.identityNumber} /> : null}
          {client.taxNumber ? <DetailRow label="Matricule fiscal" value={client.taxNumber} /> : null}
          {client.notes ? <DetailRow label="Notes" value={client.notes} /> : null}

          {/* Activité */}
          <View style={modal.sectionHeader}>
            <Text style={modal.sectionTitle}>Activité</Text>
          </View>
          <Text style={modal.activityText}>{getClientActivitySummary(client)}</Text>

          {/* Comptes */}
          {accounts.length > 0 && (
            <>
              <View style={modal.sectionHeader}>
                <Text style={modal.sectionTitle}>Comptes bancaires ({accounts.length})</Text>
              </View>
              {accounts.map((account) => (
                <View key={account.id} style={modal.accountRow}>
                  <Text style={modal.accountLabel}>{account.label}</Text>
                  <Text style={modal.accountMeta}>{account.accountNumber}{account.currency ? ` • ${account.currency}` : ''}{account.bank?.name ? ` • ${account.bank.name}` : ''}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={modal.footer}>
          <Pressable style={[modal.btn, modal.editBtn]} onPress={() => { onClose(); onEdit(client); }}>
            <Text style={modal.editBtnText}>✏️  Modifier</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={modal.detailRow}>
      <Text style={modal.detailLabel}>{label}</Text>
      <Text style={modal.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function ClientListScreen({ navigation }: NativeStackScreenProps<MobileStackParamList, 'ClientList'>) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accountsFilter, setAccountsFilter] = useState<PresenceFilter>('');
  const [transactionsFilter, setTransactionsFilter] = useState<PresenceFilter>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  // Recherche envoyée au serveur, avec les mêmes critères que le web : le
  // filtrage local ne voyait que la page chargée et ignorait les relations
  // (n° de compte, RIB, IBAN, libellé de transaction, référence de paiement).
  const queryParams = useMemo(() => {
    const term = debouncedSearch.trim();

    if (!term) return undefined;

    return {
      filters: {
        $or: [
          { fullName: { $containsi: term } },
          { companyName: { $containsi: term } },
          { code: { $containsi: term } },
          { phone: { $containsi: term } },
          { email: { $containsi: term } },
          { accounts: { accountNumber: { $containsi: term } } },
          { accounts: { rib: { $containsi: term } } },
          { accounts: { iban: { $containsi: term } } },
          { transactions: { label: { $containsi: term } } },
          { paymentItems: { referenceNumber: { $containsi: term } } },
        ],
      },
    };
  }, [debouncedSearch]);

  const { data = [], isLoading, isError, isFetching, refetch } = useClients({ params: queryParams });
  const updateMutation = useUpdateClient();

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((c) => c.isActive !== false).length,
    inactive: data.filter((c) => c.isActive === false).length,
  }), [data]);

  // La recherche textuelle est traitée par le serveur ; ne restent ici que
  // les filtres qui portent sur des données déjà chargées.
  const filteredRows = useMemo(() => data.filter((client) => {
    const metrics = getClientMetrics(client);

    if (typeFilter && client.type !== typeFilter) return false;
    if (statusFilter === 'ACTIVE' && client.isActive === false) return false;
    if (statusFilter === 'INACTIVE' && client.isActive !== false) return false;
    if (accountsFilter === 'WITH' && metrics.accountsCount === 0) return false;
    if (accountsFilter === 'WITHOUT' && metrics.accountsCount > 0) return false;
    if (transactionsFilter === 'WITH' && metrics.transactionsCount === 0) return false;
    if (transactionsFilter === 'WITHOUT' && metrics.transactionsCount > 0) return false;

    return true;
  }), [data, typeFilter, statusFilter, accountsFilter, transactionsFilter]);

  const activeFilterCount = [typeFilter, statusFilter, accountsFilter, transactionsFilter].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setAccountsFilter('');
    setTransactionsFilter('');
  };

  const handleToggleStatus = async (client: Client) => {
    const willActivate = client.isActive === false;
    const name = getClientDisplayName(client);

    const confirmed = await confirmAction({
      title: willActivate ? 'Activer ce client' : 'Désactiver ce client',
      message: willActivate
        ? `Voulez-vous vraiment activer le client "${name}" ? Il redeviendra disponible pour les opérations.`
        : `Voulez-vous vraiment désactiver le client "${name}" ? Il ne sera plus visible dans les opérations courantes.`,
      confirmLabel: willActivate ? 'Activer' : 'Désactiver',
      destructive: !willActivate,
    });

    if (!confirmed) return;

    try {
      await updateMutation.mutateAsync({
        id: client.id,
        payload: buildClientMutationPayload({ ...client, isActive: willActivate }),
      });

      // La fiche ouverte doit refléter le nouveau statut sans être rouverte.
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...selectedClient, isActive: willActivate });
      }
    } catch {
      notify('Erreur', 'Impossible de modifier le statut.');
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Screen>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Clients</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredRows.length}</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {isFetching
              ? 'Mise à jour des résultats…'
              : 'Gestion des clients : statut, contacts et informations clés'}
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('ClientForm', undefined)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </Pressable>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatPill label={`Total : ${stats.total}`} color="#e0f2fe" textColor="#0369a1" />
        <StatPill label={`Actifs : ${stats.active}`} color="#dcfce7" textColor="#16a34a" />
        <StatPill label={`Inactifs : ${stats.inactive}`} color="#f1f5f9" textColor="#64748b" />
      </View>

      {/* ── Recherche ── */}
      <View style={styles.searchRow}>
        <SearchField
          style={styles.searchField}
          placeholder="Rechercher un client..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <Pressable
          style={[styles.filterToggle, activeFilterCount > 0 && styles.filterToggleActive]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <Ionicons name="options-outline" size={15} color={activeFilterCount > 0 ? '#fff' : '#475569'} />
          <Text style={[styles.filterToggleText, activeFilterCount > 0 && styles.filterToggleTextActive]}>
            {activeFilterCount > 0 ? String(activeFilterCount) : 'Filtres'}
          </Text>
        </Pressable>
      </View>

      {/* ── Filtres dépliables ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Type</Text>
          <FilterChips
            options={TYPE_CHIP_OPTIONS}
            value={TYPE_CHIP_LABELS[typeFilter] ?? typeFilter}
            onChange={(label) => {
              const entry = Object.entries(TYPE_CHIP_LABELS).find(([, v]) => v === label);
              setTypeFilter(entry ? entry[0] : '');
            }}
          />
          <Text style={styles.filterLabel}>Statut</Text>
          <FilterChips
            options={STATUS_CHIP_OPTIONS.map((k) => STATUS_CHIP_LABELS[k] ?? k)}
            value={STATUS_CHIP_LABELS[statusFilter] ?? statusFilter}
            onChange={(label) => {
              const entry = Object.entries(STATUS_CHIP_LABELS).find(([, v]) => v === label);
              setStatusFilter(entry ? entry[0] : '');
            }}
          />
          <Text style={styles.filterLabel}>Comptes bancaires</Text>
          <FilterChips
            options={ACCOUNTS_CHIP_OPTIONS.map((k) => ACCOUNTS_CHIP_LABELS[k] ?? k)}
            value={ACCOUNTS_CHIP_LABELS[accountsFilter] ?? accountsFilter}
            onChange={(label) => {
              const entry = Object.entries(ACCOUNTS_CHIP_LABELS).find(([, v]) => v === label);
              setAccountsFilter((entry ? entry[0] : '') as PresenceFilter);
            }}
          />
          <Text style={styles.filterLabel}>Transactions</Text>
          <FilterChips
            options={TRANSACTIONS_CHIP_OPTIONS.map((k) => TRANSACTIONS_CHIP_LABELS[k] ?? k)}
            value={TRANSACTIONS_CHIP_LABELS[transactionsFilter] ?? transactionsFilter}
            onChange={(label) => {
              const entry = Object.entries(TRANSACTIONS_CHIP_LABELS).find(([, v]) => v === label);
              setTransactionsFilter((entry ? entry[0] : '') as PresenceFilter);
            }}
          />
          <Pressable style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
          </Pressable>
        </View>
      )}

      {/* ── Liste ── */}
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedClient(item)}>
            <ClientCard
              item={item}
              onEdit={() => navigation.navigate('ClientForm', { client: item })}
              onToggleStatus={() => handleToggleStatus(item)}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucun client trouvé"
            message="Aucun client ne correspond aux critères. Ajustez la recherche ou réinitialisez les filtres."
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563EB" />}
      />

      {/* ── Modal détail ── */}
      <ClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={(client) => navigation.navigate('ClientForm', { client })}
      />
    </Screen>
  );
}

function StatPill({ label, color, textColor }: { label: string; color: string; textColor: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: color }]}>
      <Text style={[styles.statPillText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: '#0f172a' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#e0f2fe' },
  countBadgeText: { fontSize: 12, fontWeight: '800', color: '#0369a1' },
  subtitle: { fontSize: 12, lineHeight: 16, color: '#94a3b8', marginTop: 3 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statPillText: { fontSize: 12, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchField: { flex: 1 },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
  },
  filterToggleActive: { backgroundColor: '#1D4ED8' },
  filterToggleText: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  filterToggleTextActive: { color: '#fff' },
  filtersPanel: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 2,
  },
  resetBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  resetBtnText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  company: { fontSize: 13, color: '#64748b', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#475569', fontWeight: '700' },
  body: { padding: 20, paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeInactive: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  badgeType: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeTypeText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: { fontSize: 13, color: '#94a3b8', flex: 1 },
  detailValue: { fontSize: 13, color: '#0f172a', fontWeight: '600', flex: 2, textAlign: 'right' },
  activityText: { fontSize: 13, color: '#475569' },
  accountRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  accountLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  accountMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  editBtn: { backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fef08a' },
  editBtnText: { color: '#ca8a04', fontWeight: '800', fontSize: 15 },
});
