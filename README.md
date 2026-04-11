# Flux Financier

Application de gestion financière Web + Android consommant une API Strapi existante.

## Stack

- Web : React + TypeScript + Vite + Material UI
- Mobile : React Native + Expo + TypeScript
- API : REST + Axios
- Data fetching : TanStack Query
- Formulaires : React Hook Form + Zod
- Navigation Web : React Router
- Navigation Mobile : React Navigation

## API

Une seule variable d'environnement pilote les deux applications : `API_BASE_URL`.

Base URL par défaut : `http://51.75.24.113:1334`

## Structure

- `apps/web` : application Web
- `apps/mobile` : application Android via Expo

## Démarrage

### Web

```powershell
cd C:\FinanceFlow
Copy-Item .env.example .env
npm run install:web
npm run dev:web
```

### Mobile

```powershell
cd C:\FinanceFlow
Copy-Item .env.example .env
npm run install:mobile
npm run dev:mobile
```

### Android

```powershell
cd C:\FinanceFlow
npm run android
```

## Remarques

- Le projet est conçu pour `node v14.21.3` / `npm 6.14.16`, détectés dans l'environnement.
- Les endpoints Strapi sont consommés sans mock côté application.
- Le Web et le Mobile lisent tous les deux l'URL Strapi depuis `C:\FinanceFlow\.env` via `API_BASE_URL`.
- Si l'auth Strapi utilise un endpoint différent de `/api/auth/local`, ajuster `services/api/auth.ts` dans chaque app.

