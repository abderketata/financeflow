import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { ChartPoint } from '@/types';
import { buildChartAmountScale, formatCompactAmount } from '@/utils/chartScale';
import { brand, spacing } from '@/theme/brand';

const CHART_HEIGHT = 190;
const PADDING = { top: 14, right: 8, bottom: 26, left: 8 };
const GRID_SEGMENTS = 4;

/**
 * Comparatif crédits / débits jour par jour, en barres appariées.
 * Équivalent mobile du `WeeklyOperationsChart` du web.
 */
export function WeeklyOperationsChart({ data, currency = 'TND' }: { data: ChartPoint[]; currency?: string }) {
  const [width, setWidth] = useState(0);
  const scale = useMemo(() => buildChartAmountScale(data, ['credit', 'debit']), [data]);

  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const step = data.length > 0 ? innerWidth / data.length : innerWidth;
  // Deux barres par jour, séparées par un fin interstice.
  const barWidth = Math.min(Math.max(step * 0.3, 5), 14);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const toHeight = (value: number) =>
    scale.max > 0 ? Math.max((Math.max(value, 0) / scale.max) * innerHeight, value > 0 ? 2 : 0) : 0;

  const weekTotal = useMemo(
    () => data.reduce((total, point) => total + point.credit + point.debit, 0),
    [data],
  );

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          {/* Lignes de grille + graduations */}
          {Array.from({ length: GRID_SEGMENTS + 1 }, (_, index) => {
            const y = PADDING.top + (innerHeight * index) / GRID_SEGMENTS;
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

          {data.map((point, index) => {
            const center = PADDING.left + step * index + step / 2;
            const creditHeight = toHeight(point.credit);
            const debitHeight = toHeight(point.debit);
            const baseline = PADDING.top + innerHeight;

            return (
              <React.Fragment key={point.label}>
                <Rect
                  x={center - barWidth - 1.5}
                  y={baseline - creditHeight}
                  width={barWidth}
                  height={creditHeight}
                  rx={3}
                  fill={brand.credit}
                />
                <Rect
                  x={center + 1.5}
                  y={baseline - debitHeight}
                  width={barWidth}
                  height={debitHeight}
                  rx={3}
                  fill={brand.danger}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height: CHART_HEIGHT }} />
      )}

      {/* Libellés des jours */}
      <View style={styles.axis}>
        {data.map((point) => (
          <Text key={point.label} style={styles.axisLabel}>
            {point.label}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: brand.credit }]} />
          <Text style={styles.legendLabel}>Crédits</Text>
          <View style={[styles.dot, { backgroundColor: brand.danger }]} />
          <Text style={styles.legendLabel}>Débits</Text>
        </View>
        <Text style={styles.scaleLabel}>
          max {formatCompactAmount(scale.max)} {currency}
        </Text>
      </View>

      {weekTotal === 0 ? <Text style={styles.empty}>Aucune opération sur cette semaine</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -18,
  },
  axisLabel: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: brand.slate400,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: brand.slate600,
    marginRight: spacing.sm,
  },
  scaleLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: brand.slate400,
  },
  empty: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: brand.slate400,
    textAlign: 'center',
  },
});
