import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ChartPoint } from '@/types';
import { buildChartAmountScale, formatCompactAmount } from '@/utils/chartScale';
import { brand, spacing } from '@/theme/brand';
import { CURRENT_MONTH_TAG_SPACE, CurrentMonthBand, currentMonthStyles } from '@/modules/dashboard/components/CurrentMonthHighlight';

const CHART_HEIGHT = 206;
// `top` laisse la place à l'étiquette « Mois en cours » au-dessus de la zone de tracé.
const PADDING = { top: CURRENT_MONTH_TAG_SPACE, right: 10, bottom: 26, left: 10 };
const GRID_SEGMENTS = 4;

type SeriesKey = 'credit' | 'debit' | 'creditPaid' | 'debitPaid';

const buildPath = (
  data: ChartPoint[],
  key: SeriesKey,
  width: number,
  maxValue: number,
): { path: string; points: Array<{ x: number; y: number }> } => {
  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((entry, index) => {
    const value = Math.max(Number(entry[key] ?? 0), 0);
    const ratio = maxValue > 0 ? value / maxValue : 0;
    const x =
      PADDING.left +
      (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / Math.max(data.length - 1, 1));
    return { x, y: PADDING.top + innerHeight - ratio * innerHeight };
  });

  return {
    path: points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
    points,
  };
};

/**
 * Vue annuelle : montants **attendus** (trait plein) et **réellement réglés**
 * (pointillés). L'écart entre les deux courbes est ce qui reste à encaisser.
 * Équivalent mobile du `MonthlyOperationsChart` du web.
 */
export function MonthlyOperationsChart({ data, currency = 'TND' }: { data: ChartPoint[]; currency?: string }) {
  const [width, setWidth] = useState(0);
  // Échelle sur les totaux attendus : le réalisé leur est toujours inférieur.
  const scale = useMemo(() => buildChartAmountScale(data, ['credit', 'debit']), [data]);

  const series = useMemo(() => {
    if (width <= 0) return null;
    return {
      credit: buildPath(data, 'credit', width, scale.max),
      debit: buildPath(data, 'debit', width, scale.max),
      creditPaid: buildPath(data, 'creditPaid', width, scale.max),
      debitPaid: buildPath(data, 'debitPaid', width, scale.max),
    };
  }, [data, width, scale.max]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const currentIndex = data.findIndex((point) => point.isCurrentMonth);
  const currentPoint = series && currentIndex >= 0 ? series.credit.points[currentIndex] : undefined;

  return (
    <View onLayout={onLayout}>
      {series ? (
        <Svg width={width} height={CHART_HEIGHT}>
          {Array.from({ length: GRID_SEGMENTS + 1 }, (_, index) => {
            const y = PADDING.top + ((CHART_HEIGHT - PADDING.top - PADDING.bottom) * index) / GRID_SEGMENTS;
            return (
              <Line
                key={`grid-${index}`}
                x1={PADDING.left}
                y1={y}
                x2={width - PADDING.right}
                y2={y}
                stroke={brand.slate200}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            );
          })}

          {currentPoint ? (
            <CurrentMonthBand
              centerX={currentPoint.x}
              bandWidth={(width - PADDING.left - PADDING.right) / Math.max(data.length - 1, 1)}
              plotLeft={PADDING.left}
              plotRight={width - PADDING.right}
              plotTop={PADDING.top}
              plotBottom={CHART_HEIGHT - PADDING.bottom}
            />
          ) : null}

          {/* Attendu : trait plein */}
          <Path d={series.credit.path} fill="none" stroke={brand.credit} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d={series.debit.path} fill="none" stroke={brand.danger} strokeWidth={2.5} strokeLinejoin="round" />

          {/* Réalisé : pointillés */}
          <Path
            d={series.creditPaid.path}
            fill="none"
            stroke={brand.credit}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
          <Path
            d={series.debitPaid.path}
            fill="none"
            stroke={brand.danger}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />

          {/* Points sur l'attendu, pour repérer les mois (plus gros sur le mois en cours) */}
          {series.credit.points.map((point, index) => (
            <Circle key={`c-${index}`} cx={point.x} cy={point.y} r={index === currentIndex ? 4.5 : 2.5} fill={brand.credit} />
          ))}
          {series.debit.points.map((point, index) => (
            <Circle key={`d-${index}`} cx={point.x} cy={point.y} r={index === currentIndex ? 4.5 : 2.5} fill={brand.danger} />
          ))}
        </Svg>
      ) : (
        <View style={{ height: CHART_HEIGHT }} />
      )}

      <View style={styles.axis}>
        {data.map((point) => (
          <Text
            key={point.label}
            style={[styles.axisLabel, point.isCurrentMonth && currentMonthStyles.axisLabel]}
            numberOfLines={1}
          >
            {point.label}
          </Text>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: brand.credit }]} />
          <Text style={styles.legendLabel}>Crédits attendus</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.lineDashed, { borderColor: brand.credit }]} />
          <Text style={styles.legendLabel}>Encaissés</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: brand.danger }]} />
          <Text style={styles.legendLabel}>Débits attendus</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.lineDashed, { borderColor: brand.danger }]} />
          <Text style={styles.legendLabel}>Payés</Text>
        </View>
      </View>

      <Text style={styles.scaleLabel}>
        max {formatCompactAmount(scale.max)} {currency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    marginTop: -18,
  },
  axisLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: brand.slate400,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  line: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  lineDashed: {
    width: 14,
    height: 0,
    borderTopWidth: 2.5,
    borderStyle: 'dashed',
  },
  legendLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: brand.slate600,
  },
  scaleLabel: {
    marginTop: spacing.sm,
    fontSize: 10.5,
    fontWeight: '600',
    color: brand.slate400,
    textAlign: 'right',
  },
});
