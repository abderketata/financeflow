import { Box, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';

/**
 * Mise en évidence du mois en cours dans les graphiques mensuels (recharts) :
 * bande de fond + étiquette « Mois en cours », libellé d'axe en gras, points
 * agrandis et pastille dans l'infobulle. Rien n'est affiché quand le mois en
 * cours est hors de la fenêtre affichée.
 */

export const CURRENT_MONTH_TAG = 'Mois en cours';
/** Marge haute des graphiques mensuels : laisse la place à l'étiquette au-dessus de la bande. */
export const MONTHLY_CHART_TOP_MARGIN = 28;

const TAG_WIDTH = 86;
const TAG_HEIGHT = 18;

type ChartLayoutProps = {
  /** Fournis par `<Customized>` : axes et zone de tracé du graphique. */
  xAxisMap?: Record<string, { scale?: any }>;
  offset?: { top: number; left: number; width: number; height: number };
  monthLabel?: string;
};

/** À passer à `<Customized component={...} />`, placé avant les séries pour rester en arrière-plan. */
export function CurrentMonthBand({ xAxisMap, offset, monthLabel }: ChartLayoutProps) {
  const scale = Object.values(xAxisMap ?? {})[0]?.scale;
  if (!scale || !offset || !monthLabel) return null;

  const start = scale(monthLabel);
  if (typeof start !== 'number' || Number.isNaN(start)) return null;

  // Axe « point » (courbes) : bandwidth = 0, le mois est centré sur `start`.
  // Axe « band » (colonnes) : le mois occupe [start, start + bandwidth].
  const bandwidth = typeof scale.bandwidth === 'function' ? scale.bandwidth() : 0;
  const step = typeof scale.step === 'function' ? scale.step() : 0;
  const center = start + bandwidth / 2;
  const width = Math.max(step, bandwidth, 24);

  const plotLeft = offset.left;
  const plotRight = offset.left + offset.width;
  const bandLeft = Math.max(center - width / 2, plotLeft);
  const bandRight = Math.min(center + width / 2, plotRight);
  const tagLeft = Math.min(Math.max(center - TAG_WIDTH / 2, plotLeft), plotRight - TAG_WIDTH);
  const tagTop = offset.top - TAG_HEIGHT - 6;

  return (
    <g pointerEvents="none">
      <rect
        x={bandLeft}
        y={offset.top}
        width={Math.max(bandRight - bandLeft, 0)}
        height={offset.height}
        rx={8}
        fill={alpha(brandColors.blue[500], 0.08)}
        stroke={alpha(brandColors.blue[500], 0.25)}
        strokeDasharray="4 4"
      />
      <rect x={tagLeft} y={tagTop} width={TAG_WIDTH} height={TAG_HEIGHT} rx={TAG_HEIGHT / 2} fill={brandColors.blue[600]} />
      <text
        x={tagLeft + TAG_WIDTH / 2}
        y={tagTop + TAG_HEIGHT / 2}
        dy="0.35em"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={10.5}
        fontWeight={700}
      >
        {CURRENT_MONTH_TAG}
      </text>
    </g>
  );
}

/** Libellé de l'axe X : le mois en cours est en gras, en bleu, souligné d'un point. */
export function MonthAxisTick({ x, y, payload, monthLabel }: any) {
  const isCurrent = Boolean(monthLabel) && payload?.value === monthLabel;

  return (
    <g>
      <text
        x={x}
        y={y}
        dy="0.71em"
        textAnchor="middle"
        fontSize={12}
        fontWeight={isCurrent ? 800 : 500}
        fill={isCurrent ? brandColors.blue[700] : brandColors.slate[400]}
      >
        {payload?.value}
      </text>
      {isCurrent ? <circle cx={x} cy={y + 18} r={2.5} fill={brandColors.blue[600]} /> : null}
    </g>
  );
}

/**
 * Point d'une série : plus gros sur le mois en cours.
 * `filled` = point plein (attendu), `hollow` = point creux (réalisé).
 */
export const renderMonthlyDot =
  (color: string, variant: 'filled' | 'hollow' = 'filled', radius = 3) =>
  ({ cx, cy, payload, index }: any) => {
    if (typeof cx !== 'number' || typeof cy !== 'number') return <g key={`dot-${index}`} />;

    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={payload?.isCurrentMonth ? radius + 2 : radius}
        fill={variant === 'filled' ? color : '#FFFFFF'}
        stroke={variant === 'filled' ? '#FFFFFF' : color}
        strokeWidth={2}
      />
    );
  };

/** Pastille affichée à côté du titre de l'infobulle pour le mois en cours. */
export function CurrentMonthChip() {
  return (
    <Box
      component="span"
      sx={{
        px: 0.8,
        py: 0.15,
        borderRadius: '999px',
        fontSize: '0.66rem',
        fontWeight: 700,
        color: brandColors.blue[700],
        backgroundColor: brandColors.blue[50],
        border: `1px solid ${brandColors.blue[200]}`,
        whiteSpace: 'nowrap',
      }}
    >
      {CURRENT_MONTH_TAG}
    </Box>
  );
}
