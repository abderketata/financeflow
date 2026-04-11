import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Alert, Box, Card, CardContent, Divider, Stack, Typography, alpha } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SettingsForm } from '@/modules/settings/components/SettingsForm';
import { useSettings, useUpdateSettings } from '@/modules/settings/hooks/useSettings';
import { useState } from 'react';
import { brandColors, iconBox, headingFont } from '@/app/theme';

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = useSettings();
  const updateMutation = useUpdateSettings();
  const [success, setSuccess] = useState('');

  if (isLoading) return <LoadingState message="Chargement des paramètres..." />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} message="Impossible de charger les paramètres." />;

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Devise, alertes et préférences d'affichage de votre espace" />
      <Card>
        <CardContent sx={{ p: '24px !important' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={iconBox(brandColors.blue[600], 40)}>
              <SettingsRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '0.98rem' }}>
                Préférences générales
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Configurez votre environnement de travail
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <SettingsForm
            defaultValues={data}
            loading={updateMutation.isPending}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync(values as any);
              setSuccess('Paramètres enregistrés avec succès.');
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
