import { BankAccount, Client, PaymentItem, PaymentItemStatus, PaymentItemType, TransactionOperationType, Transaction } from '@/types';

export const paymentItemTypeOptions: Array<{ value: PaymentItemType; label: string }> = [
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'TRAITE', label: 'Traite' },
  { value: 'AUTRE', label: 'Autre' },
];

const paymentItemTypePrefixMap: Record<PaymentItemType, string> = {
  CHEQUE: 'CHQ',
  TRAITE: 'TRT',
  AUTRE: 'AUT',
};

export const paymentItemStatusOptions: Array<{ value: PaymentItemStatus; label: PaymentItemStatus }> = [
  { value: 'Déposé', label: 'Déposé' },
  { value: 'Payé', label: 'Payé' },
  { value: 'Annulé', label: 'Annulé' },
  { value: 'En retard', label: 'En retard' },
];

const legacyStatusMap: Record<string, PaymentItemStatus> = {
  PENDING: 'Déposé',
  DRAFT: 'Déposé',
  RECEIVED: 'Déposé',
  DEPOSITED: 'Déposé',
  PAID: 'Payé',
  REJECTED: 'Annulé',
  CANCELLED: 'Annulé',
  CANCELED: 'Annulé',
  OVERDUE: 'En retard',
  LATE: 'En retard',
};

export const getPaymentItemStatusLabel = (status?: string | null): PaymentItemStatus | string => {
  if (!status?.trim()) {
    return 'Déposé';
  }

  return legacyStatusMap[status.trim().toUpperCase()] || status.trim();
};

export const getPaymentItemReference = (item?: Partial<PaymentItem> | null) =>
  item?.referenceNumber?.trim() || item?.reference?.trim() || '—';

export const buildPaymentItemReference = (
  type: PaymentItemType,
  direction: 'IN' | 'OUT',
  year = new Date().getFullYear(),
) => `${paymentItemTypePrefixMap[type]}-${direction}-${year}`;

export const getPaymentItemClientPrimary = (client?: Client | null) =>
  client?.name?.trim() || client?.code || '—';

export const getPaymentItemAccount = (item?: Partial<PaymentItem> | null): BankAccount | null =>
  item?.account || item?.bankAccount || null;

export const getPaymentItemAccountPrimary = (account?: BankAccount | null) =>
  account?.label?.trim() || account?.accountNumber?.trim() || '—';

export const getPaymentItemEffectiveDate = (item?: Partial<PaymentItem> | null) =>
  item?.dueDate || item?.issueDate || '';

export const isPaymentItemClosedStatus = (status?: string | null) => {
  const resolved = getPaymentItemStatusLabel(status);
  return resolved === 'Payé' || resolved === 'Annulé' || resolved === 'Rejeté';
};

// Map payment-items into a Transaction-like shape used by dashboard (mobile)
export const mapPaymentItemsToTransactions = (items: Array<Partial<PaymentItem> | any>): Transaction[] => {
  return (items || []).map((raw) => {
    const node = raw as any;
    const attrs = node?.data?.attributes || node?.attributes || node || {};

    const amount = Number(attrs?.amount || 0) || 0;
    const direction = (attrs?.direction || 'IN') as 'IN' | 'OUT';
    const operationType = (direction === 'IN' ? 'CREDIT' : 'DEBIT') as TransactionOperationType;

    const operationDate = attrs?.dueDate || attrs?.issueDate || attrs?.paymentDate || attrs?.receptionDate || attrs?.createdAt || '';

    return {
      id: attrs?.id || node?.id || 0,
      label: attrs?.referenceNumber || attrs?.reference || '',
      operationType,
      amount,
      operationDate
    };
  });
};

