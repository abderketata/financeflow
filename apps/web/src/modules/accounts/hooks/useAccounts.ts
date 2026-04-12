import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BankAccount } from '@/types/domain';
import { accountService } from '@/modules/accounts/services/account.service';

const queryKey = ['accounts'];

export const useAccounts = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey,
    enabled: options?.enabled,
    queryFn: () => accountService.list()
  });

/**
 * Récupère les comptes sélectionnables pour un formulaire client :
 *  - Sans clientId : comptes sans client
 *  - Avec clientId : comptes sans client + comptes du client courant
 */
export const useAvailableAccounts = (clientId?: number | null) =>
  useQuery({
    queryKey: ['accounts', 'available', clientId ?? null],
    queryFn: () => accountService.listAvailable(clientId ?? undefined),
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BankAccount>) => accountService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate any available-accounts queries so the new account appears
      queryClient.invalidateQueries({ queryKey: ['accounts', 'available'] });
    }
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BankAccount> }) => accountService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'available'] });
    }
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'available'] });
    }
  });
};

