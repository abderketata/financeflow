import { createCrudService } from '@/services/api/crud';
import { Transaction } from '@/types';

export const transactionService = createCrudService<Transaction>('/transactions');

