# Stokk - Gestión de Inventario

Aplicación móvil React Native + Expo para gestión de inventario. Diseñada para emprendedores y pequeños negocios.

## Características

- **CRUD completo**: Crear, leer, actualizar y eliminar productos
- **Búsqueda**: Por nombre o código de bodega con debounce
- **Imágenes**: Captura desde cámara o galería
- **Base de datos SQLite**: Datos persistentes offline
- **Tema oscuro/claro**: Persistente en AsyncStorage
- **Multiidioma**: Español e Inglés (i18next)
- **Modelo freemium**: Límite de 20 productos en versión gratuita
- **RevenueCat**: Sistema de suscripciones con paywall nativo

## Tech Stack

| Tecnología | Versión |
|------------|---------|
| React Native | 0.81 |
| Expo SDK | 54 |
| TypeScript | Strict mode |
| React Native Paper | Material Design 3 |
| React Navigation | v7 |
| expo-sqlite | SQLite local |
| i18next | Internacionalización |
| RevenueCat | Suscripciones |

## Estructura del Proyecto

```
src/
├── components/        # Componentes reutilizables
│   ├── ArticuloForm.tsx    # Formulario de producto
│   └── ArticuloList.tsx    # Lista de productos (memoizada)
├── context/           # Contextos React
│   └── ThemeContext.tsx    # Tema con persistencia
├── database/          # Capa de datos
│   └── DatabaseManager.ts  # CRUD SQLite
├── i18n/              # Internacionalización
│   ├── index.ts            # Configuración i18next
│   └── locales/            # Archivos de traducción
│       ├── es.json
│       └── en.json
├── screens/           # Pantallas
│   ├── InventarioScreen.tsx
│   ├── BuscarScreen.tsx
│   ├── IngresarScreen.tsx
│   ├── ConfigScreen.tsx
│   └── PaywallScreen.tsx
├── services/          # Servicios externos
│   ├── SubscriptionService.ts  # RevenueCat
│   └── ImageService.ts         # Gestión de imágenes
├── utils/             # Utilidades
│   ├── Validation.ts       # Validación y formateo
│   └── Logger.ts           # Logger centralizado
├── types/             # Tipos TypeScript
│   └── navigation.ts
└── constants/         # Constantes
    └── app.ts
```

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd stokk

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Ejecutar en dispositivo/emulador
npx expo start --android
npx expo start --ios
```

## Development Build vs Expo Go

Se recomienda usar **development build** en lugar de Expo Go para desarrollo:

```bash
# Primera vez (compila la app nativa)
npx expo run:ios      # iOS simulator
npx expo run:android  # Android emulator

# Desarrollo posterior (solo servidor)
npx expo start
```

**Ventajas del development build:**
- Splash screen e ícono personalizados visibles
- RevenueCat y Sentry funcionan correctamente
- Experiencia más cercana a producción
- Hot reload sigue funcionando

Solo necesitas recompilar (`npx expo run:ios/android`) cuando agregues nuevas dependencias nativas.

## Comandos Disponibles

```bash
npm run start          # Expo development server
npm run android        # Ejecutar en Android
npm run ios            # Ejecutar en iOS
npm run web            # Ejecutar en web

# Builds de producción (requiere EAS CLI)
eas build --profile development --platform ios
eas build --profile development --platform android
eas build --profile production --platform all
```

## Base de Datos

Esquema SQLite:

```sql
CREATE TABLE articulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio INTEGER DEFAULT 0,
  cantidad INTEGER DEFAULT 1,
  imagen TEXT,
  numeroBodega TEXT NOT NULL UNIQUE,
  observaciones TEXT,
  fechaIngreso TEXT NOT NULL,
  fechaModificacion DATETIME
);

CREATE INDEX idx_nombre ON articulos(nombre);
CREATE INDEX idx_numeroBodega ON articulos(numeroBodega);
```

## Configuración de RevenueCat

### 1. Crear cuenta y proyecto

1. Crear cuenta en [RevenueCat](https://www.revenuecat.com/)
2. Crear un nuevo proyecto en el dashboard
3. Copiar la API Key pública del proyecto

### 2. Configurar en App Store Connect (iOS)

1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Crear la app si no existe
3. En **Monetization > Subscriptions**, crear un grupo de suscripciones
4. Crear los siguientes productos:
   - `monthly` - Suscripción mensual
   - `yearly` - Suscripción anual
   - `lifetime` - Compra única (Non-Consumable)
5. En RevenueCat, conectar App Store Connect:
   - Settings > Apps > iOS > App Store Connect API

### 3. Configurar en Google Play Console (Android)

1. Ir a [Google Play Console](https://play.google.com/console/)
2. Crear la app si no existe
3. En **Monetize > Products > Subscriptions**, crear:
   - `monthly` - Suscripción mensual
   - `yearly` - Suscripción anual
4. En **Monetize > Products > In-app products**, crear:
   - `lifetime` - Producto de por vida
5. En RevenueCat, conectar Google Play:
   - Settings > Apps > Android > Google Play Console API

### 4. Configurar RevenueCat Dashboard

1. **Crear Entitlement:**
   - Ir a Project > Entitlements
   - Crear entitlement con identificador: `Stokk Pro`

2. **Vincular productos al entitlement:**
   - En cada producto (iOS y Android), asignar el entitlement `Stokk Pro`

3. **Crear Offering:**
   - Ir a Project > Offerings
   - El offering `default` debe contener los 3 paquetes:
     - Monthly (`$rc_monthly`)
     - Annual (`$rc_annual`)
     - Lifetime (`$rc_lifetime`)

4. **Configurar Paywall (opcional):**
   - Ir a Project > Paywalls
   - Crear un paywall y asignarlo al offering default
   - Esto habilitará el paywall nativo de RevenueCat

### 5. Actualizar API Key en el código

En `src/services/SubscriptionService.ts`:

```typescript
const API_KEY = 'tu_api_key_publica';
```

### 6. Testing

**iOS Sandbox:**
1. En App Store Connect > Users and Access > Sandbox Testers
2. Crear un tester de sandbox
3. En el dispositivo, cerrar sesión de la App Store
4. Al comprar, usar las credenciales del sandbox tester

**Android License Testing:**
1. En Google Play Console > Setup > License testing
2. Agregar emails de testers
3. Los testers verán precios de prueba

## Modelo Freemium

| Característica | Free | Pro |
|----------------|:----:|:---:|
| Productos | 20 máx | Ilimitado |
| Búsqueda | ✓ | ✓ |
| Fotos | ✓ | ✓ |
| Temas | ✓ | ✓ |
| Soporte prioritario | ✗ | ✓ |

## Arquitectura

- **Patrón Singleton**: DatabaseManager, SubscriptionService, ImageService
- **Context API**: ThemeContext para tema global
- **Memoización**: ArticuloList optimizado con useCallback y memo
- **Logger centralizado**: Silenciado automáticamente en producción
- **Type-safe**: TypeScript estricto
- **i18n**: Idioma persistido en AsyncStorage, fallback a locale del dispositivo

## Checklist Pre-Producción

### Configuración
- [ ] API Key de RevenueCat configurada
- [ ] Productos creados en App Store Connect
- [ ] Productos creados en Google Play Console
- [ ] Entitlement `Stokk Pro` configurado
- [ ] Offering con los 3 paquetes

### Legal
- [ ] Página de Política de Privacidad (https://stokk.app/privacy)
- [ ] Página de Términos de Uso (https://stokk.app/terms)

### Assets
- [ ] Icono de app (1024x1024)
- [ ] Splash screen
- [ ] Screenshots para App Store
- [ ] Screenshots para Play Store

### Testing
- [ ] Probar compras en sandbox (iOS)
- [ ] Probar compras con license testing (Android)
- [ ] Probar restaurar compras
- [ ] Probar límite de 20 productos

## Plataformas Soportadas

- Android: API 21+ (Android 5.0)
- iOS: 11.0+

## Licencia

Propietario - Todos los derechos reservados

---

Stokk - Gestión de inventario simple y eficiente
