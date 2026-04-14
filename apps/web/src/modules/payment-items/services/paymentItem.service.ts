import { createCrudService } from '@/services/api/crud';
import { PaymentItem } from '@/types/domain';

const rawService = createCrudService<PaymentItem>('/payment-items');

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
function normalizeFromBackend(item: any): PaymentItem {
  if (!item) return item;
  const { echeance, methodPayment, paymentMethod, ...rest } = item;
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
