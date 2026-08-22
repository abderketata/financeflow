import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { brand } from '@/theme/brand';

/**
 * Marque « Flux Financier », transposition fidèle du SVG utilisé par l'application
 * web (`apps/web/src/assets/flux-financier-mark.svg`) : mêmes dégradés, mêmes
 * tracés, mêmes proportions — d'où le viewBox 160×160 conservé tel quel.
 */
export function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="markBg" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <Stop stopColor={brand.blue600} />
          <Stop offset="1" stopColor={brand.blue500} />
        </LinearGradient>
        <LinearGradient id="arrowGrad" x1="50" y1="110" x2="110" y2="50" gradientUnits="userSpaceOnUse">
          <Stop stopColor={brand.white} stopOpacity={0.95} />
          <Stop offset="1" stopColor={brand.blue100} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {/* Carré arrondi + voile intérieur */}
      <Rect x={8} y={8} width={144} height={144} rx={36} fill="url(#markBg)" />
      <Rect x={8} y={8} width={144} height={144} rx={36} fill={brand.white} fillOpacity={0.06} />

      {/* Courbe ascendante (flux / croissance) */}
      <Path
        d="M48 112L80 72L100 88L120 52"
        stroke="url(#arrowGrad)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M108 50L122 48L120 62"
        stroke={brand.white}
        strokeOpacity={0.9}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Socle (équilibre / stabilité) */}
      <Rect x={44} y={124} width={72} height={5} rx={2.5} fill={brand.white} fillOpacity={0.35} />
    </Svg>
  );
}

/** Marque + nom, disposés horizontalement comme dans l'en-tête du web. */
export function BrandLogo({ size = 48, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <BrandMark size={size} />
      <View style={styles.text}>
        <Text style={styles.name}>Flux Financier</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 12,
    flexShrink: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: brand.navy900,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '500',
    color: brand.slate500,
  },
});
