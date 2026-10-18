import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { areNotificationsSupported } from '@/services/notifications/expoNotifications';

/**
 * Pastille de l'icône de l'application (nombre d'alertes non lues).
 *
 * - iOS : `setBadgeCountAsync` pose directement le nombre sur l'icône.
 * - Android : il n'existe pas d'API « nombre sur l'icône ». Depuis Android 8,
 *   le lanceur construit la pastille à partir des notifications affichées par
 *   l'application et de leur champ `number`. `setBadgeCountAsync` (ShortcutBadger)
 *   n'est plus honoré par les lanceurs actuels (One UI, MIUI récents, Pixel…).
 *   On publie donc une notification discrète « N alertes non lues » dont le
 *   `number` vaut N : Samsung, Xiaomi, Oppo, Huawei… affichent alors N sur
 *   l'icône. Le lanceur Pixel (Android stock) n'affiche jamais qu'un point.
 * - Web : `expo-notifications` n'a pas d'implémentation, l'appel est neutralisé.
 */

const UNREAD_SUMMARY_ID = 'financeflow-unread-alerts';
const UNREAD_SUMMARY_TYPE = 'unread-alerts-summary';
const BADGE_CHANNEL_ID = 'financeflow-unread';
const BADGE_STATE_KEY = 'financeflow_badge_state';

/**
 * Heure du rappel quotidien : à partir de 8h, la première mise à jour de la
 * journée republie la pastille même si le nombre n'a pas changé — elle
 * réapparaît donc chaque matin, y compris si la notification a été balayée.
 */
export const MORNING_REFRESH_HOUR = 8;

let channelReady: Promise<unknown> | null = null;

/**
 * Dernier nombre publié et jour du dernier rappel de 8h. Conservé sur
 * l'appareil et non en mémoire : la tâche d'arrière-plan s'exécute souvent
 * dans un nouveau contexte JS, qui sans cela republierait toutes les
 * 15 minutes une notification que l'utilisateur vient de balayer.
 */
type BadgeState = { count: number | null; morningDay: string | null };

let badgeState: BadgeState | null = null;

const loadBadgeState = async (): Promise<BadgeState> => {
  if (badgeState) {
    return badgeState;
  }

  try {
    const raw = await SecureStore.getItemAsync(BADGE_STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<BadgeState>) : {};
    badgeState = { count: parsed.count ?? null, morningDay: parsed.morningDay ?? null };
  } catch {
    badgeState = { count: null, morningDay: null };
  }

  return badgeState;
};

const saveBadgeState = async (next: BadgeState) => {
  badgeState = next;
  await SecureStore.setItemAsync(BADGE_STATE_KEY, JSON.stringify(next)).catch(() => undefined);
};

/** Jour local au format AAAA-MM-JJ. */
const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Canal silencieux (sans son ni bandeau) mais autorisé à marquer l'icône. */
const ensureBadgeChannel = () => {
  if (channelReady) {
    return channelReady;
  }

  channelReady = Notifications.setNotificationChannelAsync(BADGE_CHANNEL_ID, {
    name: 'Alertes non lues',
    description: "Nombre d'alertes non lues, affiché sur l'icône de l'application",
    importance: Notifications.AndroidImportance.LOW,
    showBadge: true,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
  }).catch((error) => {
    channelReady = null;
    throw error;
  });

  return channelReady;
};

export const isUnreadSummaryNotification = (notification?: Notifications.Notification | null) =>
  notification?.request.content.data?.type === UNREAD_SUMMARY_TYPE;

const publishAndroidSummary = async (count: number) => {
  if (count === 0) {
    await Notifications.dismissNotificationAsync(UNREAD_SUMMARY_ID);
    return true;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  await ensureBadgeChannel();
  // Même identifiant : la notification existante est remplacée, pas dupliquée.
  await Notifications.scheduleNotificationAsync({
    identifier: UNREAD_SUMMARY_ID,
    content: {
      title: count > 1 ? `${count} alertes non lues` : '1 alerte non lue',
      body: 'Touchez pour consulter vos alertes.',
      badge: count,
      sound: false,
      autoDismiss: false,
      data: { type: UNREAD_SUMMARY_TYPE },
    },
    trigger: { channelId: BADGE_CHANNEL_ID },
  });

  return true;
};

export async function setAppBadgeCount(count: number) {
  if (!areNotificationsSupported) {
    return false;
  }

  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const now = new Date();
  const today = toDayKey(now);
  const state = await loadBadgeState();
  const morningRefreshDue = now.getHours() >= MORNING_REFRESH_HOUR && state.morningDay !== today;

  // Republier la même valeur referait apparaître la notification déjà balayée
  // — ce qu'on ne veut qu'une fois par jour, au rappel de 8h.
  if (safeCount === state.count && !morningRefreshDue) {
    return true;
  }

  try {
    const applied =
      Platform.OS === 'android'
        ? await publishAndroidSummary(safeCount)
        : await Notifications.setBadgeCountAsync(safeCount);

    if (applied) {
      await saveBadgeState({
        count: safeCount,
        morningDay: morningRefreshDue ? today : state.morningDay,
      });
    }

    return applied;
  } catch (error) {
    console.warn('[FinanceFlow] Mise à jour de la pastille impossible', error);
    return false;
  }
}

/** Remise à zéro — à la déconnexion, plus aucune alerte ne concerne l'appareil. */
export const clearAppBadgeCount = () => setAppBadgeCount(0);

/**
 * Appelle `onOpen` quand l'utilisateur touche la notification « alertes non
 * lues », y compris si elle a lancé l'application (démarrage à froid).
 */
export function useOpenFromUnreadSummary(onOpen: () => void) {
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    if (!areNotificationsSupported) {
      return undefined;
    }

    let handledColdStart = false;

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!handledColdStart && isUnreadSummaryNotification(response?.notification)) {
          handledColdStart = true;
          onOpenRef.current();
        }
      })
      .catch(() => undefined);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isUnreadSummaryNotification(response.notification)) {
        handledColdStart = true;
        onOpenRef.current();
      }
    });

    return () => subscription.remove();
  }, []);
}
