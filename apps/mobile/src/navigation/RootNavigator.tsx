import { LoadingState } from '@/components/ui/LoadingState';
import { AppNavigator } from '@/navigation/AppNavigator';
import { LoginScreen } from '@/modules/auth/screens/LoginScreen';
import { useAuth } from '@/providers/AuthProvider';

export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState message="Initialisation..." />;
  }

  return isAuthenticated ? <AppNavigator /> : <LoginScreen />;
}

