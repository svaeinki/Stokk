# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stokk is a React Native + Expo inventory management mobile app with offline SQLite storage. The app supports English and Spanish (i18n via i18next) and targets both iOS (11.0+) and Android (API 21+).

**Requirements:** Node 22 (see `.nvmrc`), npm 10+. For iOS: macOS with Xcode 15+. For Android: Android Studio with SDK 21+.

## Development Commands

```bash
# Start Expo development server
npm run start

# Run on specific platform
npm run ios          # iOS simulator/device
npm run android      # Android emulator/device
npm run web          # Web browser

# Code quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all files
npm run format:check # Prettier check (CI)
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
npm run test:ci      # CI mode (no watch, with coverage, passWithNoTests)
npm run test -- src/__tests__/validation.test.ts  # Run single test file

# EAS builds (requires EAS CLI)
eas build --profile development --platform ios
eas build --profile production --platform all

# Development build (recommended over Expo Go)
npx expo run:ios      # First time: compiles native app
npx expo run:android  # Then use `npm run start` for hot reload
```

**Development build vs Expo Go:** Use development builds for RevenueCat/Sentry to work correctly, custom splash/icons visible, and production-like experience. Only recompile when adding native dependencies.

## Architecture

### Tech Stack

- **Framework:** React Native 0.81 + Expo SDK 54
- **Language:** TypeScript (strict mode)
- **UI:** React Native Paper (Material Design 3)
- **Navigation:** React Navigation v7 (bottom tabs + native stack)
- **Storage:** expo-sqlite (SQLite), AsyncStorage
- **Validation:** Zod (runtime schema validation)
- **i18n:** i18next + react-i18next + expo-localization
- **Subscriptions:** RevenueCat (react-native-purchases)
- **Error Tracking:** Sentry

### Source Structure (`src/`)

| Directory     | Purpose                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `components/` | Reusable UI components (`ArticuloForm`, `ArticuloList`, `form/*`)                  |
| `context/`    | React Context providers (`ThemeContext`, `SnackbarContext`)                        |
| `database/`   | `DatabaseManager.ts` - singleton SQLite CRUD operations                            |
| `hooks/`      | Custom hooks (`useSubscriptionLimit`, `useArticuloForm`, `useArticuloSubmit`)      |
| `i18n/`       | Internationalization setup and locale files (`locales/es.json`, `locales/en.json`) |
| `screens/`    | Screen components (Inventario, Buscar, Ingresar, Config, Paywall)                  |
| `services/`   | `SubscriptionService` (RevenueCat), `ImageService` (camera/gallery), `SentryService` |
| `types/`      | TypeScript types (`navigation.ts`, `errors.ts`)                                    |
| `utils/`      | `Validation.ts` (formatting), `Logger.ts` (silenced in production)                 |
| `validation/` | Zod schemas for data validation (`schemas.ts`)                                     |
| `constants/`  | App constants including `FREE_TIER_PRODUCT_LIMIT` and color palette                |

### Navigation Structure

```
Root Stack Navigator
├── MainTabs (Bottom Tab Navigator)
│   ├── Inventario - Product list with search
│   ├── Buscar - Search screen
│   ├── Ingresar - Add product form
│   └── Config - Settings
└── Paywall (Modal) - Subscription screen
```

### Database Schema

Single table `articulos` with fields: id, nombre, descripcion, precio (integer), cantidad, imagen (URI), numeroBodega, observaciones, fechaIngreso, fechaModificacion. Indexed on nombre, numeroBodega, and fechaIngreso (descending).

```typescript
interface Articulo {
  id?: number;
  nombre: string; // Product name
  descripcion: string; // Description
  precio: number; // Price in Chilean Pesos (integer)
  cantidad: number; // Quantity
  imagen?: string; // Image URI (local file path)
  numeroBodega: string; // Warehouse/location code (optional free-text)
  observaciones?: string; // Notes
  fechaIngreso: string; // Created date
  fechaModificacion?: string; // Modified date
}
```

### Entry Point

`index.ts` → `App.tsx`. Uses React Navigation (imperative), **not** expo-router file-based routing (expo-router is in plugins but unused for navigation).

### Path Alias

`~/` maps to `src/` in imports (configured in tsconfig via `expo/tsconfig.base` and mirrored in `jest.config.js`). Example: `import db from '~/database/DatabaseManager'`.

### Key Patterns

- **Singletons:** `DatabaseManager`, `SubscriptionService`, and `ImageService` are all singleton instances exported as default.
- **DatabaseManager:** Lazy initialization with `initDatabase()` using promise caching (`initPromise`). All CRUD methods are async and use prepared statements. SQLite database file: `mi_inventario.db`.
- **SubscriptionService:** RevenueCat wrapper with 5-minute cache for pro status. Gracefully handles missing API keys (returns false/null instead of throwing).
- **App init sequence:** Sentry first → i18n → Database → RevenueCat (non-blocking). Module-level `appInitialized` flag prevents re-initialization in React Strict Mode.
- **ErrorBoundary:** Class component in `App.tsx` wraps the entire app, catches uncaught errors and shows fallback UI with restart.
- **ThemeContext:** Provides both Paper theme and Navigation theme, respects system color scheme.
- **SnackbarContext:** Global toast notifications via `useSnackbar()` hook with `showSuccess()`, `showError()`, `showInfo()` methods.
- **i18n:** Language persisted in AsyncStorage, falls back to device locale then Spanish. Use `useTranslation()` hook and `t('key')` for translations.
- **Zod validation:** Use schemas in `src/validation/schemas.ts` for form validation (`articuloSchema`, `crearArticuloSchema`, `actualizarArticuloSchema`).
- **Currency:** Prices stored as integers (Chilean Pesos), formatted with `Validation.ts` utilities.
- **Free tier limit:** 20 products max without subscription (`FREE_TIER_PRODUCT_LIMIT` in `src/constants/app.ts`).
- **Colors:** Use `PALETTE` from `src/constants/app.ts` for theme colors and `COLORS` for semantic colors (success, warning, error, gold). ESLint warns on inline styles and color literals.

### Code Style

**Prettier** (`.prettierrc.json`): single quotes, trailing commas (es5), no parens on single arrow params (`x => x`), 2-space indent, 80 char width, LF line endings, double quotes in JSX.

**ESLint** (`.eslintrc.json`):
- Unused function args must be prefixed with `_` (e.g., `_event`).
- `no-console: warn` — use `Logger` from `src/utils/Logger.ts` instead of `console.*`.
- `no-inline-styles: warn` and `no-color-literals: warn` — prefer `StyleSheet.create()` and `PALETTE`/`COLORS` constants.
- `no-explicit-any: warn` — avoid `any`, use proper types.
- `react-hooks/exhaustive-deps: "error"` — dependency arrays must be complete.
- `react-native/no-unused-styles: "error"` — catches unused `StyleSheet` entries.
- `prettier/prettier: "error"` — formatting violations are errors, not warnings.

### Testing

Tests live in `src/__tests__/` mirroring the source structure. Jest uses `react-native` preset with `babel-jest` transform. Setup files: `jest.setup.js` (mocks for expo-sqlite, RevenueCat, AsyncStorage, react-i18next, etc.) and `jest.env.js` (env vars). `transformIgnorePatterns` allows react-native, expo, @react-navigation packages to be transformed.

## Configuration

- **Environment variables** (see `.env.example`): `EXPO_PUBLIC_REVENUECAT_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_ENVIRONMENT` (development/staging/production).
- **RevenueCat:** Entitlement ID is `Stokk Pro`.
- **EAS build profiles:** `development` (internal), `preview` (iOS simulator), `production` (auto-increment, app-bundle for Android).
- **Bundle identifier:** `com.svaeinki.stokk` (both platforms).
- **New Architecture:** Disabled (`newArchEnabled: false` in app.json).
- **Metro:** Custom config adds WebAssembly (`.wasm`) support.

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `master`/`main`: lint → type-check → test:ci. Uses `.nvmrc` for Node version.

## Future Plans

See `DEVELOPMENT.md` for the backend/sync roadmap (auth, offline-first sync with conflict resolution, API service). See `ROADMAP.md` for multi-phase vision.
