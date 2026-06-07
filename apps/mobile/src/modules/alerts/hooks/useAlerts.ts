import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertItem } from '@/types';
import { alertService } from '@/modules/alerts/services/alert.service';

const queryKey = ['mobile-alerts'];

export const useAlerts = () => useQuery({ queryKey, queryFn: () => alertService.list({ populate: '*' }) });

export const useAlertPaymentItems = (alertId?: number, enabled = true) =>
  useQuery({
    queryKey: [...queryKey, 'payment-items', alertId],
    enabled: enabled && Boolean(alertId),
    staleTime: 30_000,
    queryFn: () => alertService.getPaymentItems(alertId!),
  });

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<AlertItem> }) => alertService.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
};

