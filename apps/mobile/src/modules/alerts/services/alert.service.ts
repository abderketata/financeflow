import { createCrudService } from '@/services/api/crud';
import { AlertItem } from '@/types';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';

const rawService = createCrudService<AlertItem>('/alerts');

const normalizeRelationCollection = (value?: any): any[] => {
  if (!value) return [];
  const items = Array.isArray(value) ? value : value.data ?? [];
  return items.filter(Boolean);
};

export const alertService = {
  ...rawService,

  async listForAlertsPage(params?: Record<string, unknown>) {
	const mergedParams = {
	  ...(params || {}),
	  populate: (params && (params as any).populate) || '*',
	  filters: {
		...((params && (params as any).filters) || {}),
									  // attempt server-side inclusion: only alerts whose related paymentItem has status 'Déposé'
									  paymentItem: { status: { $eq: 'Déposé' } },
	  },
	};

	const items = await rawService.list(mergedParams);

	// in-memory fallback: include only alerts linked to at least one payment-item with status 'Déposé'
	return (items || []).filter((alert) => {
	  const related = normalizeRelationCollection((alert as any).paymentItems);
	  if (related.length) {
		return related.some((pi) => getPaymentItemStatusLabel(pi?.status) === 'Déposé');
	  }

	  const single = (alert as any).paymentItem;
	  if (single) {
		const status = single?.data?.attributes?.status || single?.attributes?.status || single?.status;
		return getPaymentItemStatusLabel(status) === 'Déposé';
	  }

	  return false;
	});
  },
};

