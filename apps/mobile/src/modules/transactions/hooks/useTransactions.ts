import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/types';
import { transactionService } from '../services/transaction.service';

const QUERY_KEY = ['transactions'] as const;

export const useTransactions = () =>
  useQuery({ queryKey: QUERY_KEY, queryFn: () => transactionService.list({ populate: '*' }) });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Transaction>) => transactionService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Transaction> }) => transactionService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
