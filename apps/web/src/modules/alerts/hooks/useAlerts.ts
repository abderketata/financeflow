import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/types/domain';
import { alertService } from '@/modules/alerts/services/alert.service';

const queryKey = ['alerts'];

export const useAlerts = () =>
  useQuery({
    queryKey,
    queryFn: () => alertService.list({ populate: '*' })
  });

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Alert> }) => alertService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
};

