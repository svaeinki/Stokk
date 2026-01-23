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

# Alternative Expo commands
npx expo start --tunnel    # Remote tunnel for physical devices

# EAS builds (requires EAS CLI)
eas build --profile development --platform ios
eas build --profile development --platform android
eas build --profile production --platform all
```

**Note:** No test or lint commands are currently configured.

## Architecture

### Tech Stack
- **Framework:** React Native 0.81 + Expo SDK 54
- **Language:** TypeScript (strict mode)
- **UI:** React Native Paper (Material Design 3)
- **Navigation:** React Navigation v7 (bottom tabs + native stack)
- **Storage:** expo-sqlite (SQLite), AsyncStorage
- **i18n:** i18next + react-i18next + expo-localization
- **Subscriptions:** RevenueCat (react-native-purchases)

### Source Structure (`src/`)

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable UI components (`ArticuloForm`, `ArticuloList`) |
| `context/` | React Context providers (`ThemeContext` for dark/light mode) |
| `database/` | `DatabaseManager.ts` - singleton SQLite CRUD operations |
| `i18n/` | Internationalization setup and locale files (`locales/es.json`, `locales/en.json`) |
| `screens/` | Screen components (Inventario, Buscar, Ingresar, Config, Paywall) |
| `services/` | `SubscriptionService` (RevenueCat), `ImageService` (camera/gallery) |
| `utils/` | `Validation.ts` (formatting), `Logger.ts` (silenced in production) |

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

Single table `articulos` with fields: id, nombre, descripcion, precio (integer), cantidad, imagen (URI), numeroBodega (unique), observaciones, fechaIngreso, fechaModificacion. Indexed on nombre and numeroBodega.

### Key Patterns

- **DatabaseManager:** Singleton pattern with lazy initialization. All CRUD methods are async and use prepared statements.
- **ThemeContext:** Provides both Paper theme and Navigation theme, respects system color scheme.
- **i18n:** Language persisted in AsyncStorage, falls back to device locale then Spanish. Use `useTranslation()` hook and `t('key')` for translations.
- **Currency:** Prices stored as integers (Chilean Pesos), formatted with `Validation.ts` utilities.
- **Free tier limit:** 20 products max without subscription (constant in `src/constants/app.ts`).

## Configuration Notes

- RevenueCat API keys in `SubscriptionService.ts` are placeholders and need real values for production.
- EAS build profiles: `development` (internal distribution), `preview`, `production` (auto-increment version).
- Bundle identifier: `com.svaeinki.stokk` (both platforms).
