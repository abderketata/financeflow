import { z } from 'zod';

export const transactionSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  operationType: z.enum(['DEBIT', 'CREDIT']),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  operationDate: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
  client: z.coerce.number().optional(),
  bankAccount: z.coerce.number().optional(),
  paymentItem: z.coerce.number().optional()
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

