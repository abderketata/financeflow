import { z } from 'zod';
import {
  isValidAccountNumber,
  isValidIban,
  isValidRib,
  normalizeAccountNumber,
  normalizeIban,
  normalizeRib,
} from '@/modules/accounts/utils/accountFields';

export const accountSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  accountNumber: z
    .string()
    .min(1, 'Le numéro de compte est requis')
    .transform((value) => normalizeAccountNumber(value))
    .refine((value) => isValidAccountNumber(value), 'Le numéro de compte doit contenir entre 8 et 34 chiffres'),
  rib: z
    .string()
    .optional()
    .default('')
    .transform((value) => normalizeRib(value))
    .refine((value) => isValidRib(value), 'RIB invalide : il doit contenir exactement 8 chiffres'),
  iban: z
    .string()
    .optional()
    .default('')
    .transform((value) => normalizeIban(value))
    .refine((value) => isValidIban(value), 'IBAN tunisien invalide : il doit contenir 24 caractères'),
  balance: z.coerce.number().optional(),
  currency: z.string().default('TND'),
  bank: z.coerce.number().optional(),
  client: z.coerce.number().optional()
});

export type AccountFormValues = z.infer<typeof accountSchema>;

