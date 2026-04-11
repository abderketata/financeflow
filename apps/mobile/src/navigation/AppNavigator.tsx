import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@/modules/dashboard/screens/DashboardScreen';
import { ClientListScreen } from '@/modules/clients/screens/ClientListScreen';
import { ClientFormScreen } from '@/modules/clients/screens/ClientFormScreen';
import { PaymentItemListScreen } from '@/modules/payment-items/screens/PaymentItemListScreen';
import { PaymentItemFormScreen } from '@/modules/payment-items/screens/PaymentItemFormScreen';
import { TransactionListScreen } from '@/modules/transactions/screens/TransactionListScreen';
import { TransactionFormScreen } from '@/modules/transactions/screens/TransactionFormScreen';
import { AlertListScreen } from '@/modules/alerts/screens/AlertListScreen';
import { MobileStackParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MobileStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="ClientList" component={ClientListScreen as React.ComponentType<any>} options={{ title: 'Clients' }} />
      <Tab.Screen name="PaymentItemList" component={PaymentItemListScreen as React.ComponentType<any>} options={{ title: 'Paiements' }} />
      <Tab.Screen name="TransactionList" component={TransactionListScreen as React.ComponentType<any>} options={{ title: 'Opérations' }} />
      <Tab.Screen name="AlertList" component={AlertListScreen as React.ComponentType<any>} options={{ title: 'Alertes' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ClientList" component={ClientListScreen} options={{ title: 'Clients' }} />
      <Stack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: 'Client' }} />
      <Stack.Screen name="PaymentItemList" component={PaymentItemListScreen} options={{ title: 'Paiements' }} />
      <Stack.Screen name="PaymentItemForm" component={PaymentItemFormScreen} options={{ title: 'Paiement' }} />
      <Stack.Screen name="TransactionList" component={TransactionListScreen} options={{ title: 'Opérations' }} />
      <Stack.Screen name="TransactionForm" component={TransactionFormScreen} options={{ title: 'Opération' }} />
      <Stack.Screen name="AlertList" component={AlertListScreen} options={{ title: 'Alertes' }} />
    </Stack.Navigator>
  );
}

