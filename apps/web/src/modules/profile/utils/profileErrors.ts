import { getStrapiValidationIssues } from '@/utils/strapi';

/**
 * L'intercepteur Axios rejette avec le corps d'erreur Strapi
 * (`{ error: { status, message, details } }`) et non l'erreur Axios brute.
 */
export const getProfileErrorMessage = (error: unknown, fallback: string) => {
  const value = error as {
    message?: string;
    status?: number;
    error?: { message?: string; status?: number; details?: unknown };
  } | null;

  const status = value?.error?.status ?? value?.status;
  const issue = getStrapiValidationIssues(value?.error)[0];
  const message = issue?.message ?? value?.error?.message ?? value?.message;

  if (status === 403) {
    return "Modification refusée par le serveur : le rôle de cet utilisateur n'a pas la permission « update » sur les utilisateurs.";
  }

  if (message) {
    return message;
  }

  if (status) {
    return `${fallback} (erreur ${status}).`;
  }

  return fallback;
};
