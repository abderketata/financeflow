import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AlertItem } from '@/types';
import { alertService } from '@/modules/alerts/services/alert.service';
import { setAppBadgeCount } from '@/services/notifications/appBadge';

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

/**
 * Sans `pagination`, Strapi renvoie 25 alertes au maximum et les compteurs
 * « Toutes / Non lues / Lues » mentent dès que le seuil est franchi.
 */
const ALERTS_PAGE_SIZE = 100;

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

/** Nombre d'alertes non lues — source unique de la pastille et de l'onglet. */
export const countUnreadAlerts = (alerts: AlertItem[] = []) => alerts.filter((alert) => !alert.isRead).length;

/**
 * Tient à jour le nombre d'alertes non lues et le reporte sur l'icône de
 * l'application. Monté une fois pour toute la session (voir `AppNavigator`) :
 * la requête est partagée avec l'écran « Alertes » via le cache React Query,
 * donc aucun appel réseau supplémentaire n'est déclenché.
 *
 * Le retour au premier plan relance la requête : une alerte arrivée pendant
 * que l'application dormait doit se voir sur l'icône dès la réouverture.
 */
export const useUnreadAlertsBadge = () => {
  const { data: alerts = [], refetch } = useAlerts();
  const unreadCount = countUnreadAlerts(alerts);

  const unreadCountRef = useRef(unreadCount);
  unreadCountRef.current = unreadCount;

  useEffect(() => {
    void setAppBadgeCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Nouvel essai si la pastille n'avait pas pu être posée (permission
        // accordée entre-temps) ; sans effet si elle est déjà à jour.
        void setAppBadgeCount(unreadCountRef.current);
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
