import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { brandColors, headingFont, iconBox } from '@/app/theme';
import {
  ProfileEmailFormValues,
  ProfilePasswordFormValues,
  profileEmailSchema,
  profilePasswordSchema,
} from '@/modules/profile/schemas/profile.schema';
import { profileService } from '@/modules/profile/services/profile.service';
import { getProfileErrorMessage } from '@/modules/profile/utils/profileErrors';
import { useAuth } from '@/providers/AuthProvider';

const inputIconSx = { fontSize: 18, color: brandColors.slate[400] } as const;

const emptyPasswordValues: ProfilePasswordFormValues = {
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
};

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Profil de l'utilisateur connecté : nom d'utilisateur en lecture seule,
 * modification de l'email et du mot de passe (deux formulaires indépendants).
 */
export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const { user, updateUser } = useAuth();
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const emailForm = useForm<ProfileEmailFormValues>({
    resolver: zodResolver(profileEmailSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  const passwordForm = useForm<ProfilePasswordFormValues>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: emptyPasswordValues,
  });

  // À chaque ouverture : email courant rechargé, champs mot de passe vidés.
  useEffect(() => {
    if (!open) {
      return;
    }

    emailForm.reset({ email: user?.email ?? '' });
    passwordForm.reset(emptyPasswordValues);
    setEmailError('');
    setPasswordError('');
    setShowCurrent(false);
    setShowNext(false);
  }, [open, user?.email]);

  const submitEmail = async ({ email }: ProfileEmailFormValues) => {
    if (!user?.id) {
      setEmailError('Utilisateur introuvable dans la session courante.');
      return;
    }

    setEmailError('');
    setEmailSaving(true);

    try {
      const updated = await profileService.updateEmail(user.id, email);
      updateUser({ email: updated.email ?? email, username: updated.username ?? user.username });
      setFeedback({ severity: 'success', message: 'Adresse email mise à jour.' });
    } catch (error) {
      const message = getProfileErrorMessage(error, "Impossible de mettre à jour l'adresse email.");
      setEmailError(message);
      setFeedback({ severity: 'error', message });
    } finally {
      setEmailSaving(false);
    }
  };

  const submitPassword = async (values: ProfilePasswordFormValues) => {
    setPasswordError('');
    setPasswordSaving(true);

    try {
      const response = await profileService.changePassword(values);
      updateUser({ email: response.user.email ?? user?.email, username: response.user.username });
      passwordForm.reset(emptyPasswordValues);
      setFeedback({ severity: 'success', message: 'Mot de passe mis à jour.' });
    } catch (error) {
      const message = getProfileErrorMessage(error, 'Impossible de modifier le mot de passe.');
      setPasswordError(message);
      setFeedback({ severity: 'error', message });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ timeout: 250 }}>
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${brandColors.blue[600]}, ${brandColors.blue[400]}, ${alpha(brandColors.blue[300], 0.2)})` }} />
        <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={iconBox(brandColors.blue[600], 36)}>
                <AccountCircleRoundedIcon sx={{ fontSize: '1.1rem' }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', letterSpacing: '-0.01em' }}>
                  Mon compte
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.15 }}>
                  Consultez votre identifiant et modifiez vos identifiants de connexion.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: brandColors.slate[400], borderRadius: '10px', '&:hover': { color: brandColors.slate[600], backgroundColor: alpha(brandColors.slate[200], 0.3) } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ pt: '20px !important', pb: '24px !important' }}>
          {/* ── Nom d'utilisateur (lecture seule) ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              mb: 3,
              borderRadius: '14px',
              border: `1px solid ${brandColors.slate[200]}`,
              backgroundColor: alpha(brandColors.blue[600], 0.03),
            }}
          >
            <Box sx={iconBox(brandColors.blue[600], 42)}>
              <PersonRoundedIcon sx={{ fontSize: '1.25rem' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Nom d'utilisateur
              </Typography>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1rem', color: 'text.primary' }} noWrap>
                {user?.username || '—'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
                {user?.email || 'Aucune adresse email enregistrée'}
              </Typography>
            </Box>
          </Box>

          {/* ── Adresse email ── */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <EmailRoundedIcon sx={{ fontSize: 18, color: brandColors.blue[600] }} />
            <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.92rem' }}>
              Adresse email
            </Typography>
          </Stack>
          <form onSubmit={emailForm.handleSubmit(submitEmail)} autoComplete="off" noValidate>
            <Grid container spacing={1.5} alignItems="flex-start">
              <Grid item xs={12} sm={8}>
                <Controller
                  name="email"
                  control={emailForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type="email"
                      label="Email"
                      placeholder="mon.email@exemple.com"
                      error={!!emailForm.formState.errors.email}
                      helperText={emailForm.formState.errors.email?.message || 'Utilisée pour les notifications et la connexion'}
                      InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button type="submit" variant="contained" fullWidth disabled={emailSaving} sx={{ height: 40 }}>
                  {emailSaving ? 'Enregistrement...' : "Modifier l'email"}
                </Button>
              </Grid>
            </Grid>
          </form>
          {emailError ? <Alert severity="error" sx={{ mt: 1.5 }}>{emailError}</Alert> : null}

          <Divider sx={{ my: 3 }} />

          {/* ── Mot de passe ── */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <LockResetRoundedIcon sx={{ fontSize: 18, color: brandColors.blue[600] }} />
            <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.92rem' }}>
              Mot de passe
            </Typography>
          </Stack>
          <form onSubmit={passwordForm.handleSubmit(submitPassword)} autoComplete="off" noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type={showCurrent ? 'text' : 'password'}
                      label="Mot de passe actuel"
                      error={!!passwordForm.formState.errors.currentPassword}
                      helperText={passwordForm.formState.errors.currentPassword?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={inputIconSx} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowCurrent((value) => !value)} edge="end">
                              {showCurrent ? <VisibilityOffRoundedIcon sx={inputIconSx} /> : <VisibilityRoundedIcon sx={inputIconSx} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="password"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type={showNext ? 'text' : 'password'}
                      label="Nouveau mot de passe"
                      error={!!passwordForm.formState.errors.password}
                      helperText={passwordForm.formState.errors.password?.message || 'Au moins 6 caractères'}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LockResetRoundedIcon sx={inputIconSx} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowNext((value) => !value)} edge="end">
                              {showNext ? <VisibilityOffRoundedIcon sx={inputIconSx} /> : <VisibilityRoundedIcon sx={inputIconSx} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="passwordConfirmation"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type={showNext ? 'text' : 'password'}
                      label="Confirmer le mot de passe"
                      error={!!passwordForm.formState.errors.passwordConfirmation}
                      helperText={passwordForm.formState.errors.passwordConfirmation?.message}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LockResetRoundedIcon sx={inputIconSx} /></InputAdornment> }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={passwordSaving} sx={{ height: 40 }}>
                  {passwordSaving ? 'Enregistrement...' : 'Modifier le mot de passe'}
                </Button>
              </Grid>
            </Grid>
          </form>
          {passwordError ? <Alert severity="error" sx={{ mt: 1.5 }}>{passwordError}</Alert> : null}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={feedback?.severity ?? 'info'} variant="filled" onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
