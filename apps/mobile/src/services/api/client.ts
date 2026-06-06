import axios from 'axios';
import Constants from 'expo-constants';
import { getStoredToken, getStoredUser, summarizeToken } from '@/services/api/authStorage';
import { handleUnauthorizedSession } from '@/services/api/authSession';

const extra = (Constants.expoConfig?.extra || Constants.manifest?.extra || {}) as { apiBaseUrl?: string };
const baseURL = (extra.apiBaseUrl || 'http://51.75.24.113:1334').replace(/\/$/, '');
const PAYMENT_ITEMS_ENDPOINT_PATTERN = /(^|\/)payment-items(\/|$)/;
const AUTH_LOGIN_ENDPOINT_PATTERN = /(^|\/)auth\/local(\/|$)/;

const isPaymentItemsDebugEnabled = () => typeof __DEV__ !== 'undefined' && __DEV__;

const isPaymentItemsRequest = (url?: string) => Boolean(url && PAYMENT_ITEMS_ENDPOINT_PATTERN.test(url));
const isAuthLoginRequest = (url?: string) => Boolean(url && AUTH_LOGIN_ENDPOINT_PATTERN.test(url));

const getHeaderValue = (headers: unknown, key: string) => {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  return (headers as Record<string, unknown>)[key] ?? (headers as Record<string, unknown>)[key.toLowerCase()];
};

const logPaymentItemsRequest = (label: string, details: Record<string, unknown>) => {
  console.log(`[financeflow-mobile][payment-items] ${label}`, details);
};

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();

  if (token && !isAuthLoginRequest(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  if (isPaymentItemsDebugEnabled() && isPaymentItemsRequest(config.url)) {
    logPaymentItemsRequest('request', {
      endpoint: `${config.baseURL ?? ''}${config.url ?? ''}`,
      method: (config.method ?? 'get').toUpperCase(),
      headers: {
        'Content-Type': getHeaderValue(config.headers, 'Content-Type'),
        Authorization: getHeaderValue(config.headers, 'Authorization') ? 'Bearer <présent>' : null,
      },
      token: summarizeToken(token),
      storedUser: await getStoredUser(),
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
  async (error) => {
    if (isPaymentItemsDebugEnabled() && isPaymentItemsRequest(error?.config?.url)) {
      logPaymentItemsRequest('error', {
        endpoint: `${error?.config?.baseURL ?? ''}${error?.config?.url ?? ''}`,
        method: (error?.config?.method ?? 'get').toUpperCase(),
        status: error?.response?.status,
        data: error?.response?.data,
      });
    }

    if (error?.response?.status === 401) {
      await handleUnauthorizedSession();
    }

    return Promise.reject(error?.response?.data ?? error);
  }
);

