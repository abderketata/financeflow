import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ChartPoint } from '@/types';
import { formatCurrency } from '@/utils/format';

const CREDIT_COLOR = '#16a34a';
const DEBIT_COLOR = '#dc2626';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SURFACE = '#ffffff';
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 12 };
const GRID_SEGMENTS = 4;

type SeriesPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
};

type BarPoint = SeriesPoint & {
  width: number;
  height: number;
};

const getSeriesPoints = (data: ChartPoint[], key: 'credit' | 'debit', width: number, maxValue: number): SeriesPoint[] => {
  const innerWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 1);
  const innerHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);

  return data.map((entry, index) => {
    const value = Math.max(Number(entry[key] ?? 0), 0);
    const ratio = maxValue > 0 ? value / maxValue : 0;
    const x = CHART_PADDING.left + (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / Math.max(data.length - 1, 1));
    const y = CHART_PADDING.top + innerHeight - ratio * innerHeight;

    return {
      x,
      y,
      value,
      label: entry.label,
    };
  });
};

const toSvgPath = (points: SeriesPoint[]) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

const getBarPoints = (data: ChartPoint[], width: number, maxValue: number): BarPoint[] => {
  const innerWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 1);
  const innerHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);
  const step = data.length > 0 ? innerWidth / data.length : innerWidth;
  const barWidth = Math.min(Math.max(step * 0.48, 10), 26);

  return data.map((entry, index) => {
    const value = Math.max(Number(entry.credit ?? 0), 0);
    const ratio = maxValue > 0 ? value / maxValue : 0;
    const height = ratio * innerHeight;
    const x = CHART_PADDING.left + index * step + (step - barWidth) / 2;
    const y = CHART_PADDING.top + innerHeight - height;

    return {
      x,
      y,
      width: barWidth,
      height,
      value,
      label: entry.label,
    };
  });
};

export function MonthlyCreditDebitComparisonChart({
  data,
  currency = 'TND',
}: {
  data: ChartPoint[];
  currency?: string;
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const totalCredits = useMemo(() => data.reduce((sum, point) => sum + Number(point.credit ?? 0), 0), [data]);
  const totalDebits = useMemo(() => data.reduce((sum, point) => sum + Number(point.debit ?? 0), 0), [data]);
  const maxValue = useMemo(
    () => Math.max(1, ...data.flatMap((point) => [Number(point.credit ?? 0), Number(point.debit ?? 0)])),
    [data],
  );

  const creditBars = useMemo(() => getBarPoints(data, chartWidth, maxValue), [data, chartWidth, maxValue]);
  const debitPoints = useMemo(() => getSeriesPoints(data, 'debit', chartWidth, maxValue), [data, chartWidth, maxValue]);

  const onChartLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width && width !== chartWidth) {
      setChartWidth(width);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📉 Comparatif mensuel crédits / débits</Text>
        <Text style={styles.subtitle}>Deux courbes distinctes pour comparer les flux mois par mois sur l'année</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CREDIT_COLOR }]} />
          <Text style={styles.legendText}>Crédits (colonnes) {formatCurrency(totalCredits, currency)}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DEBIT_COLOR }]} />
          <Text style={styles.legendText}>Débits (ligne) {formatCurrency(totalDebits, currency)}</Text>
        </View>
      </View>

      <View onLayout={onChartLayout} style={styles.chartContainer}>
        {!!chartWidth && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {Array.from({ length: GRID_SEGMENTS + 1 }, (_, index) => {
              const ratio = index / GRID_SEGMENTS;
              const y = CHART_PADDING.top + (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) * ratio;

              return (
                <Line
                  key={`grid-${index}`}
                  x1={CHART_PADDING.left}
                  x2={chartWidth - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  stroke={SLATE_200}
                  strokeDasharray="4 4"
                />
              );
            })}

            {creditBars.map((bar) => (
              <Path
                key={`credit-bar-${bar.label}`}
                d={`M ${bar.x} ${bar.y + bar.height} L ${bar.x} ${bar.y} L ${bar.x + bar.width} ${bar.y} L ${bar.x + bar.width} ${bar.y + bar.height}`}
                fill={alphaToHex(CREDIT_COLOR, 0.8)}
                stroke={alphaToHex(CREDIT_COLOR, 0.95)}
                strokeWidth={1}
              />
            ))}
            {debitPoints.length > 1 ? (
              <Path d={toSvgPath(debitPoints)} fill="none" stroke={DEBIT_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            ) : null}

            {debitPoints.map((point) => (
              <Circle key={`debit-${point.label}`} cx={point.x} cy={point.y} r={4} fill={DEBIT_COLOR} stroke={SURFACE} strokeWidth={2} />
            ))}
          </Svg>
        )}
      </View>

      <View style={styles.axisLabelsRow}>
        {data.map((point) => (
          <Text key={point.label} style={styles.axisLabel}>
            {point.label}
          </Text>
        ))}
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>{new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(maxValue / 2)}</Text>
        <Text style={styles.scaleText}>{new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(maxValue)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: SLATE_900,
  },
  subtitle: {
    fontSize: 12,
    color: SLATE_500,
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE_500,
  },
  chartContainer: {
    minHeight: CHART_HEIGHT,
    justifyContent: 'center',
  },
  axisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 6,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: SLATE_400,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scaleText: {
    fontSize: 11,
    color: SLATE_400,
  },
});

function alphaToHex(color: string, alpha: number) {
  const sanitized = color.replace('#', '');
  const opacity = Math.round(Math.min(Math.max(alpha, 0), 1) * 255).toString(16).padStart(2, '0');
  return `#${sanitized}${opacity}`;
}

