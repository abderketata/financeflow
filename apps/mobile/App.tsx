import 'react-native-gesture-handler';
// Définit la tâche d'arrière-plan dès l'évaluation du bundle (lancement headless).
import '@/services/notifications/alertsBadgeTask';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/queryClient';
import { DialogHost } from '@/components/ui/DialogHost';
import { AuthProvider } from '@/providers/AuthProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <DialogHost />
      </AuthProvider>
    </QueryClientProvider>
  );
}
