import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { normalizePaymentItemFromBackend } from '@/modules/payment-items/services/paymentItem.service';
import { Alert, PaymentItem, RelationCollection } from '@/types/domain';
import { unwrapCollection, unwrapSingle } from '@/utils/strapi';
import { getPaymentItemStatusLabel } from '@/modules/payment-items/utils/paymentItemPresentation';

const alertCrudService = createCrudService<Alert>('/alerts');

const normalizeRelationCollection = (value?: RelationCollection<PaymentItem>): PaymentItem[] => {
  if (!value) {
	return [];
  }

  const items = Array.isArray(value) ? value : value.data ?? [];
  return items.filter(Boolean).map(normalizePaymentItemFromBackend);
};

const extractAlertPaymentItems = (alert?: Alert | null) => {
  if (!alert) {
	return [];
  }

  const relatedItems = normalizeRelationCollection(alert.paymentItems);
  if (relatedItems.length) {
	return relatedItems;
  }

  return alert.paymentItem ? [normalizePaymentItemFromBackend(alert.paymentItem)] : [];
};

const normalizePaymentItemsResponse = (payload: any): PaymentItem[] => {
  if (Array.isArray(payload)) {
	return payload.filter(Boolean).map(normalizePaymentItemFromBackend);
  }

  if (Array.isArray(payload?.data)) {
	return unwrapCollection<any>(payload).map(normalizePaymentItemFromBackend);
  }

  if (payload?.data) {
	return [normalizePaymentItemFromBackend(unwrapSingle<any>(payload))].filter(Boolean);
  }

  return [];
};

const isNotFoundError = (error: any) => {
  const status = error?.error?.status ?? error?.status ?? error?.response?.status;
  return status === 404;
};

export const alertService = {
  ...alertCrudService,
  /**
   * List alerts while excluding alerts linked to payment-items with status 'Déposé'.
   * We try to apply the exclusion via Strapi filters when possible, and always apply
   * a final centralized in-memory filter to guarantee the rule.
   */
  /**
   * Specialised list used by the /alerts page. It excludes alerts linked to
   * payment-items with status 'Déposé' (server-side filter attempted + in-memory fallback).
   */
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

	const items = await alertCrudService.list(mergedParams);

	// centralized in-memory filter as a fallback: only keep alerts that are linked to
	// at least one payment item whose normalized status === 'Déposé'
	return (items || []).filter((alert) => {
	  const related = normalizeRelationCollection(alert.paymentItems);
	  if (related.length) {
		// include if ANY related payment item resolves to 'Déposé'
		return related.some((pi) => getPaymentItemStatusLabel(pi.status) === 'Déposé');
	  }

	  if (alert.paymentItem) {
		const single = normalizePaymentItemFromBackend(alert.paymentItem as any);
		return getPaymentItemStatusLabel(single.status) === 'Déposé';
	  }

	  return false;
	});
  },
  async getPaymentItems(alertId: number): Promise<PaymentItem[]> {
	const alert = await alertCrudService.get(alertId, {
	  populate: {
		paymentItem: {
		  populate: '*',
		},
		paymentItems: {
		  populate: '*',
		},
	  },
	});

	const relatedItems = extractAlertPaymentItems(alert);
	if (relatedItems.length) {
	  return relatedItems;
	}

	try {
	  const { data } = await api.get(`/alerts/${alertId}/payment-items`, {
		params: { populate: '*' },
	  });

	  return normalizePaymentItemsResponse(data);
	} catch (error) {
	  if (!isNotFoundError(error)) {
		throw error;
	  }
	}


	const { data } = await api.get(`/alerts/${alertId}`, {
	  params: {
		populate: {
		  paymentItem: {
			populate: '*',
		  },
		  paymentItems: {
			populate: '*',
		  },
		},
	  },
	});

	return extractAlertPaymentItems(unwrapSingle<Alert>(data));
  },
};

