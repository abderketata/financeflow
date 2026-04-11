import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';

const queryKey = ['mobile-payment-items'];

export const usePaymentItems = () => useQuery({ queryKey, queryFn: () => paymentItemService.list({ populate: '*' }) });

export const useCreatePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: Partial<PaymentItem>) => paymentItemService.create(payload), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
};

export const useUpdatePaymentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentItem> }) => paymentItemService.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
};

