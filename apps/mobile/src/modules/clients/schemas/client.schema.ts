import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  code: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Email invalide'), z.literal('')]).optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export type ClientFormValues = z.infer<typeof clientSchema>;

