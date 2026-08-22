// PaymentItemDetailsModal — fiche de détail d'un effet, en lecture seule.
//
// Les listes du tableau de bord ne chargent qu'un sous-ensemble de champs :
// l'enregistrement complet (client, compte, tireur/tiré, notes) est relu par id
// à l'ouverture, l'objet reçu servant d'affichage immédiat.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetailRow } from '@/components/ui/DetailRow';
import { usePaymentItemDetails } from '@/modules/payment-items/hooks/usePaymentItems';
import {
  getPaymentItemAccount,
  getPaymentItemAccountPrimary,
  getPaymentItemAccountSecondary,
  getPaymentItemClientPrimary,
  getPaymentItemClientSecondary,
  getPaymentItemCurrency,
  getPaymentItemDirectionLabel,
  getPaymentItemNotes,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemTypeLabel,
  paymentMethodLabelMap,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import { PaymentItem } from '@/types';
import { brand, getStatusStyle, radius, spacing } from '@/theme/brand';
import { formatAmountInWords, formatCurrency, formatDate } from '@/utils/format';

interface PaymentItemDetailsModalProps {
  visible: boolean;
  /** Effet issu d'une liste : sert d'affichage immédiat pendant le rechargement. */
  paymentItem: Partial<PaymentItem> | null;
  onClose: () => void;
}

const displayValue = (value?: string | null) => (value && value !== '—' ? value : undefined);

export function PaymentItemDetailsModal({ visible, paymentItem, onClose }: PaymentItemDetailsModalProps) {
  const id = paymentItem?.id ? Number(paymentItem.id) : null;
  const { data: fullItem, isLoading, isError } = usePaymentItemDetails(id, visible);

  const item: Partial<PaymentItem> = { ...(paymentItem ?? {}), ...(fullItem ?? {}) };
  const currency = getPaymentItemCurrency(item);
  const isIncoming = item.direction === 'IN';
  const amountColor = isIncoming ? brand.credit : brand.danger;
  const status = String(getPaymentItemStatusLabel(item.status));
  const statusStyle = getStatusStyle(status);
  const amountInWords = formatAmountInWords(item.amount, currency);
  const account = getPaymentItemAccount(item);
  const accountPrimary = displayValue(getPaymentItemAccountPrimary(account));
  const accountSecondary = displayValue(getPaymentItemAccountSecondary(account));
  const clientPrimary = displayValue(getPaymentItemClientPrimary(item.client));
  const clientSecondary = displayValue(getPaymentItemClientSecondary(item.client));
  const notes = getPaymentItemNotes(item);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getPaymentItemReference(item) || "Détail de l'opération"}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {getPaymentItemDirectionLabel(item.direction)} • {getPaymentItemTypeLabel(item)}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={18} color={brand.slate600} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* ── Montant + statut ── */}
          <View style={[styles.amountCard, { borderColor: `${amountColor}26`, backgroundColor: `${amountColor}0D` }]}>
            <View style={styles.amountHeader}>
              <Text style={styles.amountLabel}>Montant</Text>
              <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
              </View>
            </View>
            <Text style={[styles.amountValue, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
              {isIncoming ? '+' : '-'}
              {formatCurrency(item.amount, currency)}
            </Text>
            {amountInWords ? <Text style={styles.amountWords}>{amountInWords}</Text> : null}
          </View>

          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={brand.blue600} />
              <Text style={styles.stateText}>Chargement du détail complet…</Text>
            </View>
          ) : null}

          {isError ? (
            <Text style={styles.errorText}>
              Le détail complet n'a pas pu être chargé. Seules les informations de la liste sont affichées.
            </Text>
          ) : null}

          {/* ── Informations ── */}
          <View style={styles.card}>
            <DetailRow icon="calendar-outline" label="Échéance" value={displayValue(formatDate(item.dueDate))} />
            <DetailRow icon="time-outline" label="Date d'émission" value={displayValue(formatDate(item.issueDate))} />
            <DetailRow icon="business-outline" label="Client" value={clientPrimary} />
            {clientSecondary ? <DetailRow icon="pricetag-outline" label="Référence client" value={clientSecondary} /> : null}
            <DetailRow icon="document-text-outline" label="Type" value={String(getPaymentItemTypeLabel(item))} />
            <DetailRow icon="person-outline" label="Tireur" value={displayValue(item.drawer)} />
            <DetailRow icon="person-circle-outline" label="Tiré" value={displayValue(item.drawee)} />
          </View>

          <View style={styles.card}>
            <DetailRow icon="wallet-outline" label="Compte bancaire" value={accountPrimary} />
            {accountSecondary ? <DetailRow icon="card-outline" label="RIB / N° compte" value={accountSecondary} /> : null}
            <DetailRow icon="business-outline" label="Banque" value={displayValue(item.bankName)} />
            <DetailRow
              icon="cash-outline"
              label="Mode de règlement"
              value={item.paymentMethod ? paymentMethodLabelMap[item.paymentMethod] : undefined}
            />
            <DetailRow
              icon="notifications-outline"
              label="Alerte"
              value={typeof item.alertDaysBefore === 'number' ? `${item.alertDaysBefore} jour(s) avant` : undefined}
            />
            <DetailRow icon="checkmark-done-outline" label="Date de règlement" value={displayValue(formatDate(item.paymentDate))} />
            <DetailRow icon="download-outline" label="Date de réception" value={displayValue(formatDate(item.receptionDate))} />
          </View>

          {notes ? (
            <View style={styles.card}>
              <View style={styles.notesTitleRow}>
                <Ionicons name="reader-outline" size={16} color={brand.blue600} />
                <Text style={styles.notesTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.canvas,
  },
  header: {
    backgroundColor: brand.white,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.lg + 2,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: brand.navy900,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.slate500,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  amountCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amountLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: brand.slate500,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountValue: {
    marginTop: spacing.sm,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  amountWords: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: brand.slate500,
  },
  card: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.slate200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    fontSize: 12.5,
    color: brand.slate500,
  },
  errorText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: brand.warning,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.navy900,
  },
  notesText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: brand.slate700,
  },
});
