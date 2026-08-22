import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** Flex / marge propres à l'écran hôte ; l'apparence de la coque reste commune. */
  style?: ViewStyle;
  returnKeyType?: 'search' | 'default';
}

/**
 * Champ de recherche des écrans de liste.
 *
 * Deux raisons d'être commun plutôt que dupliqué dans chaque écran :
 *
 *   - Les garde-fous d'autoremplissage. En build web, le gestionnaire de mots de
 *     passe du navigateur (ou une extension) écrit l'identifiant de connexion
 *     dans le premier champ texte de la page. L'événement est réel, donc l'état
 *     React suit et la liste se retrouve filtrée sur un texte que personne n'a
 *     saisi — la liste paraît vide alors que les données sont bien chargées.
 *   - Le bouton d'effacement. `clearButtonMode` de `TextInput` est ignoré hors
 *     iOS : sans ce bouton, un contenu inattendu n'était ni visible comme tel ni
 *     effaçable au doigt sur web et Android.
 */
export function SearchField({ value, onChangeText, placeholder, style, returnKeyType }: SearchFieldProps) {
  return (
    <View style={[styles.shell, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={brand.slate400}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        importantForAutofill="no"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          style={styles.clearButton}
        >
          <Ionicons name="close" size={13} color={brand.slate600} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Valeurs reprises à l'identique des trois champs qu'il remplace.
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: brand.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: brand.slate200,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: brand.navy900,
    padding: 0,
    // Retire le contour bleu ajouté par le navigateur en build web.
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
});
