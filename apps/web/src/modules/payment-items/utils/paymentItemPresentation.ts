import { BankAccount, Client, PaymentItem, PaymentItemStatus, PaymentItemType, PaymentMethod, TransactionOperationType, Transaction } from '@/types/domain';

export const paymentItemTypeOptions: Array<{ value: PaymentItemType; label: string }> = [
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'TRAITE', label: 'Traite' },
  { value: 'AUTRE', label: 'Autre' },
];

export const paymentMethodLabelMap: Record<PaymentMethod, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
};

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

export const getPaymentItemTypeLabel = (item?: Partial<PaymentItem> | null) => {
  if (!item?.type) {
    return '—';
  }

  if (item.type === 'AUTRE' && item.paymentMethod) {
    return paymentMethodLabelMap[item.paymentMethod] ?? item.paymentMethod;
  }

  return paymentItemTypeOptions.find((option) => option.value === item.type)?.label ?? item.type;
};

export const getPaymentItemDirectionLabel = (direction?: string | null) => {
  if (direction === 'IN') {
    return 'Entrant';
  }

  if (direction === 'OUT') {
    return 'Sortant';
  }

  return '—';
};

export const buildPaymentItemReference = (
  type: PaymentItemType,
  direction: 'IN' | 'OUT',
  year = new Date().getFullYear(),
) => `${paymentItemTypePrefixMap[type]}-${direction}-${year}`;

export const getPaymentItemClientPrimary = (client?: Client | null) =>
  client?.companyName?.trim() || client?.fullName?.trim() || client?.name?.trim() || client?.code || '—';

export const getPaymentItemClientSecondary = (client?: Client | null) => {
  const companyName = client?.companyName?.trim();
  const fullName = client?.fullName?.trim();

  if (companyName && fullName && companyName !== fullName) {
    return fullName;
  }

  return client?.code || '';
};

export const getPaymentItemAccount = (item?: Partial<PaymentItem> | null): BankAccount | null => {
  const rawItem = item as any;
  return rawItem?.data?.attributes?.account
    || rawItem?.data?.account
    || rawItem?.attributes?.account
    || rawItem?.account
    || rawItem?.data?.attributes?.bankAccount
    || rawItem?.data?.bankAccount
    || rawItem?.attributes?.bankAccount
    || rawItem?.bankAccount
    || null;
};

export const getPaymentItemNotes = (item?: Partial<PaymentItem> | null) => {
  const rawItem = item as any;
  return rawItem?.data?.attributes?.notes?.trim()
    || rawItem?.attributes?.notes?.trim()
    || rawItem?.notes?.trim()
    || rawItem?.data?.notes?.trim()
    || '';
};

export const getPaymentItemAccountPrimary = (account?: BankAccount | null) => {
  const rawAccount = account as any;
  return rawAccount?.label?.trim()
    || rawAccount?.attributes?.label?.trim()
    || rawAccount?.data?.attributes?.label?.trim()
    || rawAccount?.rib?.trim()
    || rawAccount?.attributes?.rib?.trim()
    || rawAccount?.data?.attributes?.rib?.trim()
    || rawAccount?.accountNumber?.trim()
    || rawAccount?.attributes?.accountNumber?.trim()
    || rawAccount?.data?.attributes?.accountNumber?.trim()
    || '—';
};

export const getPaymentItemAccountSecondary = (account?: BankAccount | null) => {
  if (!account) {
    return '';
  }

  const values = [account.accountNumber?.trim(), account.rib?.trim()].filter(Boolean) as string[];
  const primary = getPaymentItemAccountPrimary(account);
  return values.find((value) => value !== primary) || '';
};

export const getPaymentItemEffectiveDate = (item?: Partial<PaymentItem> | null) =>
  item?.dueDate || item?.issueDate || '';

export const getPaymentItemEffectiveDateLabel = (item?: Partial<PaymentItem> | null) =>
  item?.dueDate ? 'Échéance' : 'Émission';

export const getPaymentItemCurrency = (item?: Partial<PaymentItem> | null, defaultCurrency = 'TND') =>
  item?.currency || getPaymentItemAccount(item)?.currency || defaultCurrency;

export const isPaymentItemClosedStatus = (status?: string | null) => {
  const resolved = getPaymentItemStatusLabel(status);
  return resolved === 'Payé' || resolved === 'Annulé';
};

// Map payment-items (raw or normalized) into a Transaction-like shape used by the dashboard charts
export const mapPaymentItemsToTransactions = (items: Array<Partial<PaymentItem> | any>): Transaction[] => {
  return (items || []).map((raw) => {
    const node = raw as any;
    const attrs = node?.data?.attributes || node?.attributes || node || {};

    const amount = Number(attrs?.amount || attrs?.montant || 0) || 0;
    const direction = (attrs?.direction || 'IN') as 'IN' | 'OUT';
    const operationType = (direction === 'IN' ? 'CREDIT' : 'DEBIT') as TransactionOperationType;

    const operationDate = attrs?.dueDate || attrs?.echeance || '';

    return {
      id: attrs?.id || node?.id || 0,
      label: attrs?.referenceNumber || attrs?.reference || '',
      operationType,
      amount,
      operationDate
    };
  });
};

