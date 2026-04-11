import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/types/domain';
import { transactionService } from '@/modules/transactions/services/transaction.service';

const queryKey = ['transactions'];

export const useTransactions = () =>
  useQuery({
    queryKey,
    queryFn: () => transactionService.list({ populate: '*' })
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Transaction>) => transactionService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Transaction> }) => transactionService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

