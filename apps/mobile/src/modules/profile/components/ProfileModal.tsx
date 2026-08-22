// ProfileModal — équivalent mobile de la boîte « Mon compte » du web :
// nom d'utilisateur en lecture seule, modification de l'email et du mot de passe.
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
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

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
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

  // À chaque ouverture : email courant rechargé, champs mot de passe vidés.
  useEffect(() => {
    if (!visible) {
      return;
    }

    emailForm.reset({ email: user?.email ?? '' });
    passwordForm.reset(emptyPasswordValues);
    setEmailFeedback(null);
    setPasswordFeedback(null);
  }, [visible, user?.email]);

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Mon compte</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Identifiant, email et mot de passe
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={18} color={brand.slate600} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: brand.canvas,
  },
  header: {
    backgroundColor: brand.white,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.lg + 2,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: brand.navy900,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.slate500,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
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
