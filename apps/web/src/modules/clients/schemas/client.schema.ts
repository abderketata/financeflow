import { z } from 'zod';

const optionalText = z.string().trim().optional().default('');

export const clientSchema = z.object({
  code: optionalText,
  type: z.enum(['INDIVIDUAL', 'COMPANY'], { required_error: 'Le type est requis' }),
  fullName: z.string().trim().min(1, 'Le nom complet est requis'),
  companyName: optionalText,
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
    .default(''),
  address: optionalText,
  identityNumber: optionalText,
  taxNumber: optionalText,
  notes: optionalText,
  isActive: z.boolean().default(true),
  accountIds: z.array(z.number()).default([]),
}).refine(
  (values) => values.type !== 'COMPANY' || (values.companyName && values.companyName.length > 0),
  {
    message: 'La raison sociale est requise pour une société',
    path: ['companyName'],
  },
);

export type ClientFormValues = z.infer<typeof clientSchema>;
