import { createCrudService } from '@/services/api/crud';
import { Client } from '@/types/domain';

export const clientService = createCrudService<Client>('/clients');

