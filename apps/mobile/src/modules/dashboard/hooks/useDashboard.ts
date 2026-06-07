import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';

export const useDashboard = () => {
  const year = new Date().getFullYear();

  const query = useQuery({
	queryKey: ['mobile-dashboard-dataset', year],
	staleTime: 60_000,
	placeholderData: keepPreviousData,
	queryFn: ({ signal }) => dashboardService.getDataset(year, { signal }),
  });

  const data = useMemo(
	() => (query.data ? dashboardService.buildSummary(query.data) : undefined),
	[query.data],
  );

  return {
	...query,
	data,
  };
};

