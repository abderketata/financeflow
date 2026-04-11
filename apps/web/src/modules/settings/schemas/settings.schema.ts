import { z } from 'zod';

export const settingsSchema = z.object({
  currency: z.string().min(1, 'La devise est requise'),
  alertDaysBefore: z.coerce.number().min(0).max(30),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  locale: z.string().min(2, 'La locale est requise')
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

