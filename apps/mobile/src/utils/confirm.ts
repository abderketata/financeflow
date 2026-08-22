import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Confirmation multiplateforme.
 *
 * `Alert.alert` n'existe pas en build web : react-native-web la livre en coquille
 * vide (`class Alert { static alert() {} }`). La boîte n'apparaît donc jamais et,
 * plus grave, le callback de confirmation n'est jamais appelé — l'action est
 * silencieusement annulée et le bouton paraît mort.
 *
 * Renvoie `true` si l'utilisateur confirme, `false` sinon.
 */
export const confirmAction = ({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
}: ConfirmOptions): Promise<boolean> => {
  if (Platform.OS === 'web') {
    const globalConfirm = (globalThis as { confirm?: (text: string) => boolean }).confirm;
    // Sans `confirm` disponible, mieux vaut laisser passer l'action que bloquer
    // définitivement l'utilisateur sur un bouton sans effet.
    return Promise.resolve(globalConfirm ? globalConfirm([title, message].filter(Boolean).join('\n\n')) : true);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
};

/** Message simple, équivalent multiplateforme de `Alert.alert(title, message)`. */
export const notify = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    const globalAlert = (globalThis as { alert?: (text: string) => void }).alert;
    globalAlert?.([title, message].filter(Boolean).join('\n\n'));
    return;
  }

  Alert.alert(title, message);
};
