import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  code: z.string().optional(),
  phone: z
    .string({ required_error: 'Le téléphone est obligatoire' })
    .min(1, 'Le téléphone est obligatoire')
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'Le numéro doit contenir 8 chiffres')),
  email: z
    .union([
      z.string().trim().email('Adresse email invalide'),
      z.literal(''),
    ])
    .optional()
    .transform((value) => value?.trim() ?? ''),
  address: z.string().optional(),
  notes: z.string().optional()
});

export type ClientFormValues = z.infer<typeof clientSchema>;

