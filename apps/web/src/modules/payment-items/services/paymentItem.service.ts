import { createCrudService } from '@/services/api/crud';
import { PaymentItem } from '@/types/domain';

const rawService = createCrudService<PaymentItem>('/payment-items');

/**
 * Normalize a Strapi payment-item record into the frontend domain shape.
 * Strapi uses `echeance` — the frontend uses `dueDate`.
 */
function normalizeFromBackend(item: any): PaymentItem {
  if (!item) return item;
  const { echeance, ...rest } = item;
  return {
    ...rest,
    dueDate: rest.dueDate || echeance || '',
  };
}

/** Map frontend `dueDate` back to the Strapi field `echeance`. */
function normalizeToBackend(payload: any): any {
  if (!payload) return payload;
  const { dueDate, ...rest } = payload;
  return {
    ...rest,
    echeance: dueDate ?? null,
  };
}

export const paymentItemService = {
  async list(params?: Record<string, unknown>) {
    const items = await rawService.list(params);
    return items.map(normalizeFromBackend);
  },
  async get(id: number, params?: Record<string, unknown>) {
    const item = await rawService.get(id, params);
    return item ? normalizeFromBackend(item) : null;
  },
  async create(payload: Partial<PaymentItem>) {
    const item = await rawService.create(normalizeToBackend(payload));
    return item ? normalizeFromBackend(item) : null;
  },
  async update(id: number, payload: Partial<PaymentItem>) {
    const item = await rawService.update(id, normalizeToBackend(payload));
    return item ? normalizeFromBackend(item) : null;
  },
  async remove(id: number) {
    return rawService.remove(id);
  },
};

