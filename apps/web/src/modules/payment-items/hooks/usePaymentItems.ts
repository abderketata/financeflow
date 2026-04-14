import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types/domain';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';

const queryKey = ['payment-items'];

export const usePaymentItems = (options?: { enabled?: boolean; params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...queryKey, options?.params ?? {}],
    enabled: options?.enabled,
    // Always filter out soft-deleted items; merge with any additional caller params
    queryFn: () => {
      const callerFilters = (options?.params?.filters ?? {}) as Record<string, unknown>;
      let mergedFilters: Record<string, unknown>;

      if (!Object.keys(callerFilters).length) {
        // No caller filters — simple supprimer guard
        mergedFilters = { supprimer: { $eq: false } };
      } else if (Array.isArray(callerFilters.$and)) {
        // Caller already uses $and — inject supprimer into the same array (flatten)
        mergedFilters = { $and: [{ supprimer: { $eq: false } }, ...callerFilters.$and] };
      } else {
        // Caller uses $or or plain field filters — merge at top level (implicit AND)
        mergedFilters = { supprimer: { $eq: false }, ...callerFilters };
      }

      return paymentItemService.list({
        populate: '*',
        ...(options?.params ?? {}),
        filters: mergedFilters,
      });
    }
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

