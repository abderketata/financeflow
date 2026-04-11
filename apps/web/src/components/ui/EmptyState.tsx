import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { brandColors } from '@/app/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        minHeight: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1.5,
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
          backgroundColor: brandColors.slate[100],
          color: brandColors.slate[400],
          mb: 0.5,
        }}
      >
        {icon || <InboxRoundedIcon sx={{ fontSize: 28 }} />}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: brandColors.slate[800] }}>
        {title}
      </Typography>
      <Typography sx={{ color: brandColors.slate[500], fontSize: '0.88rem', maxWidth: 340, lineHeight: 1.5 }}>
        {message ?? 'Aucune donnée disponible pour le moment.'}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
