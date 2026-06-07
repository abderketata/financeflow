import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';

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

