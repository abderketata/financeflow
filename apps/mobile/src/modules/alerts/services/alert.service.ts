import { createCrudService } from '@/services/api/crud';
import { AlertItem } from '@/types';

export const alertService = createCrudService<AlertItem>('/alerts');

