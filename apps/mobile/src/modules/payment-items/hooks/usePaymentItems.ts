import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types';
import { paymentItemService } from '../services/paymentItem.service';

const QUERY_KEY = ['payment-items'] as const;

export const usePaymentItems = (options?: { params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...QUERY_KEY, options?.params ?? null],
    queryFn: () => {
      const callerFilters = ((options?.params?.filters ?? {}) as Record<string, unknown>);
      let mergedFilters: Record<string, unknown>;

      if (!Object.keys(callerFilters).length) {
        mergedFilters = { supprimer: { $eq: false } };
      } else if (Array.isArray(callerFilters.$and)) {
        mergedFilters = { $and: [{ supprimer: { $eq: false } }, ...callerFilters.$and] };
      } else {
        mergedFilters = { supprimer: { $eq: false }, ...callerFilters };
      }

      return paymentItemService.list({ populate: '*', ...(options?.params ?? {}), filters: mergedFilters });
    },
  });

export const useCreatePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PaymentItem>) => paymentItemService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdatePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentItem> }) => paymentItemService.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: QUERY_KEY }),
        qc.invalidateQueries({ queryKey: ['mobile-alerts'] }),
        qc.invalidateQueries({ queryKey: ['mobile-dashboard-dataset'] }),
      ]);
    },
  });
};

/** Soft delete — identique au Web : positionne supprimer = true */
export const useSoftDeletePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentItemService.update(id, { supprimer: true } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
