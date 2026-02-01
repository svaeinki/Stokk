# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stokk is a React Native + Expo inventory management mobile app with offline SQLite storage. The app supports English and Spanish (i18n via i18next) and targets both iOS (11.0+) and Android (API 21+).

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
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
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
- **i18n:** i18next + react-i18next + expo-localization
- **Subscriptions:** RevenueCat (react-native-purchases)
- **Error Tracking:** Sentry

### Source Structure (`src/`)

| Directory     | Purpose                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `components/` | Reusable UI components (`ArticuloForm`, `ArticuloList`)                            |
| `context/`    | React Context providers (`ThemeContext` for dark/light mode)                       |
| `database/`   | `DatabaseManager.ts` - singleton SQLite CRUD operations                            |
| `i18n/`       | Internationalization setup and locale files (`locales/es.json`, `locales/en.json`) |
| `screens/`    | Screen components (Inventario, Buscar, Ingresar, Config, Paywall)                  |
| `services/`   | `SubscriptionService` (RevenueCat), `ImageService` (camera/gallery)                |
| `utils/`      | `Validation.ts` (formatting), `Logger.ts` (silenced in production)                 |
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

### Key Patterns

- **Singletons:** `DatabaseManager`, `SubscriptionService`, and `ImageService` are all singleton instances exported as default.
- **DatabaseManager:** Lazy initialization with `initDatabase()`. All CRUD methods are async and use prepared statements.
- **SubscriptionService:** RevenueCat wrapper with 5-minute cache for pro status. Gracefully handles missing API keys (returns false/null instead of throwing).
- **ThemeContext:** Provides both Paper theme and Navigation theme, respects system color scheme.
- **i18n:** Language persisted in AsyncStorage, falls back to device locale then Spanish. Use `useTranslation()` hook and `t('key')` for translations.
- **Currency:** Prices stored as integers (Chilean Pesos), formatted with `Validation.ts` utilities.
- **Free tier limit:** 20 products max without subscription (`FREE_TIER_PRODUCT_LIMIT` in `src/constants/app.ts`).

## Configuration

- **RevenueCat:** API key via `EXPO_PUBLIC_REVENUECAT_API_KEY` environment variable. Entitlement ID is `Stokk Pro`.
- **EAS build profiles:** `development` (internal), `preview` (iOS simulator), `production` (auto-increment, app-bundle for Android).
- **Bundle identifier:** `com.svaeinki.stokk` (both platforms).
