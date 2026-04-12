import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { Screen } from '@/components/ui/Screen';
import { useCreateClient, useUpdateClient } from '@/modules/clients/hooks/useClients';
import { clientSchema, ClientFormValues } from '@/modules/clients/schemas/client.schema';
import { MobileStackParamList } from '@/navigation/types';

export function ClientFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'ClientForm'>) {
  const current = route.params?.client;
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const { control, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: current?.name || '',
      code: current?.code || '',
      phone: current?.phone || '',
      email: current?.email || '',
      address: current?.address || '',
      notes: current?.notes || ''
    }
  });

  // Construction dynamique du payload - ne jamais envoyer de champs vides inutiles
  const buildPayload = (values: ClientFormValues) => {
    const payload: Record<string, any> = {
      name: values.name?.trim() || '',
      phone: values.phone?.trim() || '',
    };

    // Champs optionnels : ajouter uniquement si renseignés
    const code = values.code?.trim() || '';
    if (code !== '') {
      payload.code = code;
    }

    // Email : ajouter UNIQUEMENT si renseigné
    const email = values.email?.trim() || '';
    if (email !== '') {
      payload.email = email;
    }

    const address = values.address?.trim() || '';
    if (address !== '') {
      payload.address = address;
    }

    const notes = values.notes?.trim() || '';
    if (notes !== '') {
      payload.notes = notes;
    }

    // Vérification obligatoire avant l'appel API
    console.log('[ClientFormScreen] Payload construit:', payload);

    return payload;
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{current ? 'Modifier client' : 'Nouveau client'}</Text>
        <Controller name="name" control={control} render={({ field }) => <AppTextField label="Nom" value={field.value || ''} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller name="code" control={control} render={({ field }) => <AppTextField label="Code" value={field.value || ''} onChangeText={field.onChange} />} />
        <Controller name="phone" control={control} render={({ field }) => <AppTextField label="Téléphone *" value={field.value || ''} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="numeric" />} />
        <Controller name="email" control={control} render={({ field }) => <AppTextField label="Email" value={field.value || ''} onChangeText={field.onChange} error={errors.email?.message as string | undefined} keyboardType="email-address" />} />
        <Controller name="address" control={control} render={({ field }) => <AppTextField label="Adresse" value={field.value || ''} onChangeText={field.onChange} />} />
        <Controller name="notes" control={control} render={({ field }) => <AppTextField label="Notes" value={field.value || ''} onChangeText={field.onChange} />} />
        <Pressable style={styles.button} onPress={handleSubmit(
          async (values) => {
            try {
              const payload = buildPayload(values);
              console.log('[ClientFormScreen] mode:', current ? 'edit' : 'create');
              console.log('[ClientFormScreen] clientId:', current?.id);
              if (current) {
                await updateMutation.mutateAsync({ id: current.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              navigation.goBack();
            } catch (error) {
              console.error('[ClientFormScreen] submit error:', error);
            }
          },
          (validationErrors) => {
            console.warn('[ClientFormScreen] validation errors:', validationErrors);
          },
        )}>
          <Text style={styles.buttonText}>{current ? 'Modifier' : 'Enregistrer'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16
  },
  button: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

