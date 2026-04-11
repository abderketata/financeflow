import { createCrudService } from '@/services/api/crud';
import { Transaction } from '@/types/domain';

export const transactionService = createCrudService<Transaction>('/transactions');

