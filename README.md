# Stokk

> Inventory management mobile app with offline SQLite storage

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

Stokk is a React Native + Expo inventory management app designed for small businesses. It features:

- **Offline-first architecture** - Full functionality without internet using SQLite
- **Bilingual support** - English and Spanish (i18n via i18next)
- **Cross-platform** - iOS (11.0+) and Android (API 21+)
- **Material Design 3** - Modern UI with React Native Paper
- **Subscription model** - Free tier (20 products) with Pro upgrade via RevenueCat

## Quick Start

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 10+
- For iOS: macOS with Xcode 15+
- For Android: Android Studio with SDK 21+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/stokk.git
cd stokk

# Use correct Node version
nvm use

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your RevenueCat and Sentry keys
```

### Running the App

```bash
# Start Expo development server
npm run start

# Run on specific platform
npm run ios          # iOS simulator/device
npm run android      # Android emulator/device
npm run web          # Web browser (limited support)
```

> **Note:** Use development builds (`npx expo run:ios`) instead of Expo Go for full RevenueCat/Sentry functionality.

## Platform Setup Guide

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install nvm and Node
brew install nvm
nvm install 22
nvm use 22

# Install Xcode from App Store, then:
xcode-select --install
sudo xcodebuild -license accept

# Install CocoaPods
sudo gem install cocoapods

# Install Watchman (recommended)
brew install watchman

# Install Android Studio from https://developer.android.com/studio
# Configure ANDROID_HOME in ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Install EAS CLI
npm install -g eas-cli
```

### Windows

```powershell
# Enable Developer Mode in Settings > For developers

# Install Node.js 22 from https://nodejs.org/
# Or use nvm-windows: https://github.com/coreybutler/nvm-windows

# Install Android Studio from https://developer.android.com/studio
# Install JDK 17 (included with Android Studio or separately)

# Add to PATH (System Environment Variables):
# - %LOCALAPPDATA%\Android\Sdk\platform-tools
# - %LOCALAPPDATA%\Android\Sdk\emulator

# Install EAS CLI
npm install -g eas-cli
```

> **Note:** iOS development requires macOS. Use EAS Build for iOS builds on Windows.

### Linux (Ubuntu/Debian)

```bash
# Install nvm and Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Install Android Studio dependencies
sudo apt update
sudo apt install -y openjdk-17-jdk unzip

# Download and install Android Studio from https://developer.android.com/studio
# Configure in ~/.bashrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Install Watchman
sudo apt install -y watchman

# Enable KVM for Android emulator acceleration
sudo apt install -y qemu-kvm
sudo adduser $USER kvm

# Install EAS CLI
npm install -g eas-cli
```

> **Note:** iOS development requires macOS. Use EAS Build for iOS builds on Linux.

## Development

### Available Scripts

```bash
# Development
npm run start          # Start Expo dev server
npm run ios            # Run on iOS
npm run android        # Run on Android
npm run web            # Run in browser

# Code Quality
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all
npm run type-check     # TypeScript check

# Testing
npm run test           # Run Jest tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report

# EAS Builds
eas build --profile development --platform ios
eas build --profile production --platform all
```

### Project Structure

```
src/
├── components/     # Reusable UI components
├── constants/      # App constants and config
├── context/        # React Context providers
├── database/       # SQLite operations (DatabaseManager)
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization (locales)
├── screens/        # Screen components
├── services/       # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── validation/     # Zod schemas
```

### Architecture Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI | React Native Paper | Material Design 3 components |
| Navigation | React Navigation v7 | Bottom tabs + native stack |
| Storage | expo-sqlite | Offline SQLite database |
| Validation | Zod | Runtime schema validation |
| i18n | i18next | English/Spanish translations |
| Subscriptions | RevenueCat | In-app purchases |
| Errors | Sentry | Error tracking & monitoring |

### Database Schema

Single table `articulos` with fields:

```typescript
interface Articulo {
  id?: number;
  nombre: string;        // Product name
  descripcion: string;   // Description
  precio: number;        // Price (Chilean Pesos, integer)
  cantidad: number;      // Quantity
  imagen?: string;       // Image URI (local file path)
  numeroBodega: string;  // Warehouse/location code
  observaciones?: string; // Notes
  fechaIngreso: string;  // Created date
  fechaModificacion?: string; // Modified date
}
```

### Key Patterns

- **Singletons** - `DatabaseManager`, `SubscriptionService`, `ImageService`
- **Lazy initialization** - Database initializes on first use
- **Graceful degradation** - Missing API keys don't crash the app
- **Currency** - Prices stored as integers (Chilean Pesos)
- **Free tier** - 20 products max without subscription

## Configuration

### Environment Variables

See `.env.example` for required variables:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat API key for subscriptions |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `EXPO_PUBLIC_ENVIRONMENT` | `development`, `staging`, or `production` |

### EAS Build Profiles

| Profile | Use Case |
|---------|----------|
| `development` | Internal testing with dev client |
| `preview` | iOS simulator builds |
| `production` | App Store / Play Store releases |

### RevenueCat Setup

1. Create project at [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Configure iOS/Android apps
3. Create entitlement: `Stokk Pro`
4. Add API key to `.env`

### Sentry Setup

1. Create project at [Sentry](https://sentry.io/)
2. Get DSN from project settings
3. Add DSN to `.env`

## Testing

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- src/__tests__/validation.test.ts

# CI mode (used in GitHub Actions)
npm run test:ci
```

### Current Status

- **37 tests passing**
- **Test coverage: 21.67%**
  - Hooks: 76.47% (well covered)
  - Constants: 100%
  - Components/Screens: 0% (pending)

### Known Issues

| Severity | Issue | File | Impact |
|----------|-------|------|--------|
| Medium | No pagination in search | `BuscarScreen.tsx` | Lag with 1000+ items |
| Medium | Image compression on main thread | `ImageService.ts` | UI blocking |
| Medium | No Error Boundary | `App.tsx` | Crash = white screen |
| Low | Debounce with setTimeout | `BuscarScreen.tsx` | Could use AbortController |

## Roadmap

The project is evolving from offline-only to a full cloud-synced platform:

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Rails API backend | Planned |
| **Phase 2** | Mobile sync (offline-first) | Planned |
| **Phase 3** | Multi-user / organizations | Planned |
| **Phase 4** | Web admin panel | Planned |
| **Phase 5** | Advanced features | Future |

See [ROADMAP.md](./ROADMAP.md) for detailed plans.

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | AI development guidance |
| [ROADMAP.md](./ROADMAP.md) | Future vision and phases |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Sprint planning and technical details |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run lint: `npm run lint`
6. Commit: `git commit -m "Add my feature"`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with React Native + Expo
