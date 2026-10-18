import { G, Rect, Text as SvgText } from 'react-native-svg';
import { StyleSheet } from 'react-native';
import { brand } from '@/theme/brand';

/**
 * Mise en évidence du mois en cours dans les graphiques mensuels (SVG) :
 * bande de fond + étiquette « Mois en cours ». Équivalent mobile du
 * `CurrentMonthHighlight` du web.
 */

export const CURRENT_MONTH_TAG = 'Mois en cours';
/** Hauteur réservée au-dessus de la zone de tracé pour l'étiquette. */
export const CURRENT_MONTH_TAG_SPACE = 22;

const TAG_WIDTH = 74;
const TAG_HEIGHT = 16;

/**
 * @param centerX centre du mois en cours sur l'axe X.
 * @param bandWidth largeur d'un mois (écart entre deux points ou largeur d'une colonne).
 * @param plotLeft / plotRight bornes horizontales de la zone de tracé.
 * @param plotTop / plotBottom bornes verticales de la zone de tracé.
 */
export function CurrentMonthBand({
  centerX,
  bandWidth,
  plotLeft,
  plotRight,
  plotTop,
  plotBottom,
}: {
  centerX: number;
  bandWidth: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}) {
  const bandLeft = Math.max(centerX - bandWidth / 2, plotLeft);
  const bandRight = Math.min(centerX + bandWidth / 2, plotRight);
  const tagLeft = Math.min(Math.max(centerX - TAG_WIDTH / 2, plotLeft), plotRight - TAG_WIDTH);
  const tagTop = plotTop - TAG_HEIGHT - 4;

  return (
    <G>
      <Rect
        x={bandLeft}
        y={plotTop}
        width={Math.max(bandRight - bandLeft, 0)}
        height={Math.max(plotBottom - plotTop, 0)}
        rx={6}
        fill={brand.blue50}
        stroke={brand.blue300}
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <Rect x={tagLeft} y={tagTop} width={TAG_WIDTH} height={TAG_HEIGHT} rx={TAG_HEIGHT / 2} fill={brand.blue600} />
      <SvgText
        x={tagLeft + TAG_WIDTH / 2}
        y={tagTop + TAG_HEIGHT / 2 + 3.5}
        textAnchor="middle"
        fill={brand.white}
        fontSize={9.5}
        fontWeight="700"
      >
        {CURRENT_MONTH_TAG}
      </SvgText>
    </G>
  );
}

/** Style à ajouter au libellé d'axe du mois en cours. */
export const currentMonthStyles = StyleSheet.create({
  axisLabel: {
    color: brand.blue700,
    fontWeight: '800',
  },
});
