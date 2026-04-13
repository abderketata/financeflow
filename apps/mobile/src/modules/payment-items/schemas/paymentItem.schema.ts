import { z } from 'zod';

export const paymentItemSchema = z.object({
  type: z.enum(['CHEQUE', 'TRAITE', 'AUTRE']),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('Montant invalide'),
  currency: z.string().trim().min(1, 'La devise est requise'),
  status: z.enum(['Reçu', 'Déposé', 'Payé', 'Rejeté', 'Annulé', 'En retard']),
  dueDate: z.string().optional(),
  issueDate: z.string().optional()
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;

