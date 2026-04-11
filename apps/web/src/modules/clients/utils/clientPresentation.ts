import { Client, BankAccount, PaymentItem, Transaction, RelationCollection, ClientType } from '@/types/domain';
import { normalizeText } from '@/utils/format';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const toRelationArray = <T>(value?: RelationCollection<T> | T[] | null): T[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (isObject(value) && 'data' in value && Array.isArray((value as { data?: T[] | null }).data)) {
    return ((value as { data?: T[] | null }).data ?? []) as T[];
  }

  return [];
};

export const getClientPrimaryName = (client: Partial<Client>) => {
  const fullName = client.fullName?.trim();
  const companyName = client.companyName?.trim();
  const legacyName = client.name?.trim();

  if (client.type === 'COMPANY') {
    return companyName || fullName || legacyName || client.code?.trim() || 'Client sans nom';
  }

  return fullName || companyName || legacyName || client.code?.trim() || 'Client sans nom';
};

export const getClientSecondaryName = (client: Partial<Client>) => {
  const fullName = client.fullName?.trim();
  const companyName = client.companyName?.trim();
  const legacyName = client.name?.trim();

  if (client.type === 'COMPANY') {
    return fullName || (legacyName && legacyName !== companyName ? legacyName : '') || '';
  }

  return companyName || (legacyName && legacyName !== fullName ? legacyName : '') || '';
};

export const getClientDisplayName = (client: Partial<Client>) => getClientPrimaryName(client);

export const getClientInitials = (client: Partial<Client>) => {
  const name = getClientDisplayName(client);
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);

  if (!parts.length) {
    return 'CL';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

export const getClientTypeLabel = (type?: string | null) => {
  if (type === 'COMPANY') return 'Société';
  if (type === 'INDIVIDUAL') return 'Particulier';
  return type || 'Non défini';
};

export const getClientStatusKey = (isActive?: boolean | null) => (isActive === false ? 'INACTIVE' : 'ACTIVE');

export const getClientStatusLabel = (isActive?: boolean | null) => (isActive === false ? 'Inactif' : 'Actif');

export const generateClientCode = (fullName?: string | null) => {
  const normalized = (fullName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/[\s_-]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  return normalized;
};

export const getDisplayValue = (value?: string | number | null, fallback = 'Non renseigné') => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : fallback;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
};

export const getAddressValue = (value?: string | null) => getDisplayValue(value, 'Non renseignée');

export const getClientAccounts = (client: Client): BankAccount[] => toRelationArray(client.accounts);
export const getClientPaymentItems = (client: Client): PaymentItem[] => toRelationArray(client.paymentItems);
export const getClientTransactions = (client: Client): Transaction[] => toRelationArray(client.transactions);

export const getBankAccountCurrentBalance = (account: Partial<BankAccount>) =>
  Number(account.currentBalance ?? account.balance ?? 0);

export const getBankAccountOpeningBalance = (account: Partial<BankAccount>) =>
  Number(account.openingBalance ?? 0);

export const getPaymentItemCurrency = (item: Partial<PaymentItem>) => item.currency || item.bankAccount?.currency || 'TND';
export const getTransactionCurrency = (transaction: Partial<Transaction>) => transaction.currency || transaction.bankAccount?.currency || 'TND';

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

export const getClientActivitySummary = (client: Client) => {
  const metrics = getClientMetrics(client);
  return `${metrics.accountsCount} compte${metrics.accountsCount > 1 ? 's' : ''} • ${metrics.paymentItemsCount} paiement${metrics.paymentItemsCount > 1 ? 's' : ''} • ${metrics.transactionsCount} trans`;
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
      paymentItem.reference,
      paymentItem.type,
      paymentItem.direction,
      paymentItem.status,
      paymentItem.notes,
      paymentItem.drawer,
      paymentItem.drawee,
      paymentItem.bankName,
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

export const getClientFormDefaults = (
  client?: Partial<Client> | null,
): {
  code: string;
  type: ClientType;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  identityNumber: string;
  taxNumber: string;
  notes: string;
  isActive: boolean;
  accountIds: number[];
} => {
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
    identityNumber: client.identityNumber || '',
    taxNumber: client.taxNumber || '',
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

  return {
    code: generateClientCode(fullName),
    type,
    name: fallbackName,
    fullName,
    companyName,
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    address: address?.trim() || '',
    identityNumber: identityNumber?.trim() || '',
    taxNumber: taxNumber?.trim() || '',
    notes: notes?.trim() || '',
    isActive: isActive ?? true,
  };
};



