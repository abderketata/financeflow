import { z } from 'zod';

export const settingsSchema = z.object({
  companyName: z.string().min(1, 'Le nom de la société est requis'),
  currency: z.string().min(1, 'La devise est requise'),
  alertDaysBefore: z.coerce.number().min(0, 'Minimum 0 jour').max(30, 'Maximum 30 jours'),
  weekStartsOn: z.coerce.number().min(0).max(1),
  locale: z.string().optional().default('fr-FR'),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

