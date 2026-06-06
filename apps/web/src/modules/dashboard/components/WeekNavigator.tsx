import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Button, IconButton, Stack, Typography, alpha } from '@mui/material';
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
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ width: { xs: '100%', sm: 'auto' } }}
    >
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
        }}
      >
        {weekLabel}
      </Typography>

      <Stack direction="row" spacing={0.75} justifyContent={{ xs: 'space-between', sm: 'flex-start' }}>
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
        <Button
          variant={isCurrentWeek ? 'contained' : 'outlined'}
          size="small"
          startIcon={<TodayRoundedIcon fontSize="small" />}
          onClick={onCurrentWeek}
          disabled={isCurrentWeek}
          sx={{ minWidth: 0, whiteSpace: 'nowrap' }}
        >
          Semaine actuelle
        </Button>
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
  );
}

