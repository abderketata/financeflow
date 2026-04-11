import { createCrudService } from '@/services/api/crud';
import { Bank } from '@/types/domain';

export const bankService = createCrudService<Bank>('/banks');

