import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Box, Button, IconButton, Stack, Tooltip, Typography, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';

interface WeekNavigatorProps {
  weekLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onCurrentWeek: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  isCurrentWeek?: boolean;
}

export function WeekNavigator({
  weekLabel,
  onPrevious,
  onNext,
  onCurrentWeek,
  disablePrevious = false,
  disableNext = false,
  isCurrentWeek = false,
}: WeekNavigatorProps) {
  return (
    // Toujours sur une seule ligne : si la carte est étroite, « Semaine actuelle »
    // ne garde que son icône (container query sur la largeur réellement disponible).
    <Box
      sx={{
        width: '100%',
        containerType: 'inline-size',
        '@container (max-width: 460px)': {
          '& .week-navigator-current-text': { display: 'none' },
          '& .week-navigator-current .MuiButton-startIcon': { m: 0 },
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
          {weekLabel}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={onPrevious}
            disabled={disablePrevious}
            sx={{
              border: `1px solid ${alpha(brandColors.slate[300], 0.9)}`,
              backgroundColor: '#fff',
            }}
          >
            <NavigateBeforeRoundedIcon fontSize="small" />
          </IconButton>
          {/* Sur carte étroite le bouton n'affiche que l'icône : l'infobulle dit ce qu'il fait.
              Le <span> laisse l'infobulle fonctionner quand le bouton est désactivé. */}
          <Tooltip
            arrow
            title={isCurrentWeek ? 'Vous êtes sur la semaine actuelle' : 'Revenir à la semaine actuelle'}
          >
            <Box component="span" sx={{ display: 'inline-flex' }}>
              <Button
                variant={isCurrentWeek ? 'contained' : 'outlined'}
                size="small"
                startIcon={<TodayRoundedIcon fontSize="small" />}
                onClick={onCurrentWeek}
                disabled={isCurrentWeek}
                aria-label="Revenir à la semaine actuelle"
                className="week-navigator-current"
                sx={{ minWidth: 0, whiteSpace: 'nowrap' }}
              >
                <span className="week-navigator-current-text">Semaine actuelle</span>
              </Button>
            </Box>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onNext}
            disabled={disableNext}
            sx={{
              border: `1px solid ${alpha(brandColors.slate[300], 0.9)}`,
              backgroundColor: '#fff',
            }}
          >
            <NavigateNextRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

