import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { DetailRow } from '@/components/ui/DetailRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { AlertItem } from '@/types';
import { formatDate } from '@/utils/format';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';
import {
  getAlertAssociatedLabel,
  getAlertScheduledAt,
  getAlertSentAt,
  getPrimaryAlertPaymentItem,
} from '@/modules/alerts/utils/alertPresentation';
import { brand, getStatusStyle, spacing } from '@/theme/brand';

interface AlertCardProps {
  item: AlertItem;
  onToggleRead?: () => void;
  onViewPayment?: () => void;
}

export function AlertCard({ item, onToggleRead, onViewPayment }: AlertCardProps) {
  const paymentItem = getPrimaryAlertPaymentItem(item);
  const paymentStatus = paymentItem ? String(getPaymentItemStatusLabel(paymentItem.status)) : null;

  return (
    <AppCard accent={item.isRead ? brand.slate200 : brand.violet}>
      <View style={styles.header}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <StatusPill
          label={item.isRead ? 'Lu' : 'Non lu'}
          color={item.isRead ? brand.credit : brand.warning}
          backgroundColor={item.isRead ? brand.creditBg : brand.warningBg}
        />
      </View>

      <Text style={styles.message}>{item.message}</Text>

      <View style={styles.divider} />

      <DetailRow icon="calendar-outline" label="Échéance" value={formatDate(getAlertScheduledAt(item))} />
      <DetailRow icon="paper-plane-outline" label="Envoi" value={formatDate(getAlertSentAt(item))} />
      <DetailRow icon="business-outline" label="Associé à" value={getAlertAssociatedLabel(item)} />
      {paymentStatus ? (
        <DetailRow
          icon="card-outline"
          label="Statut paiement"
          value={paymentStatus}
          valueColor={getStatusStyle(paymentStatus).color}
        />
      ) : null}

      {onToggleRead || onViewPayment ? (
        <View style={styles.actions}>
          {onToggleRead ? (
            <AppButton
              block={false}
              variant={item.isRead ? 'soft' : 'primary'}
              icon={item.isRead ? 'mail-unread-outline' : 'checkmark-done'}
              label={item.isRead ? 'Marquer non lue' : 'Marquer lue'}
              onPress={onToggleRead}
            />
          ) : null}
          {onViewPayment ? (
            <AppButton
              block={false}
              variant="outline"
              icon="eye-outline"
              label="Détails"
              onPress={onViewPayment}
            />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: brand.slate600,
  },
  titleUnread: {
    fontWeight: '800',
    color: brand.navy900,
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: brand.slate600,
  },
  divider: {
    height: 1,
    backgroundColor: brand.slate100,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
