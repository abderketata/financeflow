import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { DashboardScreen } from '@/modules/dashboard/screens/DashboardScreen';
import { ClientListScreen } from '@/modules/clients/screens/ClientListScreen';
import { ClientFormScreen } from '@/modules/clients/screens/ClientFormScreen';
import { PaymentItemListScreen } from '@/modules/payment-items/screens/PaymentItemListScreen';
import { PaymentItemFormScreen } from '@/modules/payment-items/screens/PaymentItemFormScreen';
import { TransactionListScreen } from '@/modules/transactions/screens/TransactionListScreen';
import { TransactionFormScreen } from '@/modules/transactions/screens/TransactionFormScreen';
import { AlertListScreen } from '@/modules/alerts/screens/AlertListScreen';
import { ProfileModal } from '@/modules/profile/components/ProfileModal';
import { SettingsScreen } from '@/modules/settings/screens/SettingsScreen';
import { MobileStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
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
 * Bouton à l'extrême droite de l'en-tête : ouvre « Mon compte » (nom
 * d'utilisateur, modification de l'email et du mot de passe).
 */
function HeaderProfile() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = String(user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <Pressable
        onPress={() => setProfileOpen(true)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Mon compte"
        style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
      >
        <Text style={styles.profileInitial}>{initial || '?'}</Text>
      </Pressable>
      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
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
  headerRight: () => <HeaderProfile />,
});

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  ClientList: { active: 'people', inactive: 'people-outline' },
  PaymentItemList: { active: 'card', inactive: 'card-outline' },
  AlertList: { active: 'notifications', inactive: 'notifications-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
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
          Accueil, Paiements, Alertes, Clients. */}
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen
        name="PaymentItemList"
        component={PaymentItemListScreen as React.ComponentType<any>}
        options={{ title: 'Paiements' }}
      />
      <Tab.Screen
        name="AlertList"
        component={AlertListScreen as React.ComponentType<any>}
        options={{ title: 'Alertes' }}
      />
      <Tab.Screen
        name="ClientList"
        component={ClientListScreen as React.ComponentType<any>}
        options={{ title: 'Clients' }}
      />
      {/* « Opérations » et « Profil » sont retirés de la barre : leurs écrans
          restent accessibles via la pile (routes `TransactionList` et `Settings`). */}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        ...getStackHeaderOptions(),
        headerLeft: () =>
          navigation.canGoBack() ? <HeaderBack onPress={() => navigation.goBack()} /> : null,
      })}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
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
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.blue600,
  },
  profileButtonPressed: {
    backgroundColor: brand.blue700,
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.white,
  },
  tabBar: {
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.slate200,
    // 6 onglets : hauteur généreuse pour que icône + libellé respirent.
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
});
