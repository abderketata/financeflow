import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types/domain';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';

const queryKey = ['payment-items'];

export const usePaymentItems = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey,
    enabled: options?.enabled,
    // Only fetch non-deleted items (soft delete: supprimer = false)
    queryFn: () => paymentItemService.list({
      populate: '*',
      filters: { supprimer: { $eq: false } },
    })
  });

export const useCreatePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PaymentItem>) => paymentItemService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useUpdatePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentItem> }) => paymentItemService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

/** Soft delete: sets supprimer = true instead of physically removing the record. */
export const useSoftDeletePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentItemService.update(id, { supprimer: true } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

/** Physical delete — kept for internal use only, not exposed to the UI. */
export const useDeletePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentItemService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

