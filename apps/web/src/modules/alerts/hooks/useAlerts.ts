import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/types/domain';
import { alertService } from '@/modules/alerts/services/alert.service';

const queryKey = ['alerts'];

// `populate: '*'` ne remonte que le premier niveau : sans populate imbriqué, le client
// et le compte des effets liés à l'alerte restent absents (montant/devise/client non affichables).
const alertPopulate = {
  paymentItem: { populate: '*' },
  paymentItems: { populate: '*' },
} as const;

// Sans `pagination`, Strapi renvoie 25 alertes au maximum : la pastille et les compteurs
// « Toutes / Non lues / Lues » plafonnent alors à 25. Même règle que l'app mobile.
const ALERTS_PAGE_SIZE = 100;

export const useAlerts = () =>
  useQuery({
    queryKey,
    queryFn: () =>
      alertService.list({
        populate: alertPopulate,
        pagination: { page: 1, pageSize: ALERTS_PAGE_SIZE },
        sort: ['id:desc']
      })
  });

export const useAlertPaymentItems = (alertId?: number, enabled = true) =>
  useQuery({
    queryKey: [...queryKey, 'payment-items', alertId],
    enabled: enabled && Boolean(alertId),
    staleTime: 30_000,
    queryFn: () => alertService.getPaymentItems(alertId!)
  });

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Alert> }) => alertService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

