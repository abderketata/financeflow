import { Client, BankAccount, PaymentItem, Transaction, RelationCollection, ClientType } from '@/types';
import { normalizeClientIdentityNumber } from './identityNumber';
import { formatClientTaxNumber, normalizeClientTaxNumber } from './taxNumber';

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

export const getClientMetrics = (client: Client) => {
  const accounts = getClientAccounts(client);
  const paymentItems = getClientPaymentItems(client);
  const transactions = getClientTransactions(client);
  return {
    accountsCount: accounts.length,
    paymentItemsCount: paymentItems.length,
    transactionsCount: transactions.length,
  };
};

export const getClientActivitySummary = (client: Client): string => {
  const m = getClientMetrics(client);
  return `${m.accountsCount} compte${m.accountsCount > 1 ? 's' : ''} • ${m.paymentItemsCount} paiement${m.paymentItemsCount > 1 ? 's' : ''} • ${m.transactionsCount} trans`;
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

