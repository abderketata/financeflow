import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { brand } from '@/theme/brand';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Fond lavande clair : les cartes blanches s'en détachent nettement.
    backgroundColor: brand.canvas,
  },
});
