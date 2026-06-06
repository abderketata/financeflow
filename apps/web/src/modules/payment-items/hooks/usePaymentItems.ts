import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PaginatedResult } from '@/types/api';
import { PaymentItem } from '@/types/domain';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';

const queryKey = ['payment-items'];

const mergePaymentItemFilters = (callerFilters: Record<string, unknown>) => {
  if (!Object.keys(callerFilters).length) {
    return { supprimer: { $eq: false } };
  }

  if (Array.isArray(callerFilters.$and)) {
    return { $and: [{ supprimer: { $eq: false } }, ...callerFilters.$and] };
  }

  return { supprimer: { $eq: false }, ...callerFilters };
};

export const usePaymentItems = (options?: { enabled?: boolean; params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...queryKey, options?.params ?? {}],
    enabled: options?.enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    // Always filter out soft-deleted items; merge with any additional caller params
    queryFn: ({ signal }) => {
      const callerFilters = (options?.params?.filters ?? {}) as Record<string, unknown>;
      const mergedFilters = mergePaymentItemFilters(callerFilters);

      return paymentItemService.list({
        populate: '*',
        ...(options?.params ?? {}),
        filters: mergedFilters,
      }, { signal });
    }
  });

export const usePaymentItemsPage = (options?: { enabled?: boolean; params?: Record<string, unknown> }) =>
  useQuery<PaginatedResult<PaymentItem>>({
    queryKey: [...queryKey, 'page', options?.params ?? {}],
    enabled: options?.enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => {
      const callerFilters = (options?.params?.filters ?? {}) as Record<string, unknown>;
      const mergedFilters = mergePaymentItemFilters(callerFilters);

      return paymentItemService.listPage({
        populate: '*',
        ...(options?.params ?? {}),
        filters: mergedFilters,
      }, { signal });
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

