import { z } from 'zod';

export const paymentItemSchema = z.object({
  reference: z.string().min(2, 'La référence est requise'),
  type: z.enum(['CHEQUE', 'TRAITE']),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  status: z.string().min(2, 'Le statut est requis'),
  dueDate: z.string().min(1, 'La date d\'échéance est requise'),
  issueDate: z.string().optional(),
  notes: z.string().optional(),
  client: z.coerce.number().optional(),
  bankAccount: z.coerce.number().optional()
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;

