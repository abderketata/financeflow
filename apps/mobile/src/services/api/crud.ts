import { api } from '@/services/api/client';
import { unwrapCollection, unwrapSingle } from '@/utils/strapi';

const STRAPI_MUTATION_SYSTEM_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPaymentItemsEndpoint = (endpoint: string) => /(^|\/)payment-items(\/|$)/.test(endpoint);

const isPaymentItemsDebugEnabled = () => typeof __DEV__ !== 'undefined' && __DEV__;

const sanitizeMutationPayload = <T>(value: T, isRoot = true): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMutationPayload(entry, false)) as T;
  }

  if (!isObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'id' || !isRoot)
      .filter(([key]) => !STRAPI_MUTATION_SYSTEM_FIELDS.has(key))
      .map(([key, entry]) => [key, sanitizeMutationPayload(entry, false)])
  ) as T;
};

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
    const sanitizedPayload = sanitizeMutationPayload(payload);

    if (isPaymentItemsEndpoint(endpoint) && isPaymentItemsDebugEnabled()) {
      console.log('[financeflow-mobile][payment-items] crud create', {
        endpoint,
        body: { data: sanitizedPayload },
      });
    }

    const { data } = await api.post(endpoint, { data: sanitizedPayload });
    return unwrapSingle<TEntity>(data);
  },
  async update(id: number, payload: TPayload) {
    const sanitizedPayload = sanitizeMutationPayload(payload);

    if (isPaymentItemsEndpoint(endpoint) && isPaymentItemsDebugEnabled()) {
      console.log('[financeflow-mobile][payment-items] crud update', {
        endpoint: `${endpoint}/${id}`,
        body: { data: sanitizedPayload },
      });
    }

    const { data } = await api.put(`${endpoint}/${id}`, { data: sanitizedPayload });
    return unwrapSingle<TEntity>(data);
  },
  async remove(id: number) {
    await api.delete(`${endpoint}/${id}`);
  }
});

