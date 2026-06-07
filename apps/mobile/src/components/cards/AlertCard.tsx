import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertItem } from '@/types';
import { formatDate } from '@/utils/format';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import { getAlertAssociatedLabel, getAlertScheduledAt, getAlertSentAt, getPrimaryAlertPaymentItem } from '@/modules/alerts/utils/alertPresentation';

interface AlertCardProps {
  item: AlertItem;
  onToggleRead?: () => void;
  onViewPayment?: () => void;
}

export function AlertCard({ item, onToggleRead, onViewPayment }: AlertCardProps) {
  const paymentItem = getPrimaryAlertPaymentItem(item);
  const paymentStatus = paymentItem ? String(getPaymentItemStatusLabel(paymentItem.status)) : null;
  const associatedLabel = getAlertAssociatedLabel(item);

  return (
    <View style={[styles.card, !item.isRead && styles.cardUnread]}>
      {!item.isRead && <View style={styles.unreadBar} />}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, item.isRead ? styles.badgeRead : styles.badgeUnread]}>
            <Text style={[styles.badgeText, item.isRead ? styles.badgeReadText : styles.badgeUnreadText]}>
              {item.isRead ? 'Lu' : 'Non lu'}
            </Text>
          </View>
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.meta}>📅 Échéance : {formatDate(getAlertScheduledAt(item))}</Text>
        <Text style={styles.meta}>✉️ Envoi : {formatDate(getAlertSentAt(item))}</Text>
        <Text style={styles.meta}>👤 {associatedLabel}</Text>
        {paymentStatus ? <Text style={styles.meta}>💳 Statut paiement : {paymentStatus}</Text> : null}
        {(onToggleRead || onViewPayment) && (
          <View style={styles.actions}>
            {onToggleRead && (
              <Pressable style={[styles.actionBtn, item.isRead ? styles.markUnreadBtn : styles.markReadBtn]} onPress={onToggleRead}>
                <Text style={[styles.markReadText, item.isRead ? styles.markUnreadText : null]}>
                  {item.isRead ? '↺ Marquer non lue' : '✓ Marquer lue'}
                </Text>
              </Pressable>
            )}
            {onViewPayment && (
              <Pressable style={[styles.actionBtn, styles.viewBtn]} onPress={onViewPayment}>
                <Text style={styles.viewBtnText}>Détails paiement</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardUnread: { backgroundColor: '#fffbeb' },
  unreadBar: { width: 4, backgroundColor: '#f59e0b' },
  content: { flex: 1, padding: 14, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 },
  titleUnread: { fontWeight: '800', color: '#0f172a' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, flexShrink: 0 },
  badgeUnread: { backgroundColor: '#fef3c7' },
  badgeRead: { backgroundColor: '#f0fdf4' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeUnreadText: { color: '#d97706' },
  badgeReadText: { color: '#16a34a' },
  message: { fontSize: 13, color: '#334155', lineHeight: 18 },
  meta: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  markReadBtn: { backgroundColor: '#eff6ff' },
  markUnreadBtn: { backgroundColor: '#f1f5f9' },
  markReadText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  markUnreadText: { color: '#475569' },
  viewBtn: { backgroundColor: '#f1f5f9' },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
});
