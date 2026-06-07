import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { PaginatedResult, StrapiCollectionResponse, StrapiPaginationMeta } from '@/types/api';
import { PaymentItem } from '@/types/domain';
import { unwrapCollection } from '@/utils/strapi';

const rawService = createCrudService<PaymentItem>('/payment-items');

const ACTIVE_PAYMENT_ITEMS_FILTER = { supprimer: { $eq: false } };
const DEFAULT_MULTI_PAGE_SIZE = 250;
const MULTI_PAGE_BATCH_SIZE = 4;

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

const toPositiveInteger = (value: unknown, fallback: number) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? Math.floor(normalized) : fallback;
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const getErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const apiError = error as {
    status?: number;
    error?: { status?: number };
    response?: { status?: number };
  };

  return apiError.error?.status ?? apiError.status ?? apiError.response?.status;
};

const omitFieldsParam = (params?: Record<string, unknown>) => {
  if (!params || !('fields' in params)) {
    return params;
  }

  const { fields, ...rest } = params;
  return rest;
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
  async listActivePage(params?: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<PaginatedResult<PaymentItem>> {
    return this.listPage(buildActivePaymentItemsParams(params), options);
  },
  async listAllActive(params?: Record<string, unknown>, options?: { signal?: AbortSignal }) {
    const callerPagination = (params?.pagination as Record<string, unknown> | undefined) ?? {};
    const basePagination = {
      ...callerPagination,
      page: 1,
      pageSize: toPositiveInteger(callerPagination.pageSize, DEFAULT_MULTI_PAGE_SIZE),
      withCount: true,
    };

    const buildRequestParams = (sourceParams?: Record<string, unknown>) => ({
      ...(sourceParams ?? {}),
      pagination: basePagination,
    });

    let effectiveParams = params;
    let firstPage: PaginatedResult<PaymentItem>;

    try {
      firstPage = await this.listActivePage(buildRequestParams(effectiveParams), options);
    } catch (error) {
      if (getErrorStatus(error) !== 400 || !effectiveParams?.fields) {
        throw error;
      }

      effectiveParams = omitFieldsParam(effectiveParams);
      firstPage = await this.listActivePage(buildRequestParams(effectiveParams), options);
    }

    if (firstPage.pagination.pageCount <= 1) {
      return firstPage.data;
    }

    const remainingPages = Array.from(
      { length: Math.max(firstPage.pagination.pageCount - 1, 0) },
      (_, index) => index + 2,
    );
    const allPages = [firstPage];

    for (const pageBatch of chunk(remainingPages, MULTI_PAGE_BATCH_SIZE)) {
      const batchResults = await Promise.all(
        pageBatch.map((page) => this.listActivePage({
          ...(effectiveParams ?? {}),
          pagination: {
            ...basePagination,
            page,
          },
        }, options))
      );

      allPages.push(...batchResults);
    }

    return allPages
      .sort((left, right) => left.pagination.page - right.pagination.page)
      .flatMap((page) => page.data);
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
