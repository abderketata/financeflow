import { createCrudService } from '@/services/api/crud';
import { Alert } from '@/types/domain';

export const alertService = createCrudService<Alert>('/alerts');

