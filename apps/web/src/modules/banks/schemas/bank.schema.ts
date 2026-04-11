import { z } from 'zod';

export const bankSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  code: z.string().optional(),
  swiftCode: z.string().optional(),
  notes: z.string().optional()
});

export type BankFormValues = z.infer<typeof bankSchema>;

