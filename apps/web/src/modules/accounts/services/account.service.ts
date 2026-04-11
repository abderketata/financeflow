import { createCrudService } from '@/services/api/crud';
import { api } from '@/services/api/client';
import { unwrapCollection } from '@/utils/strapi';
import { BankAccount } from '@/types/domain';

export const accountService = {
  ...createCrudService<BankAccount>('/bank-accounts'),

  /**
   * Récupère les comptes bancaires sélectionnables pour un formulaire client :
   *  - Mode ajout  (pas de clientId) : comptes sans client associé uniquement
   *  - Mode édition (clientId fourni) : comptes sans client OU déjà liés au client courant
   */
  async listAvailable(clientId?: number): Promise<BankAccount[]> {
    const params: Record<string, unknown> = { populate: '*' };

    if (clientId) {
      // Comptes sans client OU liés au client courant
      params['filters'] = {
        $or: [
          { client: { id: { $null: true } } },
          { client: { id: { $eq: clientId } } },
        ],
      };
    } else {
      // Comptes sans client uniquement
      params['filters'] = {
        client: { id: { $null: true } },
      };
    }

    const { data } = await api.get('/bank-accounts', { params });
    return unwrapCollection<BankAccount>(data);
  },
};

