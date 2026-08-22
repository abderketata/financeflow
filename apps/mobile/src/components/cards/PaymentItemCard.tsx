import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { PaymentItem } from '@/types';
import {
  getPaymentItemClientPrimary,
  getPaymentItemClientSecondary,
  getPaymentItemCurrency,
  getPaymentItemEffectiveDate,
  getPaymentItemEffectiveDateLabel,
  getPaymentItemReference,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import {
  getPaymentItemStatusVisual,
  getPaymentItemTypeVisual,
} from '@/modules/payment-items/utils/paymentItemVisuals';
import { formatCurrency, formatDate } from '@/utils/format';
import { brand, radius, spacing } from '@/theme/brand';

interface PaymentItemCardProps {
  item: PaymentItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Pastille « icône + libellé » teintée, équivalent du `ColoredChip` du web. */
function Chip({ icon, label, color, bg }: { icon: any; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Carte d'un chèque / d'une traite.
 *
 * Reprend les colonnes de la table web (référence, client, type, sens, montant,
 * réf. paiement, échéance, statut, actions) réorganisées pour l'écran étroit :
 * l'essentiel — référence, montant signé, statut — en tête, le détail en dessous.
 */
export function PaymentItemCard({ item, onEdit, onDelete }: PaymentItemCardProps) {
  const isIn = item.direction === 'IN';
  const directionColor = isIn ? brand.credit : brand.danger;
  const type = getPaymentItemTypeVisual(item);
  const status = getPaymentItemStatusVisual(item.status);
  const clientPrimary = getPaymentItemClientPrimary(item.client);
  const clientSecondary = getPaymentItemClientSecondary(item.client);
  const effectiveDate = getPaymentItemEffectiveDate(item);

  return (
    <AppCard accent={status.color}>
      {/* Référence + montant signé */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.directionBadge, { backgroundColor: isIn ? brand.creditBg : brand.dangerBg }]}>
            <Ionicons name={isIn ? 'arrow-up' : 'arrow-down'} size={13} color={directionColor} />
          </View>
          <Text style={styles.reference} numberOfLines={1}>
            {getPaymentItemReference(item)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: directionColor }]} numberOfLines={1}>
          {isIn ? '+' : '-'}
          {formatCurrency(item.amount, getPaymentItemCurrency(item))}
        </Text>
      </View>

      {/* Type + statut */}
      <View style={styles.chipsRow}>
        <Chip icon={type.icon} label={type.label} color={type.color} bg={type.bg} />
        <Chip icon={status.icon} label={status.label} color={status.color} bg={status.bg} />
      </View>

      <View style={styles.divider} />

      {/* Client */}
      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={14} color={brand.slate400} />
        <View style={styles.infoBody}>
          <Text style={styles.infoValue} numberOfLines={1}>
            {clientPrimary}
          </Text>
          {clientSecondary ? (
            <Text style={styles.infoMeta} numberOfLines={1}>
              {clientSecondary}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Échéance (ou émission à défaut, comme la colonne web) */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={14} color={brand.slate400} />
        <Text style={styles.infoLabel}>{getPaymentItemEffectiveDateLabel(item)}</Text>
        <Text style={styles.infoValueRight} numberOfLines={1}>
          {effectiveDate ? formatDate(effectiveDate) : '—'}
        </Text>
      </View>

      {/* Référence de paiement */}
      {item.referencePayment ? (
        <View style={styles.infoRow}>
          <Ionicons name="bookmark-outline" size={14} color={brand.slate400} />
          <Text style={styles.infoLabel}>Réf. paiement</Text>
          <Text style={styles.infoValueRight} numberOfLines={1}>
            {item.referencePayment}
          </Text>
        </View>
      ) : null}

      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onDelete ? (
            <AppButton block={false} variant="danger" icon="trash-outline" label="Supprimer" onPress={onDelete} />
          ) : null}
          {onEdit ? (
            <AppButton block={false} variant="outline" icon="create-outline" label="Modifier" onPress={onEdit} />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  directionBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reference: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brand.navy900,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md - 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: brand.slate100,
    marginTop: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    flex: 1,
    fontSize: 12.5,
    color: brand.slate500,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: brand.navy900,
  },
  infoValueRight: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.navy900,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoMeta: {
    marginTop: 1,
    fontSize: 11.5,
    color: brand.slate500,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
