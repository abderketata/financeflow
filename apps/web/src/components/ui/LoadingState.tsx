import { Box, Skeleton, Stack, Typography, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';

export function LoadingState({ message = 'Chargement en cours...' }: { message?: string }) {
  return (
    <Box
      sx={{
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 3,
        py: 5,
      }}
      className="animate-fade-in-up"
    >
      {/* Skeleton card preview */}
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton
              variant="rounded"
              width={44}
              height={44}
              sx={{
                borderRadius: '12px',
                backgroundColor: alpha(brandColors.slate[300], 0.15),
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton
                variant="rounded"
                width="70%"
                height={12}
                sx={{
                  borderRadius: '6px',
                  backgroundColor: alpha(brandColors.slate[300], 0.2),
                  mb: 1,
                }}
              />
              <Skeleton
                variant="rounded"
                width="45%"
                height={10}
                sx={{
                  borderRadius: '4px',
                  backgroundColor: alpha(brandColors.slate[300], 0.12),
                }}
              />
            </Box>
          </Stack>
          <Skeleton
            variant="rounded"
            width="100%"
            height={10}
            sx={{
              borderRadius: '4px',
              backgroundColor: alpha(brandColors.slate[300], 0.15),
            }}
          />
          <Skeleton
            variant="rounded"
            width="85%"
            height={10}
            sx={{
              borderRadius: '4px',
              backgroundColor: alpha(brandColors.slate[300], 0.12),
            }}
          />
          <Skeleton
            variant="rounded"
            width="60%"
            height={10}
            sx={{
              borderRadius: '4px',
              backgroundColor: alpha(brandColors.slate[300], 0.08),
            }}
          />
        </Stack>
      </Box>

      {/* Loading bar */}
      <Box
        sx={{
          width: 120,
          height: 3,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: alpha(brandColors.slate[300], 0.15),
        }}
      >
        <Box
          sx={{
            width: '40%',
            height: '100%',
            borderRadius: 2,
            background: `linear-gradient(90deg, ${brandColors.blue[400]}, ${brandColors.blue[600]})`,
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }}
        />
      </Box>

      <Typography sx={{ color: brandColors.slate[500], fontSize: '0.88rem', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}
