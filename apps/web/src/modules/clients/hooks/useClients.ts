import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientService, ClientMutationPayload } from '@/modules/clients/services/client.service';
import { normalizeClientEntity } from '@/modules/clients/utils/clientPresentation';

const queryKey = ['clients'];

export const useClients = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey,
    enabled: options?.enabled,
    queryFn: async () => {
      const clients = await clientService.list({ populate: '*' });
      return clients.map(normalizeClientEntity);
    }
  });

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<import('@/types/domain').Client> | ClientMutationPayload) => clientService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<import('@/types/domain').Client> | ClientMutationPayload }) => clientService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

