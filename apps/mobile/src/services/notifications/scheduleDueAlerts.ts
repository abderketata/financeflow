import * as Notifications from 'expo-notifications';
import { PaymentItem } from '@/types';

export async function scheduleDueAlerts(items: PaymentItem[], alertDaysBefore: number) {
  const now = Date.now();
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));

  for (const item of items) {
    if (!item.dueDate) continue;
    const dueDate = new Date(item.dueDate).getTime();
    const triggerDate = dueDate - alertDaysBefore * 24 * 60 * 60 * 1000;

    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Échéance proche',
          body: `${item.reference} arrive bientôt à échéance`
        },
        trigger: {
          channelId: 'financeflow-alerts',
          date: new Date(triggerDate)
        } as any
      });
    }
  }
}

