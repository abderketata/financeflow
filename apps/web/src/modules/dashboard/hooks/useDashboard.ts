import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { addMonths, format, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';
import { MONTHLY_WINDOW_SHIFT, dashboardService } from '@/modules/dashboard/services/dashboard.service';

export const useDashboard = (selectedWeekStart?: Date) => {
  const referenceDate = selectedWeekStart ?? new Date();
  const year = referenceDate.getFullYear();

  const query = useQuery({
    queryKey: ['dashboard-dataset', year],
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => dashboardService.getDataset(year, { signal }),
  });

  const data = useMemo(
    () => (query.data ? dashboardService.buildSummary(query.data, referenceDate) : undefined),
    [query.data, referenceDate],
  );

  return {
    ...query,
    data,
  };
};

/**
 * Fenêtre de 12 mois d'un graphique mensuel, décalable de `MONTHLY_WINDOW_SHIFT`
 * mois vers le passé ou le futur (en traversant les années).
 *
 * La clé reste sous le préfixe `dashboard-dataset` pour être invalidée avec le
 * reste du tableau de bord après une écriture sur un effet. Pendant le
 * chargement d'une nouvelle fenêtre, l'ancienne reste affichée
 * (`isPlaceholderData`) : le graphique est construit sur la fenêtre réellement
 * chargée, jamais sur celle demandée.
 */
export const useMonthlyWindow = (initialWindowStart: Date) => {
  const [windowStart, setWindowStart] = useState(() => startOfMonth(initialWindowStart));
  const windowKey = format(windowStart, 'yyyy-MM');

  const query = useQuery({
    queryKey: ['dashboard-dataset', 'monthly-window', windowKey],
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => dashboardService.getMonthlyWindow(windowStart, { signal }),
  });

  const data = useMemo(
    () => (query.data ? dashboardService.buildMonthlyChart(query.data) : undefined),
    [query.data],
  );

  return {
    ...query,
    data,
    label: dashboardService.getMonthlyWindowLabel(windowStart),
    showPrevious: () => setWindowStart((value) => addMonths(value, -MONTHLY_WINDOW_SHIFT)),
    showNext: () => setWindowStart((value) => addMonths(value, MONTHLY_WINDOW_SHIFT)),
  };
};
