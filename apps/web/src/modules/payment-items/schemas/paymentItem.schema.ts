import { z } from 'zod';

export const paymentItemSchema = z.object({
  type: z.enum(['CHEQUE', 'TRAITE', 'AUTRE']),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  currency: z.string().trim().min(1, 'La devise est requise'),
  status: z.enum(['Reçu', 'Déposé', 'Payé', 'Rejeté', 'Annulé', 'En retard']),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  drawer: z.string().optional(),
  drawee: z.string().optional(),
  alertEnabled: z.boolean().default(true),
  alertDaysBefore: z.coerce.number().min(0, 'Valeur invalide').optional(),
  notes: z.string().optional(),
  client: z.coerce.number().optional(),
  account: z.coerce.number().optional()
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;

