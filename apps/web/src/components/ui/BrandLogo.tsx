import { Box, Stack, Typography } from '@mui/material';
import markUrl from '@/assets/flux-financier-mark.svg';
import { headingFont, brandColors } from '@/app/theme';

interface BrandLogoProps {
  variant?: 'full' | 'mark' | 'text';
  height?: number;
  collapsed?: boolean;
}

export function BrandLogo({ variant = 'full', height = 44, collapsed }: BrandLogoProps) {
  if (collapsed) {
    return (
      <Box
        component="img"
        src={markUrl}
        alt="Flux Financier"
        sx={{
          height: 36,
          width: 'auto',
          display: 'block',
          userSelect: 'none',
          transition: 'transform 0.2s ease',
          '&:hover': { transform: 'scale(1.05)' },
        }}
      />
    );
  }

  if (variant === 'text') {
    return (
      <Stack direction="row" alignItems="center" spacing={1.2}>
        <Box
          component="img"
          src={markUrl}
          alt="Logo"
          sx={{
            height: 32,
            width: 'auto',
            display: 'block',
            userSelect: 'none',
          }}
        />
        <Typography
          sx={{
            fontFamily: headingFont,
            fontWeight: 700,
            fontSize: '1.05rem',
            color: brandColors.slate[800],
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Flux Financier
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1.2}>
      <Box
        component="img"
        src={markUrl}
        alt="Flux Financier"
        sx={{
          height: Math.min(height, 38),
          width: 'auto',
          display: 'block',
          userSelect: 'none',
          transition: 'transform 0.2s ease',
          '&:hover': { transform: 'scale(1.03)' },
        }}
      />
      {variant === 'full' && (
        <Typography
          sx={{
            fontFamily: headingFont,
            fontWeight: 700,
            fontSize: '1.1rem',
            color: brandColors.slate[800],
            letterSpacing: '-0.015em',
            lineHeight: 1,
          }}
        >
          Flux Financier
        </Typography>
      )}
    </Stack>
  );
}
