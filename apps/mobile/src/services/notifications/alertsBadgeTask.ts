import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { alertService } from '@/modules/alerts/services/alert.service';
import { getStoredToken } from '@/services/api/authStorage';
import { clearAppBadgeCount, setAppBadgeCount } from '@/services/notifications/appBadge';
import { areNotificationsSupported } from '@/services/notifications/expoNotifications';

/**
 * Rafraîchit la pastille de l'icône application fermée.
 *
 * Android ne sait pas réveiller une application à heure fixe sans serveur de
 * push : `expo-background-fetch` pose une alarme inexacte répétée (15 min
 * minimum), que le système regroupe ou retarde en veille (Doze). La tâche
 * recharge donc le nombre d'alertes non lues à chaque réveil ; le premier
 * réveil après 8h republie en plus la pastille (voir `MORNING_REFRESH_HOUR`).
 * En veille profonde, ce réveil peut arriver avec quelques dizaines de minutes
 * de retard.
 *
 * `defineTask` doit être appelé au chargement du module, dans la portée
 * globale : quand l'alarme démarre l'application en mode « headless », seul le
 * bundle est évalué, aucun écran n'est monté. D'où l'import dans `App.tsx`.
 */

export const ALERTS_BADGE_TASK = 'financeflow-alerts-badge-refresh';

const REFRESH_INTERVAL_SECONDS = 15 * 60;

const isUnauthorizedError = (error: any) => {
  const status = error?.error?.status ?? error?.status ?? error?.response?.status;
  return status === 401;
};

if (areNotificationsSupported) {
  TaskManager.defineTask(ALERTS_BADGE_TASK, async () => {
    try {
      // Pas de session : rien à compter, l'icône ne doit rien annoncer.
      if (!(await getStoredToken())) {
        await clearAppBadgeCount();
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const unreadCount = await alertService.countUnreadInList();
      await setAppBadgeCount(unreadCount);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      // Jeton expiré : l'intercepteur a déjà effacé la session.
      if (isUnauthorizedError(error)) {
        await clearAppBadgeCount();
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      console.warn('[FinanceFlow] Rafraîchissement des alertes en arrière-plan impossible', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/** À appeler une fois connecté. Sans effet si la tâche est déjà enregistrée. */
export async function registerAlertsBadgeTask() {
  if (!areNotificationsSupported) {
    return false;
  }

  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('[FinanceFlow] Exécution en arrière-plan indisponible', status);
      return false;
    }

    if (await TaskManager.isTaskRegisteredAsync(ALERTS_BADGE_TASK)) {
      return true;
    }

    await BackgroundFetch.registerTaskAsync(ALERTS_BADGE_TASK, {
      minimumInterval: REFRESH_INTERVAL_SECONDS,
      // Continue après fermeture de l'application et redémarrage du téléphone.
      stopOnTerminate: false,
      startOnBoot: true,
    });
    return true;
  } catch (error) {
    console.warn("[FinanceFlow] Enregistrement de la tâche d'arrière-plan impossible", error);
    return false;
  }
}

/** À la déconnexion : plus aucune alerte ne concerne l'appareil. */
export async function unregisterAlertsBadgeTask() {
  if (!areNotificationsSupported) {
    return;
  }

  try {
    if (await TaskManager.isTaskRegisteredAsync(ALERTS_BADGE_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(ALERTS_BADGE_TASK);
    }
  } catch (error) {
    console.warn("[FinanceFlow] Désenregistrement de la tâche d'arrière-plan impossible", error);
  }
}
