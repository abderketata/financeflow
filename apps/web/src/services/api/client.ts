import axios from 'axios';
import qs from 'qs';

const baseURL = (__API_BASE_URL__ || 'http://51.75.24.113:1334').replace(/\/$/, '');
const PAYMENT_ITEMS_ENDPOINT_PATTERN = /(^|\/)payment-items(\/|$)/;

const isPaymentItemsDebugEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return import.meta.env.DEV || window.localStorage.getItem('financeflow_debug_payment_items') === '1';
};

const isPaymentItemsRequest = (url?: string) => Boolean(url && PAYMENT_ITEMS_ENDPOINT_PATTERN.test(url));

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string | null) => {
  if (!token) {
    return null;
  }

  try {
    const [, payload = ''] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const getPaymentItemsAuthSummary = (token: string | null) => ({
  bearerPresent: Boolean(token),
  probableAuthKind: token ? 'users-permissions (/auth/local)' : 'none',
  tokenPreview: token ? `${token.slice(0, 16)}…` : null,
  storedUser: parseJson('localStorage' in window ? window.localStorage.getItem('financeflow_user') : null),
  jwtPayload: decodeJwtPayload(token),
});

const getHeaderValue = (headers: unknown, key: string) => {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  return (headers as Record<string, unknown>)[key] ?? (headers as Record<string, unknown>)[key.toLowerCase()];
};

const logPaymentItemsRequest = (label: string, details: Record<string, unknown>) => {
  console.groupCollapsed(`[financeflow][payment-items] ${label}`);
  Object.entries(details).forEach(([key, value]) => console.log(key, value));
  console.groupEnd();
};

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  paramsSerializer: (params) => qs.stringify(params, { encodeValuesOnly: true }),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isPaymentItemsDebugEnabled() && isPaymentItemsRequest(config.url)) {
    logPaymentItemsRequest('request', {
      endpoint: `${config.baseURL ?? ''}${config.url ?? ''}`,
      method: (config.method ?? 'get').toUpperCase(),
      headers: {
        'Content-Type': getHeaderValue(config.headers, 'Content-Type'),
        Authorization: getHeaderValue(config.headers, 'Authorization') ? 'Bearer <présent>' : null,
      },
      auth: getPaymentItemsAuthSummary(token),
      payload: config.data,
      params: config.params,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (isPaymentItemsDebugEnabled() && isPaymentItemsRequest(response.config?.url)) {
      logPaymentItemsRequest('response', {
        endpoint: `${response.config?.baseURL ?? ''}${response.config?.url ?? ''}`,
        method: (response.config?.method ?? 'get').toUpperCase(),
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    if (isPaymentItemsDebugEnabled() && isPaymentItemsRequest(error?.config?.url)) {
      logPaymentItemsRequest('error', {
        endpoint: `${error?.config?.baseURL ?? ''}${error?.config?.url ?? ''}`,
        method: (error?.config?.method ?? 'get').toUpperCase(),
        status: error?.response?.status,
        data: error?.response?.data,
      });
    }

    return Promise.reject(error?.response?.data ?? error);
  }
);

