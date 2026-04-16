import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types';
import { paymentItemService } from '../services/paymentItem.service';

const QUERY_KEY = ['payment-items'] as const;

export const usePaymentItems = (options?: { params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...QUERY_KEY, options?.params ?? null],
    queryFn: () => {
      const callerFilters = ((options?.params?.filters ?? {}) as Record<string, unknown>);
      const mergedFilters = Object.keys(callerFilters).length
        ? { supprimer: { $eq: false }, ...callerFilters }
        : { supprimer: { $eq: false } };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
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
