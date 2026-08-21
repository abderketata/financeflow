import { Box } from '@mui/material';
import { useMemo } from 'react';
import { brandColors } from '@/app/theme';
import { AmountWordRole, splitAmountWords } from '@/utils/format';

/**
 * Couleurs des mots-clés du montant en lettres.
 * Reprises du thème pour rester cohérentes avec le reste de l'application :
 * violet pour l'échelle, vert pour l'unité principale, ambre pour la divisionnaire.
 */
export const amountWordColors: Record<Exclude<AmountWordRole, 'text'>, string> = {
  scale: brandColors.alert,
  majorUnit: brandColors.credit,
  minorUnit: brandColors.warning,
};

interface AmountWordsTextProps {
  words: string;
  /** `arabic` pour le tafqit, `latin` pour le français. */
  script?: 'latin' | 'arabic';
  currency?: string | null;
}

/**
 * Rend le montant en lettres en colorant les mots d'échelle (mille / مليون),
 * l'unité principale (dinars / ديناراً) et l'unité divisionnaire (millimes / مليماً).
 *
 * Ne produit que des `span` : chaque appelant garde son propre `Typography`
 * et donc sa taille, sa graisse et sa direction d'écriture.
 */
export function AmountWordsText({ words, script = 'latin', currency }: AmountWordsTextProps) {
  const segments = useMemo(() => splitAmountWords(words, { script, currency }), [words, script, currency]);

  return (
    <>
      {segments.map((segment, index) => (
        <Box
          key={`${index}-${segment.text}`}
          component="span"
          sx={segment.role === 'text' ? undefined : { color: amountWordColors[segment.role], fontWeight: 800 }}
        >
          {segment.text}
        </Box>
      ))}
    </>
  );
}
