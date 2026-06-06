export const formatCurrency = (value?: number, currency = 'TND') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(Number(value ?? 0));

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

export const normalizeText = (value?: string | null) => (value ?? '').toLowerCase().trim();

