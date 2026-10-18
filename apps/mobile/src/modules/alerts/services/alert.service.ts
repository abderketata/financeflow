import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { normalizePaymentItemFromBackend } from '@/modules/payment-items/services/paymentItem.service';
import { AlertItem, PaymentItem, RelationCollection, StrapiCollectionResponse } from '@/types';
import { unwrapCollection, unwrapSingle } from '@/utils/strapi';

const alertCrudService = createCrudService<AlertItem>('/alerts');

/**
 * Sans `pagination`, Strapi renvoie 25 alertes au maximum et les compteurs
 * « Toutes / Non lues / Lues » mentent dès que le seuil est franchi.
 */
export const ALERTS_PAGE_SIZE = 100;

/** Nombre d'alertes non lues — source unique de la pastille et de l'onglet. */
export const countUnreadAlerts = (alerts: AlertItem[] = []) => alerts.filter((alert) => !alert.isRead).length;

const normalizeRelationCollection = (value?: RelationCollection<PaymentItem>): PaymentItem[] => {
  if (!value) {
	return [];
  }

  const items = Array.isArray(value) ? value : value.data ?? [];
  return items.filter(Boolean).map(normalizePaymentItemFromBackend);
};

const extractAlertPaymentItems = (alert?: AlertItem | null) => {
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

const getPaginationTotal = (meta?: Record<string, unknown>) => {
  const total = Number((meta?.pagination as { total?: unknown } | undefined)?.total ?? 0);
  return Number.isFinite(total) && total >= 0 ? total : 0;
};

export const alertService = {
  ...alertCrudService,
  async countUnread(options?: { signal?: AbortSignal }) {
	const { data } = await api.get<StrapiCollectionResponse<Pick<AlertItem, 'id'>>>('/alerts', {
	  params: {
		fields: ['id'],
		filters: {
		  isRead: {
			$eq: false,
		  },
		},
		pagination: {
		  page: 1,
		  pageSize: 1,
		  withCount: true,
		},
	  },
	  signal: options?.signal,
	});

	return getPaginationTotal(data.meta);
  },
  /**
   * Même fenêtre et même règle que la liste de l'écran « Alertes » (une alerte
   * sans `isRead` compte comme non lue), réduite au seul champ utile : la
   * pastille posée en arrière-plan doit afficher le même nombre que l'onglet.
   * `countUnread` filtre côté serveur sur `isRead = false` et ignorerait les
   * alertes dont le champ est vide.
   */
  async countUnreadInList() {
	const alerts = await alertCrudService.list({
	  fields: ['isRead'],
	  pagination: { page: 1, pageSize: ALERTS_PAGE_SIZE },
	  sort: ['id:desc'],
	});

	return countUnreadAlerts(alerts);
  },
  async getPaymentItems(alertId: number): Promise<PaymentItem[]> {
	const alert = await alertCrudService.get(alertId, {
	  populate: {
		paymentItem: { populate: '*' },
		paymentItems: { populate: '*' },
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
		  paymentItem: { populate: '*' },
		  paymentItems: { populate: '*' },
		},
	  },
	});

	return extractAlertPaymentItems(unwrapSingle<AlertItem>(data));
  },
};

