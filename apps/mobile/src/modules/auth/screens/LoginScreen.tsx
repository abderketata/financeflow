import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';

const schema = z.object({
  identifier: z.string().min(2, 'Identifiant requis'),
  password: z.string().min(4, 'Mot de passe requis')
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Flux Financier</Text>
        <Text style={styles.subtitle}>Connexion mobile Android professionnelle</Text>
        {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
        <Controller name="identifier" control={control} render={({ field }) => (
          <AppTextField label="Identifiant" value={field.value} onChangeText={field.onChange} error={errors.identifier?.message} />
        )} />
        <Controller name="password" control={control} render={({ field }) => (
          <AppTextField label="Mot de passe" value={field.value} onChangeText={field.onChange} secureTextEntry error={errors.password?.message} />
        )} />
        <Pressable style={styles.button} disabled={isSubmitting} onPress={handleSubmit(async (values) => {
          try {
            setServerError('');
            await login(values.identifier, values.password);
          } catch (error: any) {
            setServerError(error?.error?.message || 'Connexion impossible');
          }
        })}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0f172a'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
    marginBottom: 18
  },
  button: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  error: {
    color: '#dc2626',
    marginBottom: 10
  }
});

