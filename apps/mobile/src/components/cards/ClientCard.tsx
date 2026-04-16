import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Client } from '@/types';
import {
  getClientDisplayName,
  getClientInitials,
  getClientSecondaryName,
  getClientTypeLabel,
  getClientStatusLabel,
  getClientActivitySummary,
  getDisplayValue,
} from '@/modules/clients/utils/clientPresentation';

interface ClientCardProps {
  item: Client;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

export function ClientCard({ item, onEdit, onToggleStatus }: ClientCardProps) {
  const isInactive = item.isActive === false;
  const initials = getClientInitials(item);
  const primaryName = getClientDisplayName(item);
  const secondaryName = getClientSecondaryName(item);

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Avatar + identité */}
      <View style={styles.row}>
        <View style={[styles.avatar, isInactive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{primaryName}</Text>
          {secondaryName ? (
            <Text style={styles.company} numberOfLines={1}>{secondaryName}</Text>
          ) : null}
        </View>
        {/* Badges */}
        <View style={styles.badges}>
          <View style={[styles.badge, isInactive ? styles.badgeInactive : styles.badgeActive]}>
            <Text style={[styles.badgeText, isInactive ? styles.badgeTextInactive : styles.badgeTextActive]}>
              {getClientStatusLabel(item.isActive)}
            </Text>
          </View>
          <View style={styles.badgeType}>
            <Text style={styles.badgeTypeText}>{getClientTypeLabel(item.type)}</Text>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.contact}>
        <Text style={styles.meta}>📞 {getDisplayValue(item.phone, 'Téléphone non renseigné')}</Text>
        {item.email ? <Text style={styles.meta} numberOfLines={1}>✉️ {item.email}</Text> : null}
      </View>

      {/* Activité */}
      <Text style={styles.activity}>{getClientActivitySummary(item)}</Text>

      {/* Actions */}
      {(onEdit || onToggleStatus) && (
        <View style={styles.actions}>
          {onToggleStatus && (
            <Pressable style={[styles.actionBtn, isInactive ? styles.activateBtn : styles.deactivateBtn]} onPress={onToggleStatus}>
              <Text style={[styles.actionBtnText, isInactive ? styles.activateBtnText : styles.deactivateBtnText]}>
                {isInactive ? 'Activer' : 'Désactiver'}
              </Text>
            </Pressable>
          )}
          {onEdit && (
            <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={onEdit}>
              <Text style={styles.editBtnText}>Modifier</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.72,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  avatarInactive: {
    backgroundColor: '#94a3b8',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  identity: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  company: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#16a34a',
  },
  badgeTextInactive: {
    color: '#64748b',
  },
  badgeType: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
  contact: {
    gap: 2,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  activity: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  deactivateBtn: {
    backgroundColor: '#fef2f2',
  },
  activateBtn: {
    backgroundColor: '#f0fdf4',
  },
  editBtn: {
    backgroundColor: '#fefce8',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deactivateBtnText: {
    color: '#dc2626',
  },
  activateBtnText: {
    color: '#16a34a',
  },
  editBtnText: {
    color: '#ca8a04',
    fontSize: 13,
    fontWeight: '700',
  },
});
