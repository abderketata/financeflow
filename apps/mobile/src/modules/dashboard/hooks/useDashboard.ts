import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';

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
