import axios from 'axios';

const baseURL = (__API_BASE_URL__ || 'http://51.75.24.113:1334').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error?.response?.data ?? error)
);

