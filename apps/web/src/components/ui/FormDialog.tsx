import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography, alpha } from '@mui/material';
import { brandColors, headingFont } from '@/app/theme';

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FormDialog({ open, title, onClose, children }: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionProps={{ timeout: 250 }}
    >
      {/* Accent top bar */}
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${brandColors.blue[600]}, ${brandColors.blue[400]}, ${alpha(brandColors.blue[300], 0.2)})`,
        }}
      />
      <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1.25, backgroundColor: alpha('#000', 0), flexShrink: 0 }}>
              <PersonRoundedIcon fontSize="small" sx={{ color: 'text.primary' }} />
            </Box>
            <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.12rem', color: 'text.primary', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </Typography>
          </Stack>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: brandColors.navy[300],
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: brandColors.navy[600],
                backgroundColor: alpha(brandColors.navy[200], 0.3),
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <DialogContent sx={{ pt: '20px !important', pb: '24px !important' }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
