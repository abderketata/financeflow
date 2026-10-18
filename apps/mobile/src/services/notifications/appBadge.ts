import * as Notifications from 'expo-notifications';
import { areNotificationsSupported } from '@/services/notifications/expoNotifications';

/**
 * Pastille de l'icône de l'application (nombre d'alertes non lues).
 *
 * Portée réelle :
 *   - iOS : la pastille rouge sur l'icône, toujours honorée.
 *   - Android : le nombre n'est affiché que par les lanceurs qui le gèrent
 *     (Samsung One UI, MIUI, Nova…). Le lanceur Pixel, lui, n'affiche qu'un
 *     point. L'appel reste sans effet visible plutôt qu'en erreur.
 *   - Web : `expo-notifications` n'a pas d'implémentation, l'appel est neutralisé.
 */
export async function setAppBadgeCount(count: number) {
  if (!areNotificationsSupported) {
    return false;
  }

  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;

  try {
    return await Notifications.setBadgeCountAsync(safeCount);
  } catch (error) {
    console.warn('[FinanceFlow] Mise à jour de la pastille impossible', error);
    return false;
  }
}

/** Remise à zéro — à la déconnexion, plus aucune alerte ne concerne l'appareil. */
export const clearAppBadgeCount = () => setAppBadgeCount(0);
