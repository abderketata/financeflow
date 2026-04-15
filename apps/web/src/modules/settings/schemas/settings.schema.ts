import { z } from 'zod';

export const settingsSchema = z.object({
  companyName: z.string().min(1, 'Le nom de la société est requis'),
  currency: z.string().min(1, 'La devise est requise'),
  defaultAlertDays: z.coerce.number().min(0, 'Minimum 0 jour').max(30, 'Maximum 30 jours'),
  weekStartsOn: z.enum(['MONDAY', 'SUNDAY']),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

