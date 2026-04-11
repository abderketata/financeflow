import { z } from 'zod';

export const accountSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  accountNumber: z.string().min(4, 'Le numéro de compte est requis'),
  rib: z.string().optional(),
  iban: z.string().optional(),
  balance: z.coerce.number().optional(),
  currency: z.string().default('TND'),
  bank: z.coerce.number().optional(),
  client: z.coerce.number().optional()
});

export type AccountFormValues = z.infer<typeof accountSchema>;

