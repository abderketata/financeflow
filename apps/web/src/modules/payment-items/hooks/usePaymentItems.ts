import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PaginatedResult } from '@/types/api';
import { PaymentItem } from '@/types/domain';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';

const queryKey = ['payment-items'];

export interface PaymentItemTotals {
  totalCredits: number;
  totalDebits: number;
  balance: number;
}

const mergePaymentItemFilters = (callerFilters: Record<string, unknown>) => {
  if (!Object.keys(callerFilters).length) {
    return { supprimer: { $eq: false } };
  }

  if (Array.isArray(callerFilters.$and)) {
    return { $and: [{ supprimer: { $eq: false } }, ...callerFilters.$and] };
  }

  return { supprimer: { $eq: false }, ...callerFilters };
};

const buildPaymentItemTotals = (items: PaymentItem[]): PaymentItemTotals => {
  const totalCredits = items.reduce(
    (sum, item) => sum + (item.direction === 'IN' ? Number(item.amount ?? 0) || 0 : 0),
    0,
  );
  const totalDebits = items.reduce(
    (sum, item) => sum + (item.direction === 'OUT' ? Number(item.amount ?? 0) || 0 : 0),
    0,
  );

  return {
    totalCredits,
    totalDebits,
    balance: totalCredits - totalDebits,
  };
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
        sort: ['id:desc'],
      }, { signal });
    }
  });

export const usePaymentItemsTotals = (options?: { enabled?: boolean; params?: Record<string, unknown> }) =>
  useQuery<PaymentItemTotals>({
    queryKey: [...queryKey, 'totals', options?.params ?? {}],
    enabled: options?.enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const callerFilters = (options?.params?.filters ?? {}) as Record<string, unknown>;
      const mergedFilters = mergePaymentItemFilters(callerFilters);
      const items = await paymentItemService.listAllActive({
        fields: ['amount', 'direction'],
        ...(options?.params ?? {}),
        filters: mergedFilters,
        sort: ['id:desc'],
      }, { signal });

      return buildPaymentItemTotals(items);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-dataset'] }),
      ]);
    }
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

