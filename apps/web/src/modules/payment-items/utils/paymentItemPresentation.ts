import { BankAccount, Client, PaymentItem, PaymentItemStatus, PaymentItemType } from '@/types/domain';

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
  { value: 'Reçu', label: 'Reçu' },
  { value: 'Déposé', label: 'Déposé' },
  { value: 'Payé', label: 'Payé' },
  { value: 'Rejeté', label: 'Rejeté' },
  { value: 'Annulé', label: 'Annulé' },
  { value: 'En retard', label: 'En retard' },
];

const legacyStatusMap: Record<string, PaymentItemStatus> = {
  PENDING: 'Reçu',
  DRAFT: 'Reçu',
  RECEIVED: 'Reçu',
  DEPOSITED: 'Déposé',
  PAID: 'Payé',
  REJECTED: 'Rejeté',
  CANCELLED: 'Annulé',
  CANCELED: 'Annulé',
  OVERDUE: 'En retard',
  LATE: 'En retard',
};

export const getPaymentItemStatusLabel = (status?: string | null): PaymentItemStatus | string => {
  if (!status?.trim()) {
    return 'Reçu';
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
  client?.companyName?.trim() || client?.fullName?.trim() || client?.name?.trim() || client?.code || '—';

export const getPaymentItemClientSecondary = (client?: Client | null) => {
  const companyName = client?.companyName?.trim();
  const fullName = client?.fullName?.trim();

  if (companyName && fullName && companyName !== fullName) {
    return fullName;
  }

  return client?.code || '';
};

export const getPaymentItemAccount = (item?: Partial<PaymentItem> | null): BankAccount | null =>
  item?.account || item?.bankAccount || null;

export const getPaymentItemAccountPrimary = (account?: BankAccount | null) =>
  account?.label?.trim() || account?.rib?.trim() || account?.accountNumber?.trim() || '—';

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
  return resolved === 'Payé' || resolved === 'Annulé' || resolved === 'Rejeté';
};

