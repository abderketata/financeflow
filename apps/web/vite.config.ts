import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      __API_BASE_URL__: JSON.stringify(env.API_BASE_URL || 'http://51.75.24.113:1334')
    },
    server: {
      port: 8100,
      host: '0.0.0.0'
    }
  };
});

