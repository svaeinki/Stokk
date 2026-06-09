# Dev Setup (notas personales)

## Requisitos

- Node 22 (hay `.nvmrc`)
- pnpm 10+
- Xcode 15+ (para iOS)
- Android Studio con SDK 21+ (para Android)

## Levantar el proyecto

```bash
nvm use
corepack enable
pnpm install
cp .env.example .env   # llenar con keys de RevenueCat y Sentry
```

## Correr la app

```bash
# Primera vez (compila nativo + abre simulador)
pnpm run ios
pnpm run android

# Despues solo hot reload
pnpm run start
```

> Despues de agregar una dependencia nativa, hay que volver a compilar con `pnpm run ios` / `pnpm run android`.

## Code quality

```bash
pnpm run lint           # ESLint
pnpm run lint:fix       # ESLint auto-fix
pnpm run format         # Prettier
pnpm run type-check     # TypeScript
```

## Tests

```bash
pnpm run test                                    # todos
pnpm run test:watch                              # watch mode
pnpm run test -- src/__tests__/validation.test.ts  # un archivo
```

## Builds con EAS

```bash
pnpm add -g eas-cli
eas build --profile development --platform ios
eas build --profile production --platform all
```

## Variables de entorno

Ver `.env.example`:

- `EXPO_PUBLIC_REVENUECAT_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_ENVIRONMENT` (development / staging / production)
