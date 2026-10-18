import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AlertItem } from '@/types';
import { ALERTS_PAGE_SIZE, alertService, countUnreadAlerts } from '@/modules/alerts/services/alert.service';
import { setAppBadgeCount } from '@/services/notifications/appBadge';
import { registerAlertsBadgeTask } from '@/services/notifications/alertsBadgeTask';
import { ensureNotificationPermission, hasNotificationPermission } from '@/services/notifications/expoNotifications';

const queryKey = ['mobile-alerts'];

/**
 * `populate: '*'` ne remonte que le premier niveau : les effets liés à l'alerte
 * arrivent alors sans leur client ni leur compte, et la ligne « Associé à » se
 * réduit à la référence, sans le nom du client. Il faut donc un populate
 * imbriqué — même règle que `apps/web/src/modules/alerts/hooks/useAlerts.ts`.
 */
const alertPopulate = {
  paymentItem: { populate: '*' },
  paymentItems: { populate: '*' },
} as const;

export const useAlerts = () =>
  useQuery({
    queryKey,
    queryFn: () =>
      alertService.list({
        populate: alertPopulate,
        pagination: { page: 1, pageSize: ALERTS_PAGE_SIZE },
        sort: ['id:desc'],
      }),
  });

export { countUnreadAlerts };

/**
 * Tient à jour le nombre d'alertes non lues et le reporte sur l'icône de
 * l'application. Monté une fois pour toute la session (voir `AppNavigator`) :
 * la requête est partagée avec l'écran « Alertes » via le cache React Query,
 * donc aucun appel réseau supplémentaire n'est déclenché.
 *
 * Le retour au premier plan relance la requête : une alerte arrivée pendant
 * que l'application dormait doit se voir sur l'icône dès la réouverture.
 * Application fermée, c'est la tâche d'arrière-plan enregistrée ici
 * (`alertsBadgeTask`) qui prend le relais.
 */
export const useUnreadAlertsBadge = () => {
  const { data: alerts, refetch } = useAlerts();
  const unreadCount = countUnreadAlerts(alerts);
  // Sans autorisation, Android refuse la notification qui porte la pastille.
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  const unreadCountRef = useRef<number | null>(null);
  unreadCountRef.current = alerts ? unreadCount : null;

  useEffect(() => {
    // Au premier lancement, les alertes arrivent souvent avant la réponse à la
    // boîte « Autoriser les notifications » : la pastille est donc (re)posée
    // dès que l'autorisation tombe, pas seulement quand le nombre change.
    void ensureNotificationPermission().then(setNotificationsAllowed);
    void registerAlertsBadgeTask();
  }, []);

  useEffect(() => {
    // Tant que la liste n'est pas chargée, `0` effacerait une pastille juste.
    if (alerts && notificationsAllowed) {
      void setAppBadgeCount(unreadCount);
    }
  }, [alerts, notificationsAllowed, unreadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Nouvel essai si la pastille n'avait pas pu être posée (permission
        // accordée depuis les réglages) ; sans effet si elle est déjà à jour.
        // Simple lecture : redemander ici reposerait la question à chaque
        // retour dans l'application après un refus.
        void hasNotificationPermission().then((allowed) => {
          setNotificationsAllowed(allowed);
          if (allowed && unreadCountRef.current !== null) {
            void setAppBadgeCount(unreadCountRef.current);
          }
        });
        void refetch();
      }
    });

    return () => subscription.remove();
  }, [refetch]);

  return unreadCount;
};

export const useAlertPaymentItems = (alertId?: number, enabled = true) =>
  useQuery({
    queryKey: [...queryKey, 'payment-items', alertId],
    enabled: enabled && Boolean(alertId),
    staleTime: 30_000,
    queryFn: () => alertService.getPaymentItems(alertId!),
  });

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AlertItem> }) => alertService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};

/**
 * « Tout marquer comme lu ».
 *
 * Les mises à jour partent en parallèle mais le cache n'est invalidé qu'une
 * fois, à la fin : déclencher une mutation par alerte comme le fait le web
 * provoque autant de rechargements de la liste que d'alertes non lues.
 */
export const useMarkAllAlertsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alerts: AlertItem[]) => {
      const unread = alerts.filter((alert) => !alert.isRead);
      await Promise.all(unread.map((alert) => alertService.update(alert.id, { isRead: true })));
      return unread.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};
