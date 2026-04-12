import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { Client } from '@/types/domain';
import { unwrapCollection } from '@/utils/strapi';

export type ClientMutationPayload = Omit<Partial<Client>, 'accounts'> & {
  accounts?: number[];
};

export const clientService = {
  ...createCrudService<Client, Partial<Client> | ClientMutationPayload>('/clients'),

  async lookup(search = '', pageSize = 50): Promise<Client[]> {
    const trimmedSearch = search.trim();
    const params: Record<string, unknown> = {
      fields: ['code', 'fullName', 'companyName'],
      pagination: { page: 1, pageSize },
      sort: ['updatedAt:desc'],
    };

    if (trimmedSearch) {
      params.filters = {
        $or: [
          { fullName: { $containsi: trimmedSearch } },
          { companyName: { $containsi: trimmedSearch } },
          { code: { $containsi: trimmedSearch } },
        ],
      };
    }

    const { data } = await api.get('/clients', { params });
    return unwrapCollection<Client>(data);
  },
};

