import { createCrudService } from '@/services/api/crud';
import { Client } from '@/types';

export const clientService = createCrudService<Client>('/clients');

