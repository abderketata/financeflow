import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { AuthIllustration } from '@/components/ui/AuthIllustration';
import { BrandMark } from '@/components/ui/BrandLogo';
import { useAuth } from '@/providers/AuthProvider';
import { brand } from '@/theme/brand';

const schema = z.object({
  identifier: z.string().min(2, 'Identifiant requis'),
  password: z.string().min(4, 'Mot de passe requis'),
});

type FormValues = z.infer<typeof schema>;

interface AuthFieldProps {
  /** Sert de placeholder ET d'étiquette pour les lecteurs d'écran. */
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  secure?: boolean;
  autoComplete?: 'username' | 'password';
  returnKeyType?: 'next' | 'go';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

function AuthField({
  label,
  icon,
  error,
  secure = false,
  inputRef,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.field}>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          Boolean(error) && styles.inputShellError,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={error ? brand.danger : focused ? brand.blue600 : brand.slate400}
        />
        <TextInput
          {...inputProps}
          ref={inputRef}
          // Le champ n'a pas d'étiquette visible (style de la maquette) : on la
          // fournit explicitement pour ne pas la perdre à l'accessibilité.
          accessibilityLabel={label}
          placeholder={label}
          style={styles.input}
          placeholderTextColor={brand.slate400}
          secureTextEntry={secure && !revealed}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={brand.blue600}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((previous) => !previous)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={brand.slate400}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function LoginScreen() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      setServerError('');
      await login(values.identifier, values.password);
    } catch (error: any) {
      setServerError(error?.error?.message || 'Identifiant ou mot de passe incorrect.');
    }
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={brand.canvas} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* `maxWidth` : sans plafond, la colonne s'étire sur toute la fenêtre
                en build web et les champs deviennent des bandes démesurées. */}
            <View style={styles.column}>
              {/* Logo repris de l'application web */}
              <View style={styles.brandRow}>
                <BrandMark size={44} />
                <Text style={styles.brandName}>Flux Financier</Text>
              </View>

              <View style={styles.illustration}>
                <AuthIllustration width={300} />
              </View>

              <Text style={styles.heading}>Bienvenue</Text>
              <Text style={styles.headingSub}>
                Connectez-vous pour suivre vos chèques, traites et échéances.
              </Text>

              {serverError ? (
                <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                  <Ionicons name="alert-circle" size={17} color={brand.danger} />
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              ) : null}

              <Controller
                name="identifier"
                control={control}
                render={({ field }) => (
                  <AuthField
                    label="Identifiant"
                    icon="person-outline"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.identifier?.message}
                    autoComplete="username"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <AuthField
                    label="Mot de passe"
                    icon="lock-closed"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.password?.message}
                    secure
                    autoComplete="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    inputRef={passwordRef}
                  />
                )}
              />

              <Pressable
                onPress={submit}
                disabled={isSubmitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={brand.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Connexion</Text>
                )}
              </Pressable>

              <Text style={styles.footer}>CRM Finance Société · Version 1.0.0</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.canvas,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  column: {
    width: '100%',
    maxWidth: 400,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    marginLeft: 11,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: brand.navy900,
  },
  illustration: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 22,
  },
  heading: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: brand.navy900,
    textAlign: 'center',
  },
  headingSub: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 13,
    lineHeight: 19,
    color: brand.slate500,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: brand.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: brand.danger,
  },
  field: {
    marginBottom: 14,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 54,
  },
  inputShellFocused: {
    borderColor: brand.blue600,
  },
  inputShellError: {
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: brand.navy900,
    // Retire le contour bleu que le navigateur ajoute au focus en build web.
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  fieldError: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: brand.blue700,
    shadowColor: brand.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  buttonPressed: {
    backgroundColor: brand.navy800,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: brand.white,
  },
  footer: {
    marginTop: 24,
    fontSize: 11.5,
    fontWeight: '500',
    color: brand.slate400,
    textAlign: 'center',
  },
});
