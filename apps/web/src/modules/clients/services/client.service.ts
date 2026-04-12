import { createCrudService } from '@/services/api/crud';
import { Client } from '@/types/domain';

export type ClientMutationPayload = Omit<Partial<Client>, 'accounts'> & {
  accounts?: number[];
};

export const clientService = createCrudService<Client, Partial<Client> | ClientMutationPayload>('/clients');

