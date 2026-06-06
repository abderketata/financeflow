import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { PaginatedResult, StrapiCollectionResponse, StrapiPaginationMeta } from '@/types/api';
import { PaymentItem } from '@/types/domain';
import { unwrapCollection } from '@/utils/strapi';

const rawService = createCrudService<PaymentItem>('/payment-items');

const ACTIVE_PAYMENT_ITEMS_FILTER = { supprimer: { $eq: false } };

const buildActivePaymentItemsParams = (params?: Record<string, unknown>) => {
  const callerFilters = (params?.filters as Record<string, unknown> | undefined) ?? {};
  const hasAndFilters = Array.isArray((callerFilters as { $and?: unknown[] }).$and);

  return {
    ...(params ?? {}),
    filters: Object.keys(callerFilters).length
      ? hasAndFilters
        ? { $and: [ACTIVE_PAYMENT_ITEMS_FILTER, ...(((callerFilters as { $and?: Record<string, unknown>[] }).$and) ?? [])] }
        : { ...ACTIVE_PAYMENT_ITEMS_FILTER, ...callerFilters }
      : ACTIVE_PAYMENT_ITEMS_FILTER,
  };
};

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const normalizeStrapiValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(normalizeStrapiValue);
  }

  if (!isObject(value)) {
    return value;
  }

  if ('data' in value) {
    return normalizeStrapiValue(value.data);
  }

  if ('attributes' in value && isObject(value.attributes)) {
    return {
      id: value.id,
      ...Object.fromEntries(Object.entries(value.attributes).map(([key, entry]) => [key, normalizeStrapiValue(entry)])),
    };
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeStrapiValue(entry)]));
};

// ── Payment method value mappings ────────────────────────────────────
// Backend stores French labels; frontend uses uppercase keys.
const PM_TO_BACKEND: Record<string, string> = {
  ESPECES:  'Espèces',
  VIREMENT: 'Virement',
  CARTE:    'Carte',
};
const PM_FROM_BACKEND: Record<string, string> = {
  'Espèces':  'ESPECES',
  'Virement': 'VIREMENT',
  'Carte':    'CARTE',
};

/**
 * Normalize a Strapi payment-item record into the frontend domain shape.
 * Strapi uses `echeance` (due date) and `methodPayment` (French label) for payment method.
 */
export function normalizePaymentItemFromBackend(item: any): PaymentItem {
  if (!item) return item;
  const normalizedItem = normalizeStrapiValue(item);
  const { echeance, methodPayment, paymentMethod, ...rest } = normalizedItem;
  const rawPm = paymentMethod || methodPayment;
  return {
    ...rest,
    dueDate: rest.dueDate || echeance || '',
    paymentMethod: (rawPm ? (PM_FROM_BACKEND[rawPm] ?? undefined) : undefined) as any,
  };
}

/**
 * Map frontend fields back to Strapi field names.
 * Converts uppercase enum keys to French labels expected by the backend.
 * Le nettoyage des champs système Strapi est centralisé dans `services/api/crud.ts`
 * afin que createdBy/updatedBy soient toujours résolus côté backend via le JWT.
 */
function normalizeToBackend(payload: any): any {
  if (!payload) return payload;
  const { dueDate, paymentMethod, ...rest } = payload;

  const backendPm = paymentMethod ? (PM_TO_BACKEND[paymentMethod] ?? null) : null;
  return {
    ...rest,
    echeance: dueDate ?? null,
    methodPayment: backendPm,
  };
}

const EMPTY_PAGINATION: StrapiPaginationMeta = {
  page: 1,
  pageSize: 25,
  pageCount: 0,
  total: 0,
};

const normalizePaginationMeta = (meta?: Record<string, unknown>): StrapiPaginationMeta => {
  const pagination = (meta?.pagination as Partial<StrapiPaginationMeta> | undefined) ?? {};

  return {
    page: Number(pagination.page ?? EMPTY_PAGINATION.page),
    pageSize: Number(pagination.pageSize ?? EMPTY_PAGINATION.pageSize),
    pageCount: Number(pagination.pageCount ?? EMPTY_PAGINATION.pageCount),
    total: Number(pagination.total ?? EMPTY_PAGINATION.total),
  };
};

export const paymentItemService = {
  async list(params?: Record<string, unknown>, options?: { signal?: AbortSignal }) {
    const items = await rawService.list(params, options);
    return items.map(normalizePaymentItemFromBackend);
  },
  async listActive(params?: Record<string, unknown>, options?: { signal?: AbortSignal }) {
    const items = await rawService.list(buildActivePaymentItemsParams(params), options);
    return items.map(normalizePaymentItemFromBackend);
  },
  async listPage(params?: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<PaginatedResult<PaymentItem>> {
    const { data } = await api.get<StrapiCollectionResponse<PaymentItem>>('/payment-items', {
      params,
      signal: options?.signal,
    });

    return {
      data: unwrapCollection<PaymentItem>(data).map(normalizePaymentItemFromBackend),
      pagination: normalizePaginationMeta(data.meta),
    };
  },
  async get(id: number, params?: Record<string, unknown>) {
    const item = await rawService.get(id, params);
    return item ? normalizePaymentItemFromBackend(item) : null;
  },
  async create(payload: Partial<PaymentItem>) {
    const item = await rawService.create(normalizeToBackend(payload));
    return item ? normalizePaymentItemFromBackend(item) : null;
  },
  async update(id: number, payload: Partial<PaymentItem>) {
    const item = await rawService.update(id, normalizeToBackend(payload));
    return item ? normalizePaymentItemFromBackend(item) : null;
  },
  async remove(id: number) {
    return rawService.remove(id);
  },
};
