import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentItem } from '@/types';
import { paymentItemService } from '../services/paymentItem.service';

const QUERY_KEY = ['payment-items'] as const;

/** Taille d'une page chargée au défilement. Strapi plafonne `pageSize` à 100. */
const INFINITE_PAGE_SIZE = 25;

export interface PaymentItemTotals {
  totalCredits: number;
  totalDebits: number;
  balance: number;
}

const buildPaymentItemTotals = (items: PaymentItem[]): PaymentItemTotals => {
  const totalCredits = items.reduce(
    (sum, item) => sum + (item.direction === 'IN' ? Number(item.amount ?? 0) || 0 : 0),
    0,
  );
  const totalDebits = items.reduce(
    (sum, item) => sum + (item.direction === 'OUT' ? Number(item.amount ?? 0) || 0 : 0),
    0,
  );

  return { totalCredits, totalDebits, balance: totalCredits - totalDebits };
};

/**
 * Liste paginée côté serveur, chargée par pages successives au défilement.
 *
 * Remplace l'ancien `usePaymentItems()` sans pagination : Strapi renvoie 25
 * éléments par défaut, si bien que l'écran n'en voyait jamais davantage et que
 * la recherche ne portait que sur ces 25 — un compte à 136 effets en affichait
 * 25. Comme sur le web, filtres et recherche partent maintenant au serveur.
 */
export const usePaymentItemsInfinite = (params?: Record<string, unknown>) =>
  useInfiniteQuery({
    queryKey: [...QUERY_KEY, 'infinite', params ?? null],
    initialPageParam: 1,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      paymentItemService.listActivePage(
        {
          populate: '*',
          sort: ['id:desc'],
          ...(params ?? {}),
          pagination: { page: pageParam, pageSize: INFINITE_PAGE_SIZE, withCount: true },
        },
        { signal },
      ),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pageCount ? lastPage.pagination.page + 1 : undefined,
  });

/**
 * Totaux crédits / débits / solde sur l'intégralité des éléments filtrés,
 * toutes pages confondues — pas seulement sur la page affichée.
 */
export const usePaymentItemsTotals = (params?: Record<string, unknown>) =>
  useQuery<PaymentItemTotals>({
    queryKey: [...QUERY_KEY, 'totals', params ?? null],
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const items = await paymentItemService.listAllActive(
        { fields: ['amount', 'direction'], ...(params ?? {}), sort: ['id:desc'] },
        { signal },
      );

      return buildPaymentItemTotals(items);
    },
  });

/**
 * Détail complet d'un effet, chargé à la demande.
 *
 * Le tableau de bord ne demande qu'un sous-ensemble de champs (`fields`) :
 * client, compte, tireur/tiré et notes doivent être relus par id pour être
 * affichés dans la fiche de détail.
 */
export const usePaymentItemDetails = (id?: number | null, enabled = true) =>
  useQuery<PaymentItem | null>({
    queryKey: [...QUERY_KEY, 'details', id],
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    queryFn: () => paymentItemService.get(Number(id), { populate: '*' }),
  });

/**
 * Détail complet avec pièces jointes — sert de source au formulaire d'édition.
 * Le web fait la même requête (`getWithAttachments`) avant d'ouvrir le formulaire :
 * la liste ne renvoie pas les fichiers liés.
 */
export const usePaymentItemWithAttachments = (id?: number | null, enabled = true) =>
  useQuery<PaymentItem | null>({
    queryKey: [...QUERY_KEY, 'detail-with-attachments', id],
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    queryFn: () => paymentItemService.getWithAttachments(Number(id)),
  });

export const useCreatePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PaymentItem>) => paymentItemService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdatePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentItem> }) => paymentItemService.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: QUERY_KEY }),
        qc.invalidateQueries({ queryKey: ['mobile-alerts'] }),
        qc.invalidateQueries({ queryKey: ['mobile-dashboard-dataset'] }),
      ]);
    },
  });
};

/** Soft delete — identique au Web : positionne supprimer = true */
export const useSoftDeletePaymentItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentItemService.update(id, { supprimer: true } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
