# AGENTS.md — Flux Financier

## Architecture globale

Monorepo avec deux applications consommant la **même API Strapi REST** :

| App | Chemin | Stack |
|-----|--------|-------|
| Web | `apps/web` | React + Vite + TypeScript + Material UI + React Router |
| Mobile | `apps/mobile` | React Native + Expo + TypeScript + React Navigation |

Les deux apps partagent les mêmes patterns (services, hooks, schemas) mais sont **totalement indépendantes** — pas de package partagé entre elles.

---

## Commandes essentielles (depuis la racine)

```powershell
npm run install:all       # installer les deux apps
npm run dev:web           # démarrer le serveur Web (port 8100)
npm run dev:mobile        # démarrer Metro (Expo)
npm run android           # build + lancer sur Android
npm run typecheck:web
npm run typecheck:mobile
```

**Variable d'environnement unique** : créer `.env` à la racine du monorepo (pas dans `apps/`) :
```
API_BASE_URL=http://51.75.24.113:1334
```
- Web : injectée via `vite.config.ts` comme `__API_BASE_URL__` (global Vite `define`)
- Mobile : lue depuis `app.config.js` via `Constants.expoConfig.extra.apiBaseUrl`

---

## Couche API / Strapi

### Unwrapping des réponses Strapi
Toutes les réponses Strapi sont normalisées via `utils/strapi.ts` (`unwrapCollection`, `unwrapSingle`). Ces fonctions aplatissent la structure `{ data: [{ id, attributes: {...} }] }` en objets plats avec `id`.

### Service CRUD générique
```typescript
// Exemple d'usage dans les deux apps
const clientService = createCrudService<Client, ClientPayload>('/clients');
// → .list(params) .get(id) .create(payload) .update(id, payload) .remove(id)
```
Toujours passer `{ data: payload }` en body — géré automatiquement dans `crud.ts`.

### Authentification
- **Web** : token JWT stocké dans `localStorage` sous la clé `financeflow_token`
- **Mobile** : token stocké dans `expo-secure-store` sous la même clé
- L'intercepteur Axios ajoute le header `Authorization: Bearer <token>` automatiquement
- Endpoint Strapi : `POST /api/auth/local`

---

## Organisation des modules

Chaque module suit une structure cohérente dans les deux apps :

```
modules/<nom>/
  hooks/        # useQuery / useMutation TanStack Query
  schemas/      # Zod schemas pour validation de formulaire
  services/     # appels API (createCrudService ou custom)
  pages/ (web) ou screens/ (mobile)
  components/   # composants propres au module
  utils/        # helpers métier du module
```

---

## Patterns de données clés

- **Types domaine** (web) : `src/types/domain.ts` — source de vérité pour `Client`, `PaymentItem`, `Transaction`, `Alert`, `BankAccount`, `DashboardSummary`
- **Types domaine** (mobile) : `src/types/index.ts`
- Les relations Strapi peuvent arriver sous forme de tableau ou `{ data: [...] }` → utiliser `RelationCollection<T>` pour typer
- Erreurs de validation Strapi : `getStrapiFieldError(error, 'fieldName')` depuis `utils/strapi.ts`

---

## Navigation

- **Web** : React Router, routes définies dans `src/app/router.tsx`, protégées par `<ProtectedRoute>`; layout principal `<AppLayout>`
- **Mobile** : Stack + BottomTab dans `AppNavigator.tsx`; types des routes dans `navigation/types.ts`

---

## Points d'attention

- La route `/transactions` sur le web redirige vers `/dashboard` (non implémentée)
- Le module `banks` est commenté dans le router web mais le hook `useBanks` est chargé au login dans `AuthProvider` (prefetch)
- Alias `@/` disponible dans les deux apps (pointe vers `src/`)
- Pas de mock API ni de tests automatisés configurés dans le projet

