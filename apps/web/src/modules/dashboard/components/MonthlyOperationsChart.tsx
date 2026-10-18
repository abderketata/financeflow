import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import { Box, Card, CardContent, Divider, Stack, Typography, alpha } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartPoint } from '@/types/domain';
import { buildChartAmountScale, formatCompactAmount } from '@/utils/chartScale';
import { brandColors, headingFont, iconBox, numericFont } from '@/app/theme';
import { ChartStatusOverlay } from '@/modules/dashboard/components/MonthWindowNavigator';

const formatTooltipAmount = (value: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value ?? 0));

type BreakdownRow = {
  label: string;
  value: number;
  color: string;
  strong?: boolean;
  muted?: boolean;
};

const TooltipSide = ({
  title,
  accent,
  rows,
  currency,
}: {
  title: string;
  accent: string;
  rows: BreakdownRow[];
  currency: string;
}) => (
  <Box sx={{ minWidth: 208 }}>
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.6 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accent }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>
        {title}
      </Typography>
    </Stack>
    {rows.map((row) => (
      <Stack
        key={row.label}
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ pl: 1.8, mb: 0.15 }}
      >
        <Typography sx={{ fontSize: '0.74rem', color: row.muted ? brandColors.slate[400] : brandColors.slate[500] }}>
          {row.label}
        </Typography>
        <Typography
          sx={{
            fontFamily: numericFont,
            fontSize: '0.74rem',
            fontWeight: row.strong ? 700 : 600,
            color: row.color,
            whiteSpace: 'nowrap',
          }}
        >
          {formatTooltipAmount(row.value, currency)}
        </Typography>
      </Stack>
    ))}
  </Box>
);

const CustomTooltip = ({ active, payload, label, currency = 'TND' }: any) => {
  if (!active || !payload?.length) return null;

  const point = (payload[0]?.payload ?? {}) as ChartPoint;
  const tooltipLabel = point.tooltipLabel ?? label;

  const creditPaid = point.creditPaid ?? 0;
  const creditPending = point.creditPending ?? 0;
  const creditOverdue = point.creditOverdue ?? 0;
  const creditCancelled = point.creditCancelled ?? 0;
  const creditRemaining = Math.max(point.credit - creditPaid, 0);

  const debitPaid = point.debitPaid ?? 0;
  const debitPending = point.debitPending ?? 0;
  const debitOverdue = point.debitOverdue ?? 0;
  const debitCancelled = point.debitCancelled ?? 0;
  const debitRemaining = Math.max(point.debit - debitPaid, 0);

  const hasCredit = point.credit > 0 || creditCancelled > 0;
  const hasDebit = point.debit > 0 || debitCancelled > 0;

  const creditRows: BreakdownRow[] = [
    { label: 'Attendu', value: point.credit, color: brandColors.slate[800], strong: true },
    { label: 'Encaissé', value: creditPaid, color: brandColors.credit, strong: true },
    ...(creditPending > 0 ? [{ label: 'Déposé (à échoir)', value: creditPending, color: brandColors.slate[600] }] : []),
    ...(creditOverdue > 0 ? [{ label: 'En retard', value: creditOverdue, color: brandColors.debit }] : []),
    ...(creditRemaining > 0 ? [{ label: 'Reste à encaisser', value: creditRemaining, color: brandColors.warning, strong: true }] : []),
    ...(creditCancelled > 0 ? [{ label: 'Annulé (hors total)', value: creditCancelled, color: brandColors.slate[400], muted: true }] : []),
  ];

  const debitRows: BreakdownRow[] = [
    { label: 'Attendu', value: point.debit, color: brandColors.slate[800], strong: true },
    { label: 'Payé', value: debitPaid, color: brandColors.debit, strong: true },
    ...(debitPending > 0 ? [{ label: 'Déposé (à échoir)', value: debitPending, color: brandColors.slate[600] }] : []),
    ...(debitOverdue > 0 ? [{ label: 'En retard', value: debitOverdue, color: brandColors.debit }] : []),
    ...(debitRemaining > 0 ? [{ label: 'Reste à payer', value: debitRemaining, color: brandColors.warning, strong: true }] : []),
    ...(debitCancelled > 0 ? [{ label: 'Annulé (hors total)', value: debitCancelled, color: brandColors.slate[400], muted: true }] : []),
  ];

  return (
    <Box
      sx={{
        background: '#FFFFFF',
        border: `1px solid ${brandColors.slate[200]}`,
        borderRadius: '10px',
        p: 1.8,
        boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
      }}
    >
      <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.82rem', color: brandColors.slate[800], mb: 1 }}>
        {tooltipLabel}
      </Typography>

      {!hasCredit && !hasDebit ? (
        <Typography sx={{ fontSize: '0.75rem', color: brandColors.slate[400] }}>Aucune opération</Typography>
      ) : null}

      {hasCredit ? <TooltipSide title="CRÉDITS" accent={brandColors.credit} rows={creditRows} currency={currency} /> : null}

      {hasCredit && hasDebit ? <Divider sx={{ my: 1, borderColor: alpha(brandColors.slate[200], 0.8) }} /> : null}

      {hasDebit ? <TooltipSide title="DÉBITS" accent={brandColors.debit} rows={debitRows} currency={currency} /> : null}
    </Box>
  );
};

export function MonthlyOperationsChart({
  data,
  currency = 'TND',
  headerAction,
  loading = false,
  onRetry,
}: {
  data: ChartPoint[];
  currency?: string;
  headerAction?: ReactNode;
  loading?: boolean;
  /** Fourni uniquement quand le chargement a échoué : affiche le message de relance. */
  onRetry?: () => void;
}) {
  // Échelle Y calculée sur les totaux attendus : les séries « réalisé » leur sont
  // toujours inférieures ou égales, elles restent donc dans le cadre.
  const yScale = useMemo(() => buildChartAmountScale(data, ['credit', 'debit']), [data]);

  return (
    <Card>
      <CardContent sx={{ p: '24px !important' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={iconBox(brandColors.blue[600], 38)}>
              <ShowChartRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '0.95rem', color: brandColors.slate[800] }}>
                Vue mensuelle
              </Typography>
              <Typography variant="caption" sx={{ color: brandColors.slate[400] }}>
                Montants attendus (trait plein) et réellement réglés (pointillés) — l'écart reste à encaisser
              </Typography>
            </Box>
          </Stack>
          {headerAction}
        </Stack>
        <Divider sx={{ mb: 2.5, borderColor: alpha(brandColors.slate[200], 0.6) }} />

        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="creditAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brandColors.credit} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={brandColors.credit} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="debitAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brandColors.debit} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={brandColors.debit} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={brandColors.slate[200]} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: brandColors.slate[400], fontWeight: 500 }}
                axisLine={{ stroke: brandColors.slate[200] }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: brandColors.slate[400], fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={60}
                domain={[yScale.min, yScale.max]}
                ticks={yScale.ticks}
                allowDataOverflow={false}
                tickFormatter={formatCompactAmount}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 14, color: brandColors.slate[600] }}
                iconSize={10}
              />
              <Area
                dataKey="credit"
                name="Crédits attendus"
                stroke={brandColors.credit}
                strokeWidth={2}
                fill="url(#creditAreaFill)"
                legendType="circle"
                dot={{ r: 3, fill: brandColors.credit, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, fill: brandColors.credit, strokeWidth: 2, stroke: '#fff' }}
              />
              <Area
                dataKey="debit"
                name="Débits attendus"
                stroke={brandColors.debit}
                strokeWidth={2}
                fill="url(#debitAreaFill)"
                legendType="circle"
                dot={{ r: 3, fill: brandColors.debit, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, fill: brandColors.debit, strokeWidth: 2, stroke: '#fff' }}
              />
              <Line
                dataKey="creditPaid"
                name="Crédits encaissés"
                stroke={brandColors.credit}
                strokeWidth={2}
                strokeDasharray="5 4"
                legendType="plainline"
                dot={{ r: 2.5, fill: '#fff', strokeWidth: 2, stroke: brandColors.credit }}
                activeDot={{ r: 4.5, fill: '#fff', strokeWidth: 2, stroke: brandColors.credit }}
              />
              <Line
                dataKey="debitPaid"
                name="Débits payés"
                stroke={brandColors.debit}
                strokeWidth={2}
                strokeDasharray="5 4"
                legendType="plainline"
                dot={{ r: 2.5, fill: '#fff', strokeWidth: 2, stroke: brandColors.debit }}
                activeDot={{ r: 4.5, fill: '#fff', strokeWidth: 2, stroke: brandColors.debit }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <ChartStatusOverlay loading={loading} onRetry={onRetry} />
        </Box>
      </CardContent>
    </Card>
  );
}
