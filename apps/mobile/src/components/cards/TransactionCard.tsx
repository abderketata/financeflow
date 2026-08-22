import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { brand, radius, spacing } from '@/theme/brand';

export function TransactionCard({ item }: { item: Transaction }) {
  const isCredit = item.operationType === 'CREDIT';
  const color = isCredit ? brand.credit : brand.danger;
  const background = isCredit ? brand.creditBg : brand.dangerBg;

  return (
    <AppCard accent={color}>
      <View style={styles.row}>
        <View style={[styles.medallion, { backgroundColor: background }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={19} color={color} />
        </View>

        <View style={styles.body}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={styles.meta}>{formatDate(item.operationDate)}</Text>
          {item.client?.name ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={12} color={brand.slate400} />
              <Text style={styles.meta} numberOfLines={1}>
                {item.client.name}
              </Text>
            </View>
          ) : null}
          {item.bankAccount?.label ? (
            <View style={styles.metaRow}>
              <Ionicons name="business-outline" size={12} color={brand.slate400} />
              <Text style={styles.meta} numberOfLines={1}>
                {item.bankAccount.label}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.right}>
          <StatusPill label={isCredit ? 'Crédit' : 'Débit'} color={color} backgroundColor={background} />
          <Text style={[styles.amount, { color }]} numberOfLines={1}>
            {isCredit ? '+' : '-'}
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  medallion: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '700',
    color: brand.navy900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontSize: 12,
    color: brand.slate500,
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  amount: {
    fontSize: 15.5,
    fontWeight: '800',
  },
});
