import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { Box, Card, CardContent, Divider, Stack, Typography, alpha } from '@mui/material';
import {
  Bar,
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
import { brandColors, headingFont, iconBox, numericFont } from '@/app/theme';

const CustomTooltip = ({ active, payload, label, currency = 'TND' }: any) => {
  if (!active || !payload?.length) return null;

  const tooltipLabel = payload[0]?.payload?.tooltipLabel ?? label;

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
      <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.82rem', color: brandColors.slate[800], mb: 0.8 }}>
        {tooltipLabel}
      </Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
          <Typography sx={{ fontSize: '0.78rem', color: brandColors.slate[500] }}>
            {entry.name}:{' '}
            <Box component="span" sx={{ fontFamily: numericFont, fontWeight: 600, color: brandColors.slate[800] }}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(entry.value ?? 0))}
            </Box>
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

export function MonthlyCreditDebitComparisonChart({
  data,
  currency = 'TND',
}: {
  data: ChartPoint[];
  currency?: string;
}) {
  const totalCredits = data.reduce((sum, point) => sum + Number(point.credit ?? 0), 0);
  const totalDebits = data.reduce((sum, point) => sum + Number(point.debit ?? 0), 0);

  return (
    <Card>
      <CardContent sx={{ p: '24px !important' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={iconBox(brandColors.blue[600], 38)}>
              <InsightsRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '0.95rem', color: brandColors.slate[800] }}>
                Comparatif mensuel crédits / débits
              </Typography>
              <Typography variant="caption" sx={{ color: brandColors.slate[400] }}>
                Deux courbes distinctes pour comparer les flux mois par mois sur l&apos;année
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: brandColors.credit }} />
              <Typography variant="caption" sx={{ color: brandColors.slate[500] }}>
                Crédits (colonnes) {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(totalCredits)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: brandColors.debit }} />
              <Typography variant="caption" sx={{ color: brandColors.slate[500] }}>
                Débits (ligne) {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(totalDebits)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2.5, borderColor: alpha(brandColors.slate[200], 0.6) }} />

        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
              tickFormatter={(value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(Number(value ?? 0))}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 14, color: brandColors.slate[600] }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="credit"
              name="Crédits"
              fill={alpha(brandColors.credit, 0.8)}
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="debit"
              name="Débits"
              stroke={brandColors.debit}
              strokeWidth={3}
              dot={{ r: 3, fill: brandColors.debit, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 5, fill: brandColors.debit, strokeWidth: 2, stroke: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

