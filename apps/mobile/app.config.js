const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

const apiBaseUrl = process.env.API_BASE_URL || 'http://51.75.24.113:1334';

module.exports = {
  expo: {
    name: 'Flux Financier',
    slug: 'financeflow',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#0f172a'
    },
    assetBundlePatterns: ['**/*'],
    android: {
      package: 'com.financeflow.app'
    },
    extra: {
      apiBaseUrl
    }
  }
};

