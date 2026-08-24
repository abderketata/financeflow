import { api } from '@/services/api/client';
import { createCrudService } from '@/services/api/crud';
import { BankAccount } from '@/types';
import { unwrapCollection } from '@/utils/strapi';

/**
 * Champs et relations demandés pour les listes de comptes bancaires.
 * Identiques au web (`apps/web/src/modules/accounts/services/account.service.ts`)
 * afin que les deux applications affichent le même libellé de compte.
 */
export const bankAccountsListParams = {
  fields: ['label', 'accountNumber', 'rib', 'iban', 'currency', 'openingBalance', 'currentBalance', 'isActive'],
  populate: {
    bank: {
      fields: ['code', 'name'],
    },
    client: {
      fields: ['code', 'fullName', 'companyName'],
    },
  },
} as const;

export const accountService = {
  ...createCrudService<BankAccount>('/bank-accounts'),

  async list(params?: Record<string, unknown>): Promise<BankAccount[]> {
    const { data } = await api.get('/bank-accounts', {
      params: {
        ...bankAccountsListParams,
        ...(params ?? {}),
      },
    });

    return unwrapCollection<BankAccount>(data);
  },

  /** Comptes bancaires rattachés à un client — alimente le sélecteur du formulaire de paiement. */
  async listByClient(clientId?: number | null): Promise<BankAccount[]> {
    if (!clientId) {
      return [];
    }

    return this.list({
      filters: { client: { id: { $eq: Number(clientId) } } },
    });
  },
};
