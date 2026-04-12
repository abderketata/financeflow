import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography, alpha } from '@mui/material';
import { brandColors, headingFont } from '@/app/theme';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmColor?: 'error' | 'success';
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  confirmColor = 'error',
  loading,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  const accentColor = confirmColor === 'success' ? '#388e3c' : brandColors.debit;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      TransitionProps={{ timeout: 250 }}
    >
      {/* Accent top bar */}
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.3)})`,
        }}
      />
      <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(accentColor, 0.08),
              color: accentColor,
            }}
          >
            {confirmColor === 'success' ? <CheckCircleOutlineRoundedIcon /> : <WarningAmberRoundedIcon />}
          </Box>
          <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.08rem', color: 'text.primary' }}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Annuler
        </Button>
        <Button color={confirmColor} variant="contained" onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
