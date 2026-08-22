import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Client } from '@/types';
import {
  getClientActivitySummary,
  getClientDisplayName,
  getClientInitials,
  getClientSecondaryName,
  getClientStatusLabel,
  getClientTypeLabel,
  getDisplayValue,
} from '@/modules/clients/utils/clientPresentation';
import { brand, radius, spacing } from '@/theme/brand';

interface ClientCardProps {
  item: Client;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

export function ClientCard({ item, onEdit, onToggleStatus }: ClientCardProps) {
  const isInactive = item.isActive === false;

  return (
    <AppCard accent={isInactive ? brand.slate300 : brand.blue600} style={isInactive ? styles.inactive : undefined}>
      {/* Identité */}
      <View style={styles.header}>
        <View style={[styles.avatar, isInactive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{getClientInitials(item)}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {getClientDisplayName(item)}
          </Text>
          {getClientSecondaryName(item) ? (
            <Text style={styles.company} numberOfLines={1}>
              {getClientSecondaryName(item)}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Étiquettes */}
      <View style={styles.pills}>
        <StatusPill
          label={String(getClientStatusLabel(item.isActive))}
          color={isInactive ? brand.slate500 : brand.credit}
          backgroundColor={isInactive ? brand.slate100 : brand.creditBg}
        />
        <StatusPill
          label={String(getClientTypeLabel(item.type))}
          color={brand.blue700}
          backgroundColor={brand.blue50}
        />
      </View>

      <View style={styles.divider} />

      {/* Contact */}
      <View style={styles.contactRow}>
        <Ionicons name="call-outline" size={14} color={brand.blue500} />
        <Text style={styles.contactText} numberOfLines={1}>
          {getDisplayValue(item.phone, 'Téléphone non renseigné')}
        </Text>
      </View>
      {item.email ? (
        <View style={styles.contactRow}>
          <Ionicons name="mail-outline" size={14} color={brand.blue500} />
          <Text style={styles.contactText} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      ) : null}

      <Text style={styles.activity}>{getClientActivitySummary(item)}</Text>

      {onEdit || onToggleStatus ? (
        <View style={styles.actions}>
          {onToggleStatus ? (
            <AppButton
              block={false}
              variant={isInactive ? 'soft' : 'danger'}
              icon={isInactive ? 'play-outline' : 'pause-outline'}
              label={isInactive ? 'Activer' : 'Désactiver'}
              onPress={onToggleStatus}
            />
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
  inactive: {
    opacity: 0.78,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: brand.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInactive: {
    backgroundColor: brand.slate400,
  },
  avatarText: {
    color: brand.white,
    fontWeight: '800',
    fontSize: 14.5,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brand.navy900,
  },
  company: {
    marginTop: 2,
    fontSize: 12.5,
    color: brand.slate500,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: brand.slate100,
    marginTop: spacing.md,
    marginBottom: spacing.md - 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  contactText: {
    fontSize: 13,
    color: brand.slate600,
    flexShrink: 1,
  },
  activity: {
    marginTop: spacing.sm,
    fontSize: 12.5,
    color: brand.slate500,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
