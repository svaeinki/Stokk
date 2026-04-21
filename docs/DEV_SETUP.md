# Dev Setup (notas personales)

## Requisitos

- Node 22 (hay `.nvmrc`)
- npm 10+
- Xcode 15+ (para iOS)
- Android Studio con SDK 21+ (para Android)

## Levantar el proyecto

```bash
nvm use
npm install
cp .env.example .env   # llenar con keys de RevenueCat y Sentry
```

## Correr la app

```bash
# Primera vez (compila nativo + abre simulador)
npm run ios
npm run android

# Despues solo hot reload
npm run start
```

> Despues de agregar una dependencia nativa, hay que volver a compilar con `npm run ios` / `npm run android`.

## Code quality

```bash
npm run lint           # ESLint
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier
npm run type-check     # TypeScript
```

## Tests

```bash
npm run test                                    # todos
npm run test:watch                              # watch mode
npm run test -- src/__tests__/validation.test.ts  # un archivo
```

## Builds con EAS

```bash
npm install -g eas-cli
eas build --profile development --platform ios
eas build --profile production --platform all
```

## Variables de entorno

Ver `.env.example`:
- `EXPO_PUBLIC_REVENUECAT_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_ENVIRONMENT` (development / staging / production)
