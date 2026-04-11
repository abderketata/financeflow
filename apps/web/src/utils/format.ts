import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (value?: number, currency = 'TND') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(Number(value ?? 0));

export const formatDate = (value?: string | null, pattern = 'dd/MM/yyyy') => {
  if (!value) return '—';
  try {
    return format(new Date(value), pattern, { locale: fr });
  } catch {
    return value;
  }
};

export const normalizeText = (value?: string | null) => (value ?? '').toLowerCase().trim();

