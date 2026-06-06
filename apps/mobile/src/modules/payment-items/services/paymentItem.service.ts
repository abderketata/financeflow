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

export const paymentItemService = {
  list: rawService.list,
  get: rawService.get,
  create: rawService.create,
  update: rawService.update,
  remove: rawService.remove,
  listActive(params?: Record<string, unknown>) {
    return rawService.list(buildActivePaymentItemsParams(params));
  },
};

