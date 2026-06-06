import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';

export const useDashboard = (selectedWeekStart?: Date) =>
  useQuery({
    queryKey: ['dashboard-summary', selectedWeekStart ? format(selectedWeekStart, 'yyyy-MM-dd') : 'current-week'],
    queryFn: () => dashboardService.getSummary(selectedWeekStart)
  });

