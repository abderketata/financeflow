import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppSetting } from '@/types';
import { settingsService } from '../services/settings.service';

const QUERY_KEY = ['settings'] as const;

export const useSettings = () =>
  useQuery({ queryKey: QUERY_KEY, queryFn: () => settingsService.get() });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AppSetting>) => settingsService.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

