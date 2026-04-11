import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { Box, Card, CardContent, Stack, Typography, alpha } from '@mui/material';
import { ReactNode } from 'react';
import { numericFont } from '@/app/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  color?: string;
  bgColor?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({
  label,
  value,
  helper,
  color = '#2563EB',
  bgColor,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  const resolvedBg = bgColor || alpha(color, 0.07);

  const trendConfig =
    trend === 'up'
      ? { icon: <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />, color: '#059669', bg: '#ECFDF5' }
      : trend === 'down'
      ? { icon: <TrendingDownRoundedIcon sx={{ fontSize: 14 }} />, color: '#DC2626', bg: '#FEF2F2' }
      : trend === 'neutral'
      ? { icon: <TrendingFlatRoundedIcon sx={{ fontSize: 14 }} />, color: '#64748B', bg: '#F1F5F9' }
      : null;

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: `3px solid ${color}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          '& .stat-icon-box': {
            transform: 'scale(1.06)',
          },
        },
      }}
    >
      <CardContent sx={{ p: '22px 24px !important', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'text.secondary',
                lineHeight: 1.6,
                display: 'block',
                mb: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1.5}>
              <Typography
                sx={{
                  fontSize: '1.55rem',
                  fontWeight: 800,
                  fontFamily: numericFont,
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
              {trendConfig && trendValue && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '6px',
                    backgroundColor: trendConfig.bg,
                    color: trendConfig.color,
                  }}
                >
                  {trendConfig.icon}
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: trendConfig.color }}>
                    {trendValue}
                  </Typography>
                </Box>
              )}
            </Stack>
            {helper && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.78rem' }}
              >
                {helper}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              className="stat-icon-box"
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: resolvedBg,
                border: `1px solid ${alpha(color, 0.1)}`,
                color,
                flexShrink: 0,
                ml: 1.5,
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
