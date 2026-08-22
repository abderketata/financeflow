import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { brand } from '@/theme/brand';

/**
 * Illustration d'accueil : un effet de chèque au centre, une carte de suivi à
 * gauche, un encaissement validé à droite, posés sur un halo ovale.
 *
 * Volontairement géométrique et abstraite plutôt que figurative : une scène de
 * personnages dessinée à la main en SVG rendrait un résultat amateur.
 *
 * Toutes les coordonnées sont absolues dans le `viewBox`. Les pourcentages sont
 * à éviter : `react-native-svg` ne les rend pas de la même façon en web et en
 * natif (c'est ce qui avait produit un rectangle à la place d'un halo).
 */
export function AuthIllustration({ width = 300 }: { width?: number }) {
  return (
    <Svg width={width} height={width * 0.625} viewBox="0 0 320 200">
      <Defs>
        <LinearGradient id="illuHalo" x1="20" y1="20" x2="300" y2="190" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={brand.blue100} />
          <Stop offset="1" stopColor="#E8EDFB" />
        </LinearGradient>
        <LinearGradient id="illuAccent" x1="40" y1="150" x2="96" y2="100" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={brand.blue500} />
          <Stop offset="1" stopColor={brand.blue600} />
        </LinearGradient>
      </Defs>

      {/* Halo ovale */}
      <Ellipse cx={160} cy={104} rx={152} ry={84} fill="url(#illuHalo)" />
      <Ellipse cx={160} cy={100} rx={116} ry={60} fill={brand.white} opacity={0.5} />

      {/* Éclats décoratifs */}
      <Circle cx={44} cy={58} r={4} fill={brand.blue500} opacity={0.45} />
      <Circle cx={286} cy={140} r={5} fill={brand.blue500} opacity={0.35} />
      <Circle cx={128} cy={36} r={3} fill={brand.blue600} opacity={0.3} />

      {/* Effet principal (chèque / traite), légèrement incliné */}
      <G transform="rotate(-5 160 108)">
        <Rect x={80} y={60} width={162} height={94} rx={16} fill={brand.white} stroke={brand.slate200} strokeWidth={1.5} />
        {/* Bandeau de titre */}
        <Rect x={96} y={78} width={46} height={8} rx={4} fill={brand.blue600} />
        {/* Lignes de texte */}
        <Rect x={96} y={96} width={106} height={7} rx={3.5} fill={brand.slate200} />
        <Rect x={96} y={110} width={74} height={7} rx={3.5} fill={brand.slate200} />
        {/* Pastille de montant */}
        <Rect x={96} y={126} width={58} height={16} rx={8} fill={brand.blue50} />
        <Rect x={104} y={132} width={42} height={4} rx={2} fill={brand.blue500} opacity={0.7} />
        {/* Signature */}
        <Path
          d="M176 138q7-11 14-1t14-2"
          stroke={brand.slate300}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Carte de suivi (courbe ascendante, motif du logo) */}
      <Rect x={26} y={96} width={68} height={58} rx={14} fill={brand.white} stroke={brand.slate200} strokeWidth={1.5} />
      <Path
        d="M38 140L52 124L62 132L82 108"
        stroke="url(#illuAccent)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={82} cy={108} r={3.5} fill={brand.blue600} />

      {/* Encaissement validé */}
      <Circle cx={266} cy={78} r={26} fill={brand.white} stroke={brand.slate200} strokeWidth={1.5} />
      <Path
        d="M256 78l7 7 14-15"
        stroke={brand.credit}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Pile de valeurs */}
      <Ellipse cx={258} cy={148} rx={22} ry={7.5} fill={brand.blue500} opacity={0.22} />
      <Ellipse cx={258} cy={140} rx={22} ry={7.5} fill={brand.blue500} opacity={0.32} />
      <Ellipse cx={258} cy={132} rx={22} ry={7.5} fill={brand.blue600} opacity={0.5} />
    </Svg>
  );
}
