import {
  ActivityIndicator,
  Alert as NativeAlert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAlertPaymentItems } from '@/modules/alerts/hooks/useAlerts';
import { useUpdatePaymentItem } from '@/modules/payment-items/hooks/usePaymentItems';
import { AlertItem, PaymentItem, RelationCollection } from '@/types';
import { formatAmountInWords, formatCurrency, formatDate } from '@/utils/format';
import { getAlertScheduledAt, getAlertSentAt } from '@/modules/alerts/utils/alertPresentation';
import {
  getPaymentItemClientPrimary,
  getPaymentItemCurrency,
  getPaymentItemNotes,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemTypeLabel,
  isPaymentItemClosedStatus,
} from '@/modules/payment-items/utils/paymentItemPresentation';

interface AlertPaymentDetailsModalProps {
  visible: boolean;
  alert: AlertItem | null;
  onClose: () => void;
}

type TargetStatus = 'Payé' | 'Annulé';

const statusStyles: Record<string, { text: string; background: string }> = {
  Reçu: { text: '#2563eb', background: '#dbeafe' },
  'Déposé': { text: '#d97706', background: '#fef3c7' },
  'Payé': { text: '#059669', background: '#dcfce7' },
  'Rejeté': { text: '#dc2626', background: '#fee2e2' },
  'Annulé': { text: '#475569', background: '#e2e8f0' },
  'En retard': { text: '#dc2626', background: '#fee2e2' },
};

const typeStyles: Record<string, { label: string; text: string; background: string; icon: string }> = {
  CHEQUE: { label: 'Chèque', text: '#D97706', background: '#FFFBEB', icon: '🧾' },
  TRAITE: { label: 'Traite', text: '#7C3AED', background: '#F5F3FF', icon: '📄' },
  AUTRE: { label: 'Autre', text: '#64748B', background: '#F1F5F9', icon: '⋯' },
};

const hasDisplayValue = (value?: string | null) => value !== undefined && value !== null && value !== '' && value !== '—';

const getErrorMessage = (error: unknown) => {
  const value = error as any;
  return value?.error?.message || value?.message || 'Impossible de charger les payment-items associés à cette alerte.';
};

const getMutationErrorMessage = (error: unknown) => {
  const value = error as any;
  return value?.error?.message || value?.message || 'Impossible de mettre à jour le statut du paiement.';
};

const replacePaymentItemInRelation = (relation: RelationCollection<PaymentItem> | undefined, updatedItem: PaymentItem) => {
  if (!relation) {
    return relation;
  }

  if (Array.isArray(relation)) {
    let changed = false;
    const nextRelation = relation.map((item) => {
      if (item.id !== updatedItem.id) {
        return item;
      }

      changed = true;
      return updatedItem;
    });

    return changed ? nextRelation : relation;
  }

  const currentItems = relation.data ?? [];
  let changed = false;
  const nextItems = currentItems.map((item) => {
    if (item.id !== updatedItem.id) {
      return item;
    }

    changed = true;
    return updatedItem;
  });

  return changed ? { ...relation, data: nextItems } : relation;
};

const patchAlertsWithUpdatedPaymentItem = (alerts: AlertItem[] | undefined, updatedItem: PaymentItem) =>
  alerts?.map((entry) => {
    const nextPaymentItem = entry.paymentItem?.id === updatedItem.id ? updatedItem : entry.paymentItem;
    const nextPaymentItems = replacePaymentItemInRelation(entry.paymentItems, updatedItem);

    if (nextPaymentItem === entry.paymentItem && nextPaymentItems === entry.paymentItems) {
      return entry;
    }

    return {
      ...entry,
      paymentItem: nextPaymentItem,
      paymentItems: nextPaymentItems,
    };
  });

function DetailField({ label, value, fullWidth = false }: { label: string; value?: string | null; fullWidth?: boolean }) {
  if (!hasDisplayValue(value)) {
    return null;
  }

  return (
    <View style={[styles.detailField, fullWidth && styles.detailFieldFullWidth]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PaymentStatusBadge({ status }: { status?: string | null }) {
  const label = String(getPaymentItemStatusLabel(status));
  const style = statusStyles[label] ?? { text: '#475569', background: '#e2e8f0' };

  return (
    <View style={[styles.statusBadge, { backgroundColor: style.background }]}>
      <Text style={[styles.statusBadgeText, { color: style.text }]}>{label}</Text>
    </View>
  );
}

function PaymentTypeInline({ item }: { item: PaymentItem }) {
  const config = typeStyles[item.type] ?? typeStyles.AUTRE;
  const label = String(getPaymentItemTypeLabel(item));

  return (
    <View style={styles.typeInlineWrap}>
      <View style={[styles.typeInlineIconBox, { backgroundColor: config.background }]}>
        <Text style={[styles.typeInlineIconText, { color: config.text }]}>{config.icon}</Text>
      </View>
      <Text style={[styles.typeInlineLabel, { color: config.text }]}>{label}</Text>
    </View>
  );
}

function PaymentItemDetailsCard({
  item,
  alert,
  onStatusAction,
  pendingStatus,
  loading,
}: {
  item: PaymentItem;
  alert: AlertItem;
  onStatusAction: (item: PaymentItem, status: TargetStatus) => void;
  pendingStatus?: TargetStatus | null;
  loading: boolean;
}) {
  const currency = getPaymentItemCurrency(item);
  const amountInWords = formatAmountInWords(item.amount, currency);
  const paymentStatus = String(getPaymentItemStatusLabel(item.status));
  const isClosed = isPaymentItemClosedStatus(item.status);
  const scheduledAt = formatDate(getAlertScheduledAt(alert));
  const sentAt = formatDate(getAlertSentAt(alert));
  const isIncoming = item.direction === 'IN';

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentCardHeaderText}>
          <View style={styles.referenceRow}>
            <View style={[styles.directionBadge, { backgroundColor: isIncoming ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.directionBadgeText, { color: isIncoming ? '#16a34a' : '#dc2626' }]}>{isIncoming ? '↑' : '↓'}</Text>
            </View>
            <Text style={styles.paymentTitle}>{getPaymentItemReference(item)}</Text>
          </View>
        </View>
        <PaymentStatusBadge status={item.status} />
      </View>

      <View style={[styles.amountPanel, { backgroundColor: item.direction === 'IN' ? '#ecfdf5' : '#fef2f2', borderColor: item.direction === 'IN' ? '#a7f3d0' : '#fecaca' }]}>
        <Text style={styles.amountPanelLabel}>Montant</Text>
        <Text style={[styles.amountValue, { color: item.direction === 'IN' ? '#059669' : '#dc2626' }]}>
          {item.direction === 'IN' ? '+' : '-'}{formatCurrency(item.amount, currency)}
        </Text>
        {amountInWords ? <Text style={styles.amountWords}>{amountInWords}</Text> : null}
      </View>

      <View style={styles.detailGrid}>
        <DetailField label="Client" value={getPaymentItemClientPrimary(item.client)} />
        <View style={styles.detailField}>
          <Text style={styles.detailLabel}>Type</Text>
          <PaymentTypeInline item={item} />
        </View>
        <DetailField label="Tireur" value={item.drawer} />
        <DetailField label="Tiré" value={item.drawee} />
        <DetailField label="Date d'émission" value={formatDate(item.issueDate)} />
        <DetailField label="Jours avant" value={typeof item.alertDaysBefore === 'number' ? `${item.alertDaysBefore} jour(s)` : '—'} />
        <DetailField label="Notes" value={getPaymentItemNotes(item)} fullWidth />
      </View>

      <View style={styles.alertInfoBox}>
        <Text style={styles.alertInfoTitle}>Informations de l’alerte liée</Text>
        <View style={styles.detailGrid}>
          <DetailField label="Échéance" value={scheduledAt} />
          <DetailField label="Date d’envoi" value={sentAt} />
          <DetailField label="Lu" value={alert.isRead ? 'Oui' : 'Non'} />
        </View>
      </View>

      {isClosed ? (
        <Text style={styles.closedInfo}>Ce paiement est déjà marqué comme {paymentStatus.toLowerCase()}.</Text>
      ) : (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.cancelButton, loading && styles.actionButtonDisabled]}
            onPress={() => onStatusAction(item, 'Annulé')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annulé</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.payButton, loading && styles.actionButtonDisabled]}
            onPress={() => onStatusAction(item, 'Payé')}
            disabled={loading}
          >
            <Text style={styles.payButtonText}>Payé</Text>
          </Pressable>
        </View>
      )}

      {loading && pendingStatus ? <Text style={styles.pendingText}>Mise à jour vers “{pendingStatus}”…</Text> : null}
    </View>
  );
}

export function AlertPaymentDetailsModal({ visible, alert, onClose }: AlertPaymentDetailsModalProps) {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error, refetch } = useAlertPaymentItems(alert?.id, visible);
  const updatePaymentItemMutation = useUpdatePaymentItem();
  const [pendingAction, setPendingAction] = useState<{ item: PaymentItem; status: TargetStatus } | null>(null);

  const syncCaches = (updatedItem: PaymentItem) => {
    if (!alert?.id) {
      return;
    }

    queryClient.setQueryData<PaymentItem[]>(['mobile-alerts', 'payment-items', alert.id], (current) => {
      if (!current?.length) {
        return [updatedItem];
      }

      let found = false;
      const nextItems = current.map((item) => {
        if (item.id !== updatedItem.id) {
          return item;
        }

        found = true;
        return updatedItem;
      });

      return found ? nextItems : [updatedItem, ...current];
    });

    queryClient.setQueryData<AlertItem[]>(['mobile-alerts'], (current) => patchAlertsWithUpdatedPaymentItem(current, updatedItem));
  };

  const handleStatusChange = async (item: PaymentItem, status: TargetStatus) => {
    try {
      setPendingAction({ item, status });
      const updatedItem = await updatePaymentItemMutation.mutateAsync({
        id: item.id,
        payload: { status },
      });

      syncCaches((updatedItem ?? { ...item, status }) as PaymentItem);
      NativeAlert.alert('Succès', `Le paiement ${getPaymentItemReference(item)} est maintenant “${status}”.`);
    } catch (mutationError) {
      NativeAlert.alert('Erreur', getMutationErrorMessage(mutationError));
    } finally {
      setPendingAction(null);
    }
  };

  const requestStatusChange = (item: PaymentItem, status: TargetStatus) => {
    NativeAlert.alert(
      `Marquer ${getPaymentItemReference(item)} comme ${status} ?`,
      `Le statut du payment-item lié à cette alerte sera mis à jour vers “${status}”.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: status,
          style: status === 'Annulé' ? 'destructive' : 'default',
          onPress: () => {
            void handleStatusChange(item, status);
          },
        },
      ],
    );
  };

  const pendingItemId = updatePaymentItemMutation.isPending ? pendingAction?.item.id : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Détails paiement</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {alert?.title || 'Alerte sélectionnée'}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.stateText}>Chargement des payment-items associés...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Erreur de chargement</Text>
              <Text style={styles.stateText}>{getErrorMessage(error)}</Text>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : !data.length ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Aucun payment item associé</Text>
              <Text style={styles.stateText}>Cette alerte n’est liée à aucun paiement exploitable pour le moment.</Text>
            </View>
          ) : (
            <View style={styles.cardsWrap}>
              {alert
                ? data.map((item) => (
                    <PaymentItemDetailsCard
                      key={item.id}
                      item={item}
                      alert={alert}
                      onStatusAction={requestStatusChange}
                      pendingStatus={pendingItemId === item.id ? pendingAction?.status : null}
                      loading={updatePaymentItemMutation.isPending}
                    />
                  ))
                : null}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  body: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  stateBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  stateText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#2563eb',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cardsWrap: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    gap: 12,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  paymentCardHeaderText: {
    flex: 1,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directionBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  directionBadgeText: {
    fontSize: 15,
    fontWeight: '900',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  amountPanelLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  amountValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
  },
  amountWords: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailField: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailFieldFullWidth: {
    width: '100%',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
  },
  typeInlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeInlineIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInlineIconText: {
    fontSize: 12,
    fontWeight: '800',
  },
  typeInlineLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flexShrink: 1,
  },
  alertInfoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    padding: 10,
    gap: 8,
  },
  alertInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c2410c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  payButton: {
    backgroundColor: '#16a34a',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  closedInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
});

