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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { z } from 'zod';
import { BrandMark } from '@/components/ui/BrandLogo';
import { useAuth } from '@/providers/AuthProvider';
import { brand } from '@/theme/brand';

const schema = z.object({
  identifier: z.string().min(2, 'Identifiant requis'),
  password: z.string().min(4, 'Mot de passe requis'),
});

type FormValues = z.infer<typeof schema>;

/** Halos diffus derrière la carte : évite un fond marine complètement plat. */
function BackdropGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glowTop" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={brand.blue500} stopOpacity={0.35} />
          <Stop offset="1" stopColor={brand.blue500} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glowBottom" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={brand.blue700} stopOpacity={0.3} />
          <Stop offset="1" stopColor={brand.blue700} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="15%" cy="12%" r="180" fill="url(#glowTop)" />
      <Circle cx="90%" cy="88%" r="220" fill="url(#glowBottom)" />
    </Svg>
  );
}

interface AuthFieldProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
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
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          Boolean(error) && styles.inputShellError,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={error ? brand.danger : focused ? brand.blue600 : brand.slate400}
        />
        <TextInput
          {...inputProps}
          ref={inputRef}
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
              size={18}
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
      <StatusBar barStyle="light-content" backgroundColor={brand.navy900} />
      <BackdropGlow />

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
            <View style={styles.card}>
              {/* En-tête : logo repris de l'application web */}
              <View style={styles.brandRow}>
                <BrandMark size={52} />
                <View style={styles.brandText}>
                  <Text style={styles.brandName}>Flux Financier</Text>
                  <Text style={styles.brandTagline}>Suivi des chèques et traites</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.heading}>Connexion</Text>
              <Text style={styles.headingSub}>
                Accédez à votre espace de suivi des encaissements et échéances.
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
                    placeholder="Nom d'utilisateur ou e-mail"
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
                    icon="lock-closed-outline"
                    placeholder="••••••••"
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
                  <>
                    <Text style={styles.buttonText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={17} color={brand.white} />
                  </>
                )}
              </Pressable>
            </View>

            <Text style={styles.footer}>CRM Finance Société · Version 1.0.0</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.navy900,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    // `maxWidth` : sans plafond, la carte s'étirait sur toute la largeur en web
    // et les champs devenaient des bandes de plusieurs centaines de pixels.
    width: '100%',
    maxWidth: 420,
    backgroundColor: brand.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 26,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 34,
    elevation: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    marginLeft: 13,
    flexShrink: 1,
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: brand.navy900,
  },
  brandTagline: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '500',
    color: brand.slate500,
  },
  divider: {
    height: 1,
    backgroundColor: brand.slate200,
    marginTop: 18,
    marginBottom: 18,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: brand.navy900,
  },
  headingSub: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 19,
    color: brand.slate500,
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
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate700,
    marginBottom: 6,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: brand.slate50,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    borderRadius: 13,
    paddingHorizontal: 13,
    height: 48,
  },
  inputShellFocused: {
    borderColor: brand.blue600,
    backgroundColor: brand.white,
  },
  inputShellError: {
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: brand.navy900,
    // Retire le contour bleu que le navigateur ajoute au focus en build web.
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  fieldError: {
    marginTop: 5,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    marginTop: 6,
    borderRadius: 13,
    backgroundColor: brand.blue600,
    shadowColor: brand.blue600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonPressed: {
    backgroundColor: brand.blue700,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    color: brand.white,
  },
  footer: {
    marginTop: 22,
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(226, 232, 240, 0.55)',
  },
});
