import { QueryClient } from '@tanstack/react-query';

const getErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const apiError = error as {
    status?: number;
    error?: {
      status?: number;
    };
    response?: {
      status?: number;
    };
  };

  return apiError.error?.status ?? apiError.status ?? apiError.response?.status;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (getErrorStatus(error) === 401) {
          return false;
        }

        return failureCount < 1;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false
    }
  }
});

