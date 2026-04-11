import { api } from '@/services/api/client';
import { unwrapCollection, unwrapSingle } from '@/utils/strapi';

export const createCrudService = <TEntity, TPayload = Partial<TEntity>>(endpoint: string) => ({
  async list(params?: Record<string, unknown>) {
    const { data } = await api.get(endpoint, { params });
    return unwrapCollection<TEntity>(data);
  },
  async get(id: number, params?: Record<string, unknown>) {
    const { data } = await api.get(`${endpoint}/${id}`, { params });
    return unwrapSingle<TEntity>(data);
  },
  async create(payload: TPayload) {
    const { data } = await api.post(endpoint, { data: payload });
    return unwrapSingle<TEntity>(data);
  },
  async update(id: number, payload: TPayload) {
    const { data } = await api.put(`${endpoint}/${id}`, { data: payload });
    return unwrapSingle<TEntity>(data);
  },
  async remove(id: number) {
    await api.delete(`${endpoint}/${id}`);
  }
});

