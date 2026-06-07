import { Alert, PaymentItem } from '@/types/domain';
import { getPaymentItemClientPrimary, getPaymentItemReference } from '@/modules/payment-items/utils/paymentItemPresentation';

export const getAlertPaymentItems = (alert: Alert) => {
  if (Array.isArray(alert.paymentItems)) {
    return alert.paymentItems.filter(Boolean);
  }

  if (alert.paymentItems?.data) {
    return alert.paymentItems.data.filter(Boolean);
  }

  return alert.paymentItem ? [alert.paymentItem] : [];
};

export const getPrimaryAlertPaymentItem = (alert: Alert): PaymentItem | null => getAlertPaymentItems(alert)[0] ?? null;

export const getAlertScheduledAt = (alert: Alert) => {
  const paymentItem = getPrimaryAlertPaymentItem(alert);
  return alert.scheduledAt || alert.triggerDate || paymentItem?.dueDate || paymentItem?.paymentDate || paymentItem?.createdAt || null;
};

export const getAlertSentAt = (alert: Alert) => alert.sentAt || alert.createdAt || alert.updatedAt || null;

export const getAlertTimestamp = (value?: string | null, fallback = Number.POSITIVE_INFINITY) => {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
};

export const getAlertAssociatedLabel = (alert: Alert) => {
  const paymentItem = getPrimaryAlertPaymentItem(alert);
  if (!paymentItem) {
    return 'Paiement non lié';
  }

  const clientLabel = getPaymentItemClientPrimary(paymentItem.client);
  const reference = getPaymentItemReference(paymentItem);
  return clientLabel !== '—' ? `${clientLabel} · ${reference}` : reference;
};

