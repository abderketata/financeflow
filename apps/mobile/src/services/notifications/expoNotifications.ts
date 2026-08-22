import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * `expo-notifications` n'a pas d'implémentation web : chaque appel y lève
 * `UnavailabilityError` ("The method or property ... is not available on web").
 * Le build web consomme les mêmes écrans que le natif, on neutralise donc ces
 * appels au lieu de laisser les promesses être rejetées.
 */
export const areNotificationsSupported = Platform.OS !== 'web';

/** Configure default notification display behavior */
if (areNotificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Request permissions and create notification channel */
export async function initNotifications() {
  if (!areNotificationsSupported) {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    const result = await Notifications.requestPermissionsAsync();
    if (!result.granted) {
      console.warn('[FinanceFlow] Notification permissions denied');
      return null;
    }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('financeflow-alerts', {
      name: 'Flux Financier Alerts',
      description: 'Alertes d\'échéances et opérations financières',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4ED8',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('financeflow-reminders', {
      name: 'Rappels',
      description: 'Rappels programmés de paiements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  // Get push token for remote notifications
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Set your Expo project ID here
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

/** Schedule a local notification */
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  channelId = 'financeflow-alerts'
) {
  if (!areNotificationsSupported) {
    return null;
  }

  const secondsUntilTrigger = Math.max(
    1,
    Math.floor((triggerDate.getTime() - Date.now()) / 1000)
  );

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId } : {}),
      data: { type: 'financeflow-alert' },
    },
    trigger: { seconds: secondsUntilTrigger },
  });
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications() {
  if (!areNotificationsSupported) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}
