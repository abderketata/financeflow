import { z } from 'zod';

const optionalText = z.string().optional().or(z.literal('')).transform((value) => value?.trim() ?? '');

export const clientSchema = z.object({
  code: optionalText,
  type: z.enum(['INDIVIDUAL', 'COMPANY'], { required_error: 'Le type est requis' }),
  fullName: optionalText,
  companyName: optionalText,
  phone: z.string().trim().regex(/^\d{8}$/, 'Le numéro de téléphone doit contenir exactement 8 chiffres'),
  email: z.union([z.string().trim().email('Adresse email invalide'), z.literal('')]).optional().transform((value) => value ?? ''),
  address: optionalText,
  identityNumber: optionalText,
  taxNumber: optionalText,
  notes: optionalText,
  isActive: z.boolean().default(true),
  accountIds: z.array(z.number()).default([]),
}).superRefine((values, ctx) => {
  if (!values.fullName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fullName'],
      message: 'Le nom complet est requis',
    });
  }

  if (values.type === 'COMPANY' && !values.companyName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['companyName'],
      message: 'La raison sociale est requise pour une société',
    });
  }
});

export type ClientFormValues = z.infer<typeof clientSchema>;
