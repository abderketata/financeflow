import { z } from 'zod';

export const paymentItemSchema = z.object({
  reference: z.string().min(2, 'Référence requise'),
  type: z.enum(['CHEQUE', 'TRAITE']),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('Montant invalide'),
  status: z.string().min(2, 'Statut requis'),
  dueDate: z.string().min(1, 'Date requise')
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;

