import { Alert, Platform } from 'react-native';
import { DialogHighlight, DialogTone, isDialogHostMounted, showDialog } from '@/components/ui/DialogHost';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Par défaut : `danger` si `destructive`, sinon `info`. */
  tone?: DialogTone;
  /** Valeur mise en avant dans la boîte (montant…). */
  highlight?: DialogHighlight;
}

/**
 * Confirmation multiplateforme, affichée par `DialogHost` (boîte à la charte
 * de l'application, identique sur Android et en build web).
 *
 * Repli si l'hôte n'est pas monté : `Alert.alert` n'existe pas en build web —
 * react-native-web la livre en coquille vide (`class Alert { static alert() {} }`),
 * la boîte n'apparaîtrait jamais et le callback ne serait jamais appelé ; on
 * passe donc par `window.confirm`.
 *
 * Renvoie `true` si l'utilisateur confirme, `false` sinon.
 */
export const confirmAction = ({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  tone,
  highlight,
}: ConfirmOptions): Promise<boolean> => {
  if (isDialogHostMounted()) {
    return showDialog({
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone: tone ?? (destructive ? 'danger' : 'info'),
      highlight,
    });
  }

  const fallbackMessage = [message, highlight?.value, ...(highlight?.lines ?? [])].filter(Boolean).join('\n\n');

  if (Platform.OS === 'web') {
    const globalConfirm = (globalThis as { confirm?: (text: string) => boolean }).confirm;
    // Sans `confirm` disponible, mieux vaut laisser passer l'action que bloquer
    // définitivement l'utilisateur sur un bouton sans effet.
    return Promise.resolve(globalConfirm ? globalConfirm([title, fallbackMessage].filter(Boolean).join('\n\n')) : true);
  }

  return new Promise((resolve) => {
    Alert.alert(title, fallbackMessage, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
};

/** Ton déduit du titre pour les appels existants (« Erreur », « Succès »…). */
const inferTone = (title: string): DialogTone => {
  if (/erreur|impossible|échec/i.test(title)) return 'danger';
  if (/succès|✓/i.test(title)) return 'success';
  return 'info';
};

/** Message simple, équivalent multiplateforme de `Alert.alert(title, message)`. */
export const notify = (title: string, message?: string, tone?: DialogTone) => {
  if (isDialogHostMounted()) {
    void showDialog({ title, message, tone: tone ?? inferTone(title), cancelLabel: null, confirmLabel: 'OK' });
    return;
  }

  if (Platform.OS === 'web') {
    const globalAlert = (globalThis as { alert?: (text: string) => void }).alert;
    globalAlert?.([title, message].filter(Boolean).join('\n\n'));
    return;
  }

  Alert.alert(title, message);
};
