import { Client, BankAccount, PaymentItem, Transaction, RelationCollection, ClientType } from '@/types';
import { getPaymentItemAccount, getPaymentItemReference } from '@/modules/payment-items/utils/paymentItemPresentation';
import { normalizeClientIdentityNumber } from './identityNumber';
import { formatClientTaxNumber, normalizeClientTaxNumber } from './taxNumber';
import { normalizeText } from '@/utils/format';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const toRelationArray = <T>(value?: RelationCollection<T> | T[] | null): T[] => {
  if (Array.isArray(value)) return value;
  if (isObject(value) && 'data' in value && Array.isArray((value as { data?: T[] | null }).data)) {
    return ((value as { data?: T[] | null }).data ?? []) as T[];
  }
  return [];
};

export const getClientPrimaryName = (client: Partial<Client>): string => {
  const fullName = client.fullName?.trim();
  const companyName = client.companyName?.trim();
  const legacyName = client.name?.trim();
  if (client.type === 'COMPANY') return companyName || fullName || legacyName || client.code?.trim() || 'Client sans nom';
  return fullName || companyName || legacyName || client.code?.trim() || 'Client sans nom';
};

export const getClientSecondaryName = (client: Partial<Client>): string => {
  const fullName = client.fullName?.trim();
  const companyName = client.companyName?.trim();
  const legacyName = client.name?.trim();
  if (client.type === 'COMPANY') return fullName || (legacyName && legacyName !== companyName ? legacyName : '') || '';
  return companyName || (legacyName && legacyName !== fullName ? legacyName : '') || '';
};

export const getClientDisplayName = (client: Partial<Client>): string => getClientPrimaryName(client);

export const getClientInitials = (client: Partial<Client>): string => {
  const name = getClientDisplayName(client);
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return 'CL';
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
};

export const getClientTypeLabel = (type?: string | null): string => {
  if (type === 'COMPANY') return 'Société';
  if (type === 'INDIVIDUAL') return 'Particulier';
  return type || 'Non défini';
};

export const getClientStatusKey = (isActive?: boolean | null): 'ACTIVE' | 'INACTIVE' =>
  isActive === false ? 'INACTIVE' : 'ACTIVE';

export const getClientStatusLabel = (isActive?: boolean | null): string =>
  isActive === false ? 'Inactif' : 'Actif';

export const generateClientCode = (fullName?: string | null): string => {
  return (fullName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/[\s_-]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
};

export const getDisplayValue = (value?: string | number | null, fallback = 'Non renseigné'): string => {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

export const getClientAccounts = (client: Client): BankAccount[] => toRelationArray(client.accounts);
export const getClientPaymentItems = (client: Client): PaymentItem[] => toRelationArray(client.paymentItems);
export const getClientTransactions = (client: Client): Transaction[] => toRelationArray(client.transactions);

export const getBankAccountCurrentBalance = (account: Partial<BankAccount>) =>
  Number(account.currentBalance ?? account.balance ?? 0);

export const getBankAccountOpeningBalance = (account: Partial<BankAccount>) =>
  Number(account.openingBalance ?? 0);

export const getPaymentItemCurrency = (item: Partial<PaymentItem>, defaultCurrency = 'TND') => item.currency || getPaymentItemAccount(item)?.currency || defaultCurrency;

export const getTransactionCurrency = (transaction: Partial<Transaction>, defaultCurrency = 'TND') => transaction.currency || transaction.bankAccount?.currency || defaultCurrency;

export const getClientMetrics = (client: Client) => {
  const accounts = getClientAccounts(client);
  const paymentItems = getClientPaymentItems(client);
  const transactions = getClientTransactions(client);

   const transactionVolume = transactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount ?? 0)), 0);
   const creditTotal = transactions
     .filter((transaction) => transaction.operationType === 'CREDIT')
     .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);
   const debitTotal = transactions
     .filter((transaction) => transaction.operationType === 'DEBIT')
     .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

  return {
    accountsCount: accounts.length,
    paymentItemsCount: paymentItems.length,
    transactionsCount: transactions.length,
    transactionVolume,
    creditTotal,
    debitTotal,
  };
};

export const getClientActivitySummary = (client: Client): string => {
  const m = getClientMetrics(client);
  return `${m.accountsCount} compte${m.accountsCount > 1 ? 's' : ''} • ${m.paymentItemsCount} paiement${m.paymentItemsCount > 1 ? 's' : ''} • ${m.transactionsCount} trans`;
};

export const buildClientSearchHaystack = (client: Client) => {
  const accounts = getClientAccounts(client);
  const paymentItems = getClientPaymentItems(client);
  const transactions = getClientTransactions(client);

  return [
    getClientDisplayName(client),
    getClientSecondaryName(client),
    client.code,
    client.type,
    client.phone,
    client.email,
    client.address,
    client.identityNumber,
    client.taxNumber,
    client.notes,
    ...accounts.flatMap((account) => [
      account.label,
      account.accountNumber,
      account.iban,
      account.rib,
      account.currency,
      account.bank?.name,
      account.status,
    ]),
    ...paymentItems.flatMap((paymentItem) => [
      getPaymentItemReference(paymentItem),
      paymentItem.type,
      paymentItem.direction,
      paymentItem.status,
      paymentItem.notes,
      paymentItem.drawer,
      paymentItem.drawee,
      paymentItem.bankName,
      getPaymentItemAccount(paymentItem)?.label,
      getPaymentItemAccount(paymentItem)?.accountNumber,
      getPaymentItemAccount(paymentItem)?.rib,
      paymentItem.instrumentAccountNumber,
    ]),
    ...transactions.flatMap((transaction) => [
      transaction.label,
      transaction.operationType,
      transaction.category,
      transaction.paymentMethod,
      transaction.status,
      transaction.notes,
    ]),
  ]
    .map((entry) => normalizeText(typeof entry === 'number' ? String(entry) : entry))
    .join(' ');
};

export const normalizeClientEntity = (client: Client): Client => ({
  ...client,
  name: client.name || getClientDisplayName(client),
  accounts: toRelationArray(client.accounts),
  paymentItems: toRelationArray(client.paymentItems),
  transactions: toRelationArray(client.transactions),
});

export const getClientFormDefaults = (client?: Partial<Client> | null) => {
  const resolvedType: ClientType = client?.type === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL';
  const resolvedFullName = client?.fullName || client?.name || '';

  if (!client) {
    return {
      code: '',
      type: resolvedType,
      fullName: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      identityNumber: '',
      taxNumber: '',
      notes: '',
      isActive: true,
      accountIds: [],
    };
  }

  return {
    code: client.code || generateClientCode(resolvedFullName),
    type: resolvedType,
    fullName: resolvedFullName,
    companyName: client.companyName || (resolvedType === 'COMPANY' ? client.name || '' : ''),
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    identityNumber: normalizeClientIdentityNumber(client.identityNumber),
    taxNumber: formatClientTaxNumber(client.taxNumber),
    notes: client.notes || '',
    isActive: client.isActive ?? true,
    accountIds: getClientAccounts(client as Client).map((account) => account.id),
  };
};

export const buildClientMutationPayload = (values: Partial<Client>): Partial<Client> => {
  const {
    type = 'INDIVIDUAL',
    fullName: rawFullName,
    companyName: rawCompanyName,
    phone,
    email,
    address,
    identityNumber,
    taxNumber,
    notes,
    isActive,
  } = values;

  const fullName = rawFullName?.trim() || '';
  const companyName = rawCompanyName?.trim() || '';
  const fallbackName = type === 'COMPANY' ? companyName || fullName : fullName || companyName;

  const payload: Partial<Client> = {
    code: generateClientCode(fullName),
    type,
    name: fallbackName,
    fullName,
    companyName,
    phone: phone?.trim() || '',
    isActive: isActive ?? true,
  };

  const trimmedEmail = email?.trim() || '';
  if (trimmedEmail !== '') payload.email = trimmedEmail;

  const trimmedAddress = address?.trim() || '';
  if (trimmedAddress !== '') payload.address = trimmedAddress;

  const trimmedIdentity = normalizeClientIdentityNumber(identityNumber);
  if (trimmedIdentity !== '') payload.identityNumber = trimmedIdentity;

  const trimmedTax = normalizeClientTaxNumber(taxNumber);
  if (trimmedTax !== '') payload.taxNumber = trimmedTax;

  const trimmedNotes = notes?.trim() || '';
  if (trimmedNotes !== '') payload.notes = trimmedNotes;

  return payload;
};

