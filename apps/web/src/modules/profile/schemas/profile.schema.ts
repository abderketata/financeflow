import { z } from 'zod';

export const profileEmailSchema = z.object({
  email: z
    .string({ required_error: "L'adresse email est obligatoire" })
    .trim()
    .min(1, "L'adresse email est obligatoire")
    .email('Adresse email invalide'),
});

export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire'),
    password: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
    passwordConfirmation: z.string().min(1, 'La confirmation est obligatoire'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Les deux mots de passe ne correspondent pas',
    path: ['passwordConfirmation'],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: 'Le nouveau mot de passe doit différer de l’actuel',
    path: ['password'],
  });

export type ProfileEmailFormValues = z.infer<typeof profileEmailSchema>;
export type ProfilePasswordFormValues = z.infer<typeof profilePasswordSchema>;
