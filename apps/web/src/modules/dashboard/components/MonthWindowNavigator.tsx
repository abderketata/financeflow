import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Box, Button, CircularProgress, Stack, Typography, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';
import { MONTHLY_WINDOW_SHIFT } from '@/modules/dashboard/services/dashboard.service';

interface MonthWindowNavigatorProps {
  /** Période affichée, ex. « Mai 2026 – Avr 2027 ». */
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

const shiftButtonSx = {
  minWidth: 0,
  whiteSpace: 'nowrap',
  borderColor: alpha(brandColors.slate[300], 0.9),
  color: brandColors.slate[700],
  backgroundColor: '#fff',
} as const;

/** Décale la fenêtre de 12 mois d'un graphique mensuel de quelques mois vers le passé ou le futur. */
export function MonthWindowNavigator({ label, onPrevious, onNext }: MonthWindowNavigatorProps) {
  return (
    // Toujours sur une seule ligne : si la carte est étroite, les boutons perdent leur chevron
    // et l'intitulé se tronque (container query sur la largeur réellement disponible).
    <Box
      sx={{
        width: '100%',
        containerType: 'inline-size',
        '@container (max-width: 400px)': {
          '& .MuiButton-startIcon, & .MuiButton-endIcon': { display: 'none' },
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          sx={{
            px: 1.25,
            py: 0.85,
            borderRadius: '10px',
            border: `1px solid ${alpha(brandColors.blue[500], 0.12)}`,
            backgroundColor: alpha(brandColors.blue[500], 0.05),
            color: brandColors.slate[700],
            fontSize: '0.78rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<NavigateBeforeRoundedIcon fontSize="small" />}
            onClick={onPrevious}
            sx={shiftButtonSx}
          >
            − {MONTHLY_WINDOW_SHIFT} mois
          </Button>
          <Button
            variant="outlined"
            size="small"
            endIcon={<NavigateNextRoundedIcon fontSize="small" />}
            onClick={onNext}
            sx={shiftButtonSx}
          >
            + {MONTHLY_WINDOW_SHIFT} mois
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * Voile posé sur la zone de tracé : spinner pendant le chargement d'une
 * fenêtre (l'ancienne reste visible dessous), message + relance en cas d'échec.
 */
export function ChartStatusOverlay({ loading, onRetry }: { loading?: boolean; onRetry?: () => void }) {
  if (!loading && !onRetry) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        backgroundColor: alpha('#fff', 0.6),
        borderRadius: '10px',
      }}
    >
      {onRetry ? (
        <>
          <Typography sx={{ fontSize: '0.82rem', color: brandColors.slate[500] }}>
            Impossible de charger cette période.
          </Typography>
          <Button size="small" variant="outlined" onClick={onRetry}>
            Réessayer
          </Button>
        </>
      ) : (
        <CircularProgress size={28} />
      )}
    </Box>
  );
}
