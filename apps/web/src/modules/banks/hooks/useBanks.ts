import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bank } from '@/types/domain';
import { bankService } from '@/modules/banks/services/bank.service';

export const banksQueryKey = ['banks'] as const;

export const banksQueryOptions = queryOptions({
  queryKey: banksQueryKey,
  queryFn: () => bankService.list(),
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

export const useBanks = () =>
  useQuery(banksQueryOptions);

export const useCreateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Bank>) => bankService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: banksQueryKey })
  });
};

export const useUpdateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Bank> }) => bankService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: banksQueryKey })
  });
};

export const useDeleteBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: banksQueryKey })
  });
};

