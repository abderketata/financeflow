import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MONTHLY_WINDOW_SHIFT, dashboardService } from '@/modules/dashboard/services/dashboard.service';

/**
 * @param selectedWeekDate semaine à afficher dans le graphique hebdomadaire et
 *   la liste des échéances. Le jeu de données couvre l'année entière : changer
 *   de semaine ne déclenche donc aucune requête, seul le résumé est recalculé.
 */
export const useDashboard = (selectedWeekDate?: Date) => {
  const year = (selectedWeekDate ?? new Date()).getFullYear();
  // Clé stable : la date exacte changerait à chaque render et invaliderait le memo.
  const weekKey = selectedWeekDate ? selectedWeekDate.toISOString().slice(0, 10) : '';

  const query = useQuery({
    queryKey: ['mobile-dashboard-dataset', year],
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => dashboardService.getDataset(year, { signal }),
  });

  const data = useMemo(
    () =>
      query.data
        ? dashboardService.buildSummary(query.data, weekKey ? new Date(weekKey) : new Date())
        : undefined,
    [query.data, weekKey],
  );

  return {
    ...query,
    data,
  };
};

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Fenêtre de 12 mois d'un graphique mensuel, décalable de `MONTHLY_WINDOW_SHIFT`
 * mois vers le passé ou le futur (en traversant les années) — même règle que le web.
 *
 * La clé reste sous le préfixe `mobile-dashboard-dataset` pour être invalidée
 * et relancée avec le reste du tableau de bord (écriture sur un effet, clic sur
 * l'onglet). Pendant le chargement d'une nouvelle fenêtre, l'ancienne reste
 * affichée (`isPlaceholderData`) : le graphique est construit sur la fenêtre
 * réellement chargée, jamais sur celle demandée.
 */
export const useMonthlyWindow = (initialWindowStart: Date) => {
  const [windowStart, setWindowStart] = useState(
    () => new Date(initialWindowStart.getFullYear(), initialWindowStart.getMonth(), 1),
  );

  const query = useQuery({
    queryKey: ['mobile-dashboard-dataset', 'monthly-window', toMonthKey(windowStart)],
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => dashboardService.getMonthlyWindow(windowStart, { signal }),
  });

  const data = useMemo(
    () => (query.data ? dashboardService.buildMonthlyChart(query.data) : undefined),
    [query.data],
  );

  const shift = (count: number) =>
    setWindowStart((value) => new Date(value.getFullYear(), value.getMonth() + count, 1));

  return {
    ...query,
    data,
    label: dashboardService.getMonthlyWindowLabel(windowStart),
    showPrevious: () => shift(-MONTHLY_WINDOW_SHIFT),
    showNext: () => shift(MONTHLY_WINDOW_SHIFT),
  };
};
