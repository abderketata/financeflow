import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** État vide : médaillon d'icône, titre bleu, message — comme sur la maquette. */
export function EmptyState({ title, message, icon = 'folder-open-outline' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.medallionOuter}>
        <View style={styles.medallionInner}>
          <Ionicons name={icon} size={34} color={brand.blue600} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message || 'Aucune donnée disponible.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: 44,
  },
  medallionOuter: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: brand.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionInner: {
    width: 74,
    height: 74,
    borderRadius: radius.pill,
    backgroundColor: brand.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xl,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brand.blue700,
    textAlign: 'center',
  },
  message: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 19,
    color: brand.slate500,
    textAlign: 'center',
  },
});
