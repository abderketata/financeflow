# Flux Financier Mobile

Application mobile React Native + Expo du monorepo **Flux Financier**.

Elle consomme la même API Strapi REST que l'application Web, mais reste totalement indépendante côté code source.

## Stack

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack Query
- React Hook Form
- Zod
- Axios

## Emplacement

```text
apps/mobile
```

## Prérequis

- Node.js
- npm
- Android Studio si vous voulez lancer l'application sur Android natif
- Une API Strapi accessible

## Configuration

La configuration API du mobile dépend de la variable d'environnement racine du monorepo.

Créer un fichier `.env` à la racine du projet :

```env
API_BASE_URL=http://51.75.24.113:1334
```

Cette valeur est injectée dans Expo via `app.config.js` puis lue dans l'application avec `Constants.expoConfig.extra.apiBaseUrl`.

## Installation

Depuis la racine du monorepo :

```powershell
npm run install:mobile
```

Ou directement depuis ce dossier :

```powershell
Set-Location "E:\CRMFinanceFlow\financeflow\apps\mobile"
npm install
```

## Lancement

### Démarrer Expo

Depuis la racine du monorepo :

```powershell
npm run dev:mobile
```

Ou depuis `apps/mobile` :

```powershell
Set-Location "E:\CRMFinanceFlow\financeflow\apps\mobile"
npm run start
```

### Lancer sur Android

Depuis la racine du monorepo :

```powershell
npm run android
```

Ou depuis `apps/mobile` :

```powershell
Set-Location "E:\CRMFinanceFlow\financeflow\apps\mobile"
npm run android
```

## Vérification TypeScript

Depuis la racine du monorepo :

```powershell
npm run typecheck:mobile
```

Ou depuis `apps/mobile` :

```powershell
Set-Location "E:\CRMFinanceFlow\financeflow\apps\mobile"
npm run typecheck
```

## Structure principale

```text
src/
  app/
  components/
  modules/
  navigation/
  providers/
  services/
  types/
  utils/
```

## Organisation des modules

Chaque module suit en général cette structure :

```text
modules/<nom>/
  hooks/
  schemas/
  screens/
  services/
  utils/
```

## Authentification

- Endpoint Strapi : `POST /api/auth/local`
- Le token JWT est stocké dans `expo-secure-store`
- Clé utilisée : `financeflow_token`
- Le header `Authorization: Bearer <token>` est ajouté automatiquement par Axios

## API et normalisation Strapi

- Les appels HTTP passent par `src/services/api/`
- Les réponses Strapi sont aplaties via `src/utils/strapi.ts`
- Les services CRUD utilisent le pattern `createCrudService(...)`
- Les payloads envoyés à Strapi sont encapsulés sous la forme `{ data: payload }`

## Navigation

- Navigation principale : `src/navigation/AppNavigator.tsx`
- Types de routes : `src/navigation/types.ts`

## Fichiers importants

- `App.tsx` : point d'entrée Expo
- `app.config.js` : configuration Expo + injection de `API_BASE_URL`
- `src/providers/AuthProvider.tsx` : session utilisateur
- `src/services/api/client.ts` : client Axios
- `src/types/index.ts` : types domaine mobile

## Notes utiles

- L'alias `@/` pointe vers `src/`
- Le projet mobile ne partage pas de package interne avec le Web
- Il n'y a pas de mock API ni de tests automatisés configurés dans ce projet
- Le backend attendu est Strapi REST

