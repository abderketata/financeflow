import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bank } from '@/types/domain';
import { bankService } from '@/modules/banks/services/bank.service';

const queryKey = ['banks'];

export const useBanks = () =>
  useQuery({
    queryKey,
    queryFn: () => bankService.list()
  });

export const useCreateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Bank>) => bankService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useUpdateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Bank> }) => bankService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useDeleteBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

