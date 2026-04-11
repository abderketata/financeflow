import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppSetting } from '@/types/domain';
import { settingsService } from '@/modules/settings/services/settings.service';

const queryKey = ['settings'];

export const useSettings = () =>
  useQuery({
    queryKey,
    queryFn: () => settingsService.get()
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AppSetting>) => settingsService.update(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

