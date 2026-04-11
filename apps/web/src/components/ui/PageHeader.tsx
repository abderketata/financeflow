import { Box, Stack, Typography, alpha } from '@mui/material';
import { brandColors, headingFont } from '@/app/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  count?: number;
}

export function PageHeader({ title, subtitle, action, count }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      sx={{ mb: 3.5 }}
      className="animate-fade-in-up"
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: headingFont,
              fontWeight: 800,
              fontSize: { xs: '1.3rem', md: '1.45rem' },
              letterSpacing: '-0.025em',
              color: brandColors.slate[900],
            }}
          >
            {title}
          </Typography>
          {typeof count === 'number' && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '7px',
                backgroundColor: alpha(brandColors.blue[500], 0.08),
                border: `1px solid ${alpha(brandColors.blue[500], 0.1)}`,
                color: brandColors.blue[600],
              }}
            >
              <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, lineHeight: 1.4 }}>
                {count}
              </Typography>
            </Box>
          )}
        </Stack>
        {subtitle && (
          <Typography
            sx={{
              mt: 0.6,
              color: brandColors.slate[500],
              fontSize: '0.88rem',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
        {/* Subtle accent underline */}
        <Box
          sx={{
            mt: 1.5,
            width: 32,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${brandColors.blue[500]}, ${alpha(brandColors.blue[400], 0.3)})`,
          }}
        />
      </Box>
      {action}
    </Stack>
  );
}
