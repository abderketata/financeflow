import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';

export const useDashboard = () => useQuery({ queryKey: ['mobile-dashboard'], queryFn: () => dashboardService.getSummary() });

