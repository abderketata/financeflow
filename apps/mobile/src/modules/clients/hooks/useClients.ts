import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import { clientService, ClientMutationPayload } from '../services/client.service';
import { buildClientMutationPayload } from '../utils/clientPresentation';

const QUERY_KEY = ['clients'] as const;

/**
 * Sans `pagination`, Strapi renvoie 25 clients au maximum : les compteurs
 * « Total / Actifs / Inactifs » et la recherche mentent au-delà de ce seuil.
 */
const CLIENTS_PAGE_SIZE = 100;

export const useClients = (options?: { params?: Record<string, unknown> }) =>
  useQuery({
    queryKey: [...QUERY_KEY, options?.params ?? null],
    queryFn: () =>
      clientService.list({
        pagination: { page: 1, pageSize: CLIENTS_PAGE_SIZE },
        sort: ['fullName:asc'],
        ...(options?.params ?? {}),
      }),
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

/**
 * Bascule actif / inactif. La charge utile passe par `buildClientMutationPayload`
 * comme sur le web : Strapi attend l'entité complète, pas le seul `isActive`.
 */
export const useToggleClientStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (client: Client) =>
      clientService.update(client.id, buildClientMutationPayload({ ...client, isActive: client.isActive === false })),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
