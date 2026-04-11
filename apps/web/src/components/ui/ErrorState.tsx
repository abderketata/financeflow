import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Typography, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';

export function ErrorState({ message = 'Une erreur est survenue.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <Box
      sx={{
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        textAlign: 'center',
        py: 5,
      }}
      className="animate-fade-in-up"
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(brandColors.debit, 0.06),
          color: brandColors.debit,
          mb: 0.5,
        }}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 28 }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: brandColors.slate[800] }}>
        Oups, une erreur est survenue
      </Typography>
      <Typography sx={{ color: brandColors.slate[500], fontSize: '0.88rem', maxWidth: 400, lineHeight: 1.5 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          onClick={onRetry}
          sx={{ mt: 1 }}
        >
          Réessayer
        </Button>
      )}
    </Box>
  );
}
