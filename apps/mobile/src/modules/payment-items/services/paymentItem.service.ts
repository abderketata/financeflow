import { createCrudService } from '@/services/api/crud';
import { PaymentItem } from '@/types';

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

const PM_TO_BACKEND: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
};

const PM_FROM_BACKEND: Record<string, string> = {
  'Espèces': 'ESPECES',
  Virement: 'VIREMENT',
  Carte: 'CARTE',
};

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

export const paymentItemService = {
  async list(params?: Record<string, unknown>) {
    const items = await rawService.list(params);
    return items.map(normalizePaymentItemFromBackend);
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
  remove: rawService.remove,
  async listActive(params?: Record<string, unknown>) {
    const items = await rawService.list(buildActivePaymentItemsParams(params));
    return items.map(normalizePaymentItemFromBackend);
  },
};

