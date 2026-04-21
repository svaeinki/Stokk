# Stokk

> Inventory management mobile app for small businesses, built with React Native and Expo.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Offline--first-003B57?logo=sqlite&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)

## About

Stokk is a cross-platform mobile app that lets small business owners manage their product inventory entirely from their phone — no internet connection required. Products, prices, quantities, images, and warehouse locations are all stored locally in SQLite, with full CRUD operations, search, and camera integration.

The app supports English and Spanish, follows Material Design 3 guidelines, and includes a freemium subscription model via RevenueCat.

<!-- 
## Screenshots

Add screenshots here. Recommended: 3-4 screens side by side.

<p align="center">
  <img src="docs/screenshots/inventario.png" width="200" alt="Inventory screen" />
  <img src="docs/screenshots/ingresar.png" width="200" alt="Add product screen" />
  <img src="docs/screenshots/buscar.png" width="200" alt="Search screen" />
  <img src="docs/screenshots/config.png" width="200" alt="Settings screen" />
</p>
-->

## Key Features

- **Offline-first storage** — SQLite database with indexed queries; works without internet
- **Camera & gallery integration** — Attach product photos directly from the device
- **Bilingual (EN/ES)** — i18n with i18next, auto-detects device locale
- **Dark mode** — Automatic theme switching based on system preference
- **Form validation** — Runtime schema validation with Zod
- **Freemium model** — Free tier (20 products) with Pro upgrade via RevenueCat in-app purchases
- **Error monitoring** — Sentry integration for production crash tracking
- **CI/CD** — GitHub Actions pipeline with lint, type-check, and test stages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict mode) |
| UI | React Native Paper (Material Design 3) |
| Navigation | React Navigation v7 (bottom tabs + stack) |
| Storage | expo-sqlite (SQLite) |
| Validation | Zod v4 |
| i18n | i18next + react-i18next |
| Subscriptions | RevenueCat |
| Error Tracking | Sentry |
| Testing | Jest (37 tests) |
| CI | GitHub Actions |

## Architecture

```
src/
├── components/     # Reusable UI (ArticuloForm, ArticuloList, form/)
├── constants/      # App-wide constants and color palette
├── context/        # ThemeContext, SnackbarContext
├── database/       # DatabaseManager singleton — SQLite CRUD
├── hooks/          # useArticuloForm, useSubscriptionLimit, useArticuloSubmit
├── i18n/           # i18next setup + locale files (en.json, es.json)
├── screens/        # Inventario, Buscar, Ingresar, Config, Paywall
├── services/       # SubscriptionService, ImageService, SentryService
├── types/          # TypeScript type definitions
├── utils/          # Formatting utilities, Logger
└── validation/     # Zod schemas for form data
```

### Design Decisions

- **Singleton services** — `DatabaseManager`, `SubscriptionService`, and `ImageService` are singletons with lazy initialization, keeping resource usage predictable and avoiding duplicate connections.
- **Offline-first** — All data lives in a local SQLite database (`expo-sqlite`). The app never requires a network connection to function. Indexed columns (`nombre`, `numeroBodega`, `fechaIngreso`) keep queries fast as inventory grows.
- **Graceful degradation** — Missing API keys (RevenueCat, Sentry) don't crash the app; services return safe defaults instead of throwing, so development and production share the same code paths.
- **Currency as integers** — Prices are stored as integers (Chilean Pesos) to avoid floating-point rounding issues, and formatted only at the presentation layer.
- **Schema validation at the boundary** — Zod schemas validate all form input before it reaches the database, catching bad data early without scattering validation logic across components.

### Navigation

```
Root Stack Navigator
├── MainTabs (Bottom Tab Navigator)
│   ├── Inventario — Product list with search
│   ├── Buscar — Search screen
│   ├── Ingresar — Add product form
│   └── Config — Settings
└── Paywall (Modal) — Subscription screen
```

## Getting Started

**Requirements:** Node 22+ (see `.nvmrc`), npm 10+. iOS: macOS with Xcode 15+. Android: Android Studio with SDK 21+.

```bash
git clone https://github.com/your-username/stokk.git
cd stokk
nvm use
npm install
cp .env.example .env   # Configure API keys

npm run ios            # Build and run on iOS simulator
npm run android        # Build and run on Android emulator
npm run start          # Hot reload after initial build
```

```bash
# Code quality
npm run lint           # ESLint
npm run type-check     # TypeScript
npm run test           # Jest (37 tests)
```

## Roadmap

The project is evolving from offline-only to a cloud-synced platform:

- **Phase 1** — Rails API backend
- **Phase 2** — Offline-first sync with conflict resolution
- **Phase 3** — Multi-user support and organizations
- **Phase 4** — Web admin panel

## License

MIT
