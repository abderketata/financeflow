import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { Box, Card, CardContent, Divider, Stack, Typography, alpha } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartPoint } from '@/types/domain';
import { brandColors, headingFont, iconBox, numericFont } from '@/app/theme';

const CustomTooltip = ({ active, payload, label, currency = 'TND' }: any) => {
  if (!active || !payload?.length) return null;
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
        {label}
      </Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '3px', backgroundColor: entry.color }} />
          <Typography sx={{ fontSize: '0.78rem', color: brandColors.slate[500] }}>
            {entry.name}:{' '}
            <Box component="span" sx={{ fontFamily: numericFont, fontWeight: 600, color: brandColors.slate[800] }}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(entry.value)}
            </Box>
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

export function WeeklyOperationsChart({ data, currency = 'TND' }: { data: ChartPoint[]; currency?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: '24px !important' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={iconBox(brandColors.blue[600], 38)}>
            <BarChartRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', color: brandColors.slate[800] }}>
              Opérations de la semaine
            </Typography>
            <Typography variant="caption" sx={{ color: brandColors.slate[400] }}>
              Comparatif crédits vs débits hebdomadaire
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 2.5, borderColor: alpha(brandColors.slate[200], 0.6) }} />

        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={6}>
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
              tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: alpha(brandColors.slate[200], 0.3) }} />
            <Legend
              wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 14, color: brandColors.slate[600] }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="credit"
              name="Crédits"
              fill={brandColors.credit}
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="debit"
              name="Débits"
              fill={brandColors.debit}
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
