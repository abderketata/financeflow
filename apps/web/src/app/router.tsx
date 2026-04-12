import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import ClientsPage from '@/modules/clients/pages/ClientsPage';
// import BanksPage from '@/modules/banks/pages/BanksPage';
import AccountsPage from '@/modules/accounts/pages/AccountsPage';
import PaymentItemsPage from '@/modules/payment-items/pages/PaymentItemsPage';
import AlertsPage from '@/modules/alerts/pages/AlertsPage';
import SettingsPage from '@/modules/settings/pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/clients', element: <ClientsPage /> },
      // { path: '/banks', element: <BanksPage /> },
      { path: '/accounts', element: <AccountsPage /> },
      { path: '/payment-items', element: <PaymentItemsPage /> },
      { path: '/transactions', element: <Navigate to="/dashboard" replace /> },
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/settings', element: <SettingsPage /> }
    ]
  }
]);

