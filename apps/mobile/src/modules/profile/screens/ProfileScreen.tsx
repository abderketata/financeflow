// ProfileScreen — onglet « Profil » : nom d'utilisateur en lecture seule,
// modification de l'email et du mot de passe. Équivalent mobile de la boîte
// « Mon compte » du web.
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import {
  ProfileEmailFormValues,
  ProfilePasswordFormValues,
  profileEmailSchema,
  profilePasswordSchema,
} from '@/modules/profile/schemas/profile.schema';
import { profileService } from '@/modules/profile/services/profile.service';
import { getProfileErrorMessage } from '@/modules/profile/utils/profileErrors';
import { useAuth } from '@/providers/AuthProvider';
import { brand, radius, spacing } from '@/theme/brand';

const emptyPasswordValues: ProfilePasswordFormValues = {
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
};

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const emailForm = useForm<ProfileEmailFormValues>({
    resolver: zodResolver(profileEmailSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  const passwordForm = useForm<ProfilePasswordFormValues>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: emptyPasswordValues,
  });

  const submitEmail = async ({ email }: ProfileEmailFormValues) => {
    if (!user?.id) {
      setEmailFeedback({ kind: 'error', message: 'Utilisateur introuvable dans la session courante.' });
      return;
    }

    setEmailFeedback(null);
    setEmailSaving(true);

    try {
      const updated = await profileService.updateEmail(user.id, email);
      await updateUser({ email: updated.email ?? email, username: updated.username ?? user.username });
      setEmailFeedback({ kind: 'success', message: 'Adresse email mise à jour.' });
    } catch (error) {
      setEmailFeedback({
        kind: 'error',
        message: getProfileErrorMessage(error, "Impossible de mettre à jour l'adresse email."),
      });
    } finally {
      setEmailSaving(false);
    }
  };

  const submitPassword = async (values: ProfilePasswordFormValues) => {
    setPasswordFeedback(null);
    setPasswordSaving(true);

    try {
      const response = await profileService.changePassword(values);
      await updateUser({ email: response.user.email ?? user?.email, username: response.user.username });
      passwordForm.reset(emptyPasswordValues);
      setPasswordFeedback({ kind: 'success', message: 'Mot de passe mis à jour.' });
    } catch (error) {
      setPasswordFeedback({
        kind: 'error',
        message: getProfileErrorMessage(error, 'Impossible de modifier le mot de passe.'),
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>
            Votre identifiant de connexion, votre adresse email et votre mot de passe
          </Text>

          {/* ── Nom d'utilisateur (lecture seule) ── */}
          <View style={styles.identityCard}>
            <View style={styles.identityMedallion}>
              <Ionicons name="person" size={20} color={brand.blue600} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.identityLabel}>Nom d'utilisateur</Text>
              <Text style={styles.identityValue} numberOfLines={1}>
                {user?.username || '—'}
              </Text>
              <Text style={styles.identityEmail} numberOfLines={1}>
                {user?.email || 'Aucune adresse email enregistrée'}
              </Text>
            </View>
          </View>

          {/* ── Email ── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="mail-outline" size={16} color={brand.blue600} />
              <Text style={styles.cardTitle}>Adresse email</Text>
            </View>
            <Controller
              name="email"
              control={emailForm.control}
              render={({ field }) => (
                <AppTextField
                  label="Email"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="mon.email@exemple.com"
                  keyboardType="email-address"
                  icon="mail-outline"
                  error={emailForm.formState.errors.email?.message}
                />
              )}
            />
            <AppButton
              label="Modifier l'email"
              icon="save-outline"
              loading={emailSaving}
              onPress={emailForm.handleSubmit(submitEmail)}
            />
            {emailFeedback ? (
              <Text style={[styles.feedback, emailFeedback.kind === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
                {emailFeedback.message}
              </Text>
            ) : null}
          </View>

          {/* ── Mot de passe ── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="lock-closed-outline" size={16} color={brand.blue600} />
              <Text style={styles.cardTitle}>Mot de passe</Text>
            </View>
            <Controller
              name="currentPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <AppTextField
                  label="Mot de passe actuel"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="••••••"
                  secureTextEntry
                  icon="lock-closed-outline"
                  error={passwordForm.formState.errors.currentPassword?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={passwordForm.control}
              render={({ field }) => (
                <AppTextField
                  label="Nouveau mot de passe"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="Au moins 6 caractères"
                  secureTextEntry
                  icon="key-outline"
                  error={passwordForm.formState.errors.password?.message}
                />
              )}
            />
            <Controller
              name="passwordConfirmation"
              control={passwordForm.control}
              render={({ field }) => (
                <AppTextField
                  label="Confirmer le mot de passe"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="Répétez le nouveau mot de passe"
                  secureTextEntry
                  icon="key-outline"
                  error={passwordForm.formState.errors.passwordConfirmation?.message}
                />
              )}
            />
            <AppButton
              label="Modifier le mot de passe"
              icon="shield-checkmark-outline"
              loading={passwordSaving}
              onPress={passwordForm.handleSubmit(submitPassword)}
            />
            {passwordFeedback ? (
              <Text style={[styles.feedback, passwordFeedback.kind === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
                {passwordFeedback.message}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: brand.navy900,
  },
  subtitle: {
    marginTop: -spacing.sm,
    fontSize: 12.5,
    lineHeight: 18,
    color: brand.slate500,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.slate200,
    padding: spacing.lg,
  },
  identityMedallion: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.blue50,
  },
  identityLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: brand.slate500,
  },
  identityValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: brand.navy900,
  },
  identityEmail: {
    marginTop: 1,
    fontSize: 12,
    color: brand.slate500,
  },
  card: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.slate200,
    padding: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg - 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.navy900,
  },
  feedback: {
    marginTop: spacing.md,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  feedbackError: {
    color: brand.danger,
  },
  feedbackSuccess: {
    color: brand.credit,
  },
});
