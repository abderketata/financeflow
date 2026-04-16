import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import { clientService, ClientMutationPayload } from '../services/client.service';
import { buildClientMutationPayload } from '../utils/clientPresentation';

const QUERY_KEY = ['clients'] as const;

export const useClients = (options?: { params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...QUERY_KEY, options?.params ?? null],
    queryFn: () => clientService.list(options?.params),
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Client> | ClientMutationPayload) => clientService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Client> | ClientMutationPayload }) =>
      clientService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useToggleClientStatus = () => {
  const updateMutation = useUpdateClient();
  return useMutation({
    mutationFn: (client: Client) =>
      clientService.update(client.id, buildClientMutationPayload({ ...client, isActive: client.isActive === false })),
    onSuccess: () => updateMutation.reset(),
  });
};
