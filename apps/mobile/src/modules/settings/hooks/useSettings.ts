import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/modules/settings/services/settings.service';

export const useSettings = () => useQuery({ queryKey: ['mobile-settings'], queryFn: () => settingsService.get() });

