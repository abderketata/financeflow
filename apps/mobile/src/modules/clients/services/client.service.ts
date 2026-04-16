import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { Client } from '@/types';
import { unwrapCollection } from '@/utils/strapi';
import { normalizeClientEntity } from '../utils/clientPresentation';

export type ClientMutationPayload = Omit<Partial<Client>, 'accounts'> & {
  accounts?: number[];
};

const base = createCrudService<Client, Partial<Client> | ClientMutationPayload>('/clients');

export const clientService = {
  ...base,

  /** Liste complète avec relations (accounts, paymentItems, transactions) */
  async list(params?: Record<string, unknown>): Promise<Client[]> {
    const { data } = await api.get('/clients', {
      params: { populate: '*', ...(params ?? {}) },
    });
    const items = unwrapCollection<Client>(data);
    return items.map(normalizeClientEntity);
  },

  /** Recherche légère pour autocomplete */
  async lookup(search = '', pageSize = 50): Promise<Client[]> {
    const trimmed = search.trim();
    const params: Record<string, unknown> = {
      fields: ['code', 'fullName', 'companyName', 'name'],
      pagination: { page: 1, pageSize },
      sort: ['updatedAt:desc'],
    };
    if (trimmed) {
      params.filters = {
        $or: [
          { fullName: { $containsi: trimmed } },
          { companyName: { $containsi: trimmed } },
          { code: { $containsi: trimmed } },
        ],
      };
    }
    const { data } = await api.get('/clients', { params });
    return unwrapCollection<Client>(data);
  },
};
