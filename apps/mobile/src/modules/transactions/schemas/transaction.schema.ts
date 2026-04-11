import { z } from 'zod';

export const transactionSchema = z.object({
  label: z.string().min(2, 'Libellé requis'),
  operationType: z.enum(['DEBIT', 'CREDIT']),
  amount: z.coerce.number().positive('Montant invalide'),
  operationDate: z.string().min(1, 'Date requise')
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

