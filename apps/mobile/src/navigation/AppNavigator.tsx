import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { DashboardScreen } from '@/modules/dashboard/screens/DashboardScreen';
import { ClientListScreen } from '@/modules/clients/screens/ClientListScreen';
import { ClientFormScreen } from '@/modules/clients/screens/ClientFormScreen';
import { PaymentItemListScreen } from '@/modules/payment-items/screens/PaymentItemListScreen';
import { PaymentItemFormScreen } from '@/modules/payment-items/screens/PaymentItemFormScreen';
import { TransactionListScreen } from '@/modules/transactions/screens/TransactionListScreen';
import { TransactionFormScreen } from '@/modules/transactions/screens/TransactionFormScreen';
import { AlertListScreen } from '@/modules/alerts/screens/AlertListScreen';
import { useUnreadAlertsBadge } from '@/modules/alerts/hooks/useAlerts';
import { ProfileScreen } from '@/modules/profile/screens/ProfileScreen';
import { SettingsScreen } from '@/modules/settings/screens/SettingsScreen';
import { stackRefreshQueries, tabRefreshQueries } from '@/app/businessNavigation';
import { MobileStackParamList } from '@/navigation/types';
import { useOpenFromUnreadSummary } from '@/services/notifications/appBadge';
import { brand, shadow } from '@/theme/brand';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MobileStackParamList>();

/** Titre de navigation : le logo, centré, comme sur la maquette. */
function HeaderLogo() {
  return (
    <View style={styles.headerTitle}>
      <BrandLogo size={30} />
    </View>
  );
}

function HeaderBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
      <Ionicons name="chevron-back" size={26} color={brand.blue600} />
    </Pressable>
  );
}

/**
 * En-tête blanc, ombre masquée, titre centré — commun à toutes les vues empilées.
 * Fonction et non constante : `styles` est déclaré plus bas dans le module.
 */
const getStackHeaderOptions = () => ({
  headerStyle: styles.header,
  headerShadowVisible: false,
  headerTitleAlign: 'center' as const,
  headerTitle: () => <HeaderLogo />,
  headerTintColor: brand.blue600,
});

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  ClientList: { active: 'people', inactive: 'people-outline' },
  PaymentItemList: { active: 'card', inactive: 'card-outline' },
  AlertList: { active: 'notifications', inactive: 'notifications-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

function MainTabs() {
  const queryClient = useQueryClient();
  // Nombre d'alertes non lues : pastille de l'onglet « Alertes » et pastille
  // de l'icône de l'application (voir `useUnreadAlertsBadge`).
  const unreadAlerts = useUnreadAlertsBadge();
  const navigation = useNavigation<NativeStackNavigationProp<MobileStackParamList>>();
  // Toucher la notification « N alertes non lues » ouvre l'onglet Alertes.
  useOpenFromUnreadSummary(() => navigation.navigate('Tabs', { screen: 'AlertList' } as never));

  return (
    <Tab.Navigator
      // Chaque clic sur un onglet repart du réseau : voir `tabRefreshQueries`.
      screenListeners={({ route }) => ({
        tabPress: () => {
          tabRefreshQueries[route.name]?.forEach((queryKey) => queryClient.resetQueries({ queryKey }));
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: brand.blue600,
        tabBarInactiveTintColor: brand.slate400,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused, size }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Dashboard;
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size - 2} color={color} />;
        },
      })}
    >
      {/* L'ordre de déclaration des `Tab.Screen` fixe l'ordre d'affichage :
          Accueil, Paiements, Alertes, Clients, Profil. */}
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen
        name="PaymentItemList"
        component={PaymentItemListScreen as React.ComponentType<any>}
        options={{ title: 'Paiements' }}
      />
      <Tab.Screen
        name="AlertList"
        component={AlertListScreen as React.ComponentType<any>}
        options={{
          title: 'Alertes',
          // `undefined` retire la pastille : `0` afficherait un rond vide.
          tabBarBadge: unreadAlerts > 0 ? (unreadAlerts > 99 ? '99+' : unreadAlerts) : undefined,
          tabBarBadgeStyle: styles.tabBadge,
        }}
      />
      <Tab.Screen
        name="ClientList"
        component={ClientListScreen as React.ComponentType<any>}
        options={{ title: 'Clients' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
      {/* « Opérations » et « Paramètres » restent accessibles via la pile
          (routes `TransactionList` et `Settings`). */}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const queryClient = useQueryClient();

  return (
    <Stack.Navigator
      // Les écrans empilés ne passent pas par la barre d'onglets : leur
      // rafraîchissement se déclenche à la prise de focus.
      screenListeners={({ route }) => ({
        focus: () => {
          stackRefreshQueries[route.name]?.forEach((queryKey) => queryClient.resetQueries({ queryKey }));
        },
      })}
      screenOptions={({ navigation }) => ({
        ...getStackHeaderOptions(),
        headerLeft: () =>
          navigation.canGoBack() ? <HeaderBack onPress={() => navigation.goBack()} /> : null,
      })}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ClientList" component={ClientListScreen} />
      <Stack.Screen name="ClientForm" component={ClientFormScreen} />
      <Stack.Screen name="PaymentItemList" component={PaymentItemListScreen} />
      <Stack.Screen name="PaymentItemForm" component={PaymentItemFormScreen} />
      <Stack.Screen name="TransactionList" component={TransactionListScreen} />
      <Stack.Screen name="TransactionForm" component={TransactionFormScreen} />
      <Stack.Screen name="AlertList" component={AlertListScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: brand.white,
  },
  headerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.slate200,
    // 5 onglets : hauteur généreuse pour que icône + libellé respirent.
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    ...shadow.card,
  },
  tabItem: {
    paddingHorizontal: 0,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },
  tabBadge: {
    backgroundColor: brand.danger,
    color: brand.white,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 18,
    lineHeight: 15,
  },
});
