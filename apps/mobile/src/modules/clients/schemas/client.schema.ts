import { z } from 'zod';
import { isValidClientIdentityNumber, normalizeClientIdentityNumber } from '../utils/identityNumber';
import { isValidClientTaxNumber, normalizeClientTaxNumber } from '../utils/taxNumber';

const optionalText = z.string().trim().optional().default('');

export const clientSchema = z.object({
  code: optionalText,
  type: z.enum(['INDIVIDUAL', 'COMPANY'], { required_error: 'Le type est requis' }),
  fullName: z.string().trim().min(1, 'Le nom complet est requis'),
  companyName: optionalText,
  phone: z
    .string({ required_error: 'Le téléphone est obligatoire' })
    .min(1, 'Le téléphone est obligatoire')
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'Le numéro doit contenir 8 chiffres')),
  email: z
    .union([z.string().trim().email('Adresse email invalide'), z.literal('')])
    .optional()
    .default(''),
  address: optionalText,
  identityNumber: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeClientIdentityNumber(v))
    .refine(
      (v) => v === '' || isValidClientIdentityNumber(v),
      'Le numéro identifiant doit contenir exactement 8 chiffres',
    ),
  taxNumber: z
    .string()
    .optional()
    .default('')
    .transform((v) => normalizeClientTaxNumber(v))
    .refine(
      (v) => v === '' || isValidClientTaxNumber(v),
      'Le matricule fiscal doit respecter le format 1234567A B000',
    ),
  notes: optionalText,
  isActive: z.boolean().default(true),
  accountIds: z.array(z.number()).default([]),
}).refine(
  (values) => values.type !== 'COMPANY' || (values.companyName && values.companyName.length > 0),
  { message: 'La raison sociale est requise pour une société', path: ['companyName'] },
);

export type ClientFormValues = z.infer<typeof clientSchema>;

