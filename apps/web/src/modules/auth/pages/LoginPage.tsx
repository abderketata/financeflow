import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, Stack, TextField, Typography, alpha } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/providers/AuthProvider';
import { brandColors, headingFont, premiumShadows } from '@/app/theme';

const schema = z.object({
  identifier: z.string().min(2, 'Identifiant requis'),
  password: z.string().min(4, 'Mot de passe requis')
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Subtle decorative background */}
      <Box
        sx={{
          position: 'absolute',
          top: '-30%',
          right: '-15%',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(brandColors.blue[400], 0.08)} 0%, transparent 70%)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(brandColors.blue[300], 0.06)} 0%, transparent 70%)`,
        }}
      />

      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '16px',
          boxShadow: premiumShadows.lg,
          border: `1px solid ${brandColors.slate[200]}`,
          position: 'relative',
          zIndex: 1,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            {/* Logo & Title */}
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: '14px',
                    backgroundColor: alpha(brandColors.blue[500], 0.06),
                    display: 'inline-flex',
                  }}
                >
                  <BrandLogo variant="mark" height={48} />
                </Box>
              </Box>
              <Typography
                sx={{
                  fontFamily: headingFont,
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  color: brandColors.slate[800],
                  letterSpacing: '-0.02em',
                }}
              >
                Connexion
              </Typography>
              <Typography
                sx={{
                  color: brandColors.slate[500],
                  fontSize: '0.88rem',
                  mt: 0.5,
                  fontWeight: 500,
                }}
              >
                Accédez à votre espace Flux Financier
              </Typography>
            </Box>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <Controller name="identifier" control={control} render={({ field }) => (
              <TextField
                {...field}
                label="Identifiant"
                fullWidth
                error={!!errors.identifier}
                helperText={errors.identifier?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon sx={{ color: brandColors.slate[400], fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )} />

            <Controller name="password" control={control} render={({ field }) => (
              <TextField
                {...field}
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon sx={{ color: brandColors.slate[400], fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        sx={{ color: brandColors.slate[400] }}
                      >
                        {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )} />

            <Button
              variant="contained"
              size="large"
              disabled={isSubmitting}
              fullWidth
              sx={{
                py: 1.4,
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: brandColors.blue[600],
                '&:hover': {
                  backgroundColor: brandColors.blue[700],
                },
              }}
              onClick={handleSubmit(async (values) => {
                try {
                  setError(null);
                  await login(values.identifier, values.password);
                  navigate('/dashboard');
                } catch (err: any) {
                  setError(err?.error?.message || 'Connexion impossible. Vérifiez vos identifiants.');
                }
              })}
            >
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </Button>

            <Divider sx={{ '&::before, &::after': { borderColor: brandColors.slate[200] } }}>
              <Typography sx={{ color: brandColors.slate[400], fontSize: '0.72rem', fontWeight: 600, px: 1.5, letterSpacing: '0.05em' }}>
                FLUX FINANCIER
              </Typography>
            </Divider>

            {/* Footer */}
            <Typography
              sx={{
                textAlign: 'center',
                color: brandColors.slate[400],
                fontSize: '0.73rem',
                fontWeight: 500,
              }}
            >
              Flux Financier © 2026 — Gestion financière professionnelle
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
