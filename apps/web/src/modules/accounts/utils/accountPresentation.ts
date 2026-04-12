import { BankAccount } from '@/types/domain';
import { normalizeText } from '@/utils/format';

export const getAccountStatusKey = (account?: Partial<BankAccount> | null) =>
  account?.isActive === false || account?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

export const getAccountDisplayName = (account?: Partial<BankAccount> | null) =>
  account?.label?.trim() || 'Compte sans libellé';

export const getAccountClientPresentation = (account?: Partial<BankAccount> | null) => {
  const companyName = account?.client?.companyName?.trim();
  const fullName = account?.client?.fullName?.trim();

  if (fullName) {
    return {
      primary: fullName,
      secondary: companyName && companyName !== fullName ? companyName : '',
    };
  }

  if (companyName) {
    return {
      primary: companyName,
      secondary: '',
    };
  }

  return {
    primary: '—',
    secondary: '',
  };
};

export const getAccountSecondaryName = (account?: Partial<BankAccount> | null) => {
  const bankName = account?.bank?.name?.trim();
  const clientName = getAccountClientPresentation(account).primary;

  if (bankName && clientName && clientName !== '—') {
    return `${bankName} · ${clientName}`;
  }

  return bankName || (clientName !== '—' ? clientName : '') || 'Aucune relation associée';
};

export const getAccountBalanceValue = (account?: Partial<BankAccount> | null) =>
  Number(account?.currentBalance ?? account?.balance ?? 0);

export const getAccountOpeningBalanceValue = (account?: Partial<BankAccount> | null) =>
  Number(account?.openingBalance ?? 0);

export const buildAccountSearchHaystack = (account: BankAccount) =>
  [
    account.label,
    account.accountNumber,
    account.iban,
    account.rib,
    account.currency,
    account.status,
    account.bank?.name,
    account.bank?.code,
    account.client?.fullName,
    account.client?.companyName,
  ]
    .map((entry) => normalizeText(entry))
    .join(' ');

export const getAccountFormDefaults = (account?: Partial<BankAccount> | null) => ({
  label: account?.label || '',
  accountNumber: account?.accountNumber || '',
  rib: account?.rib || '',
  iban: account?.iban || '',
  balance: Number(account?.currentBalance ?? account?.balance ?? 0),
  currency: account?.currency || 'TND',
  bank: typeof account?.bank === 'object' ? account.bank?.id : account?.bank,
  client: typeof account?.client === 'object' ? account.client?.id : account?.client,
});

