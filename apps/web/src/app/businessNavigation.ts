import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

export const routeRefreshQueries: Record<string, readonly unknown[][]> = {
  '/dashboard': [['dashboard-summary']],
  '/clients': [['clients'], ['accounts', 'available']],
  '/accounts': [['accounts'], ['clients']],
  '/payment-items': [['payment-items'], ['clients'], ['accounts']],
  '/transactions': [['transactions'], ['clients'], ['accounts'], ['payment-items']],
  '/alerts': [['alerts']],
  '/settings': [['settings']],
};

export const getBusinessRefreshKey = (state: unknown) => {
  if (typeof state !== 'object' || !state || !('businessRefreshKey' in state)) {
    return '';
  }

  return String((state as { businessRefreshKey?: string | number }).businessRefreshKey ?? '');
};

export const useBusinessNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  return useCallback((path: string) => {
    routeRefreshQueries[path]?.forEach((queryKey) => {
      queryClient.removeQueries({ queryKey });
    });

    navigate(path, {
      replace: location.pathname === path,
      state: { businessRefreshKey: `${path}-${Date.now()}` },
    });
  }, [location.pathname, navigate, queryClient]);
};

