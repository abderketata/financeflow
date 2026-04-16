import { z } from 'zod';

export const paymentItemSchema = z.object({
  type: z.enum(['CHEQUE', 'TRAITE', 'AUTRE']),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number({ required_error: 'Le montant est requis' }).positive('Le montant doit être supérieur à 0'),
  currency: z.string().trim().min(1, 'La devise est requise'),
  status: z.enum(['Reçu', 'Déposé', 'Payé', 'Rejeté', 'Annulé', 'En retard']),
  issueDate: z.string().optional(),
  dueDate: z.string().trim().min(1, "L'échéance est requise"),
  drawer: z.string().optional(),
  drawee: z.string().optional(),
  alertEnabled: z.boolean().default(true),
  alertDaysBefore: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['ESPECES', 'VIREMENT', 'CARTE']).optional().nullable(),
  notes: z.string().optional(),
  client: z.coerce.number({ required_error: 'Le client est requis', invalid_type_error: 'Le client est requis' }).min(1, 'Le client est requis'),
  account: z.coerce.number({ required_error: 'Le compte est requis', invalid_type_error: 'Le compte est requis' }).min(1, 'Le compte est requis'),
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;
