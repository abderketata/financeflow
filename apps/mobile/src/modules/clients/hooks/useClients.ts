import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import { clientService } from '@/modules/clients/services/client.service';

const queryKey = ['mobile-clients'];

export const useClients = () => useQuery({ queryKey, queryFn: () => clientService.list() });

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: Partial<Client>) => clientService.create(payload), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<Client> }) => clientService.update(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
};

