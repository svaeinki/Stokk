# Stokk - Gestión de Inventario

Aplicación móvil React Native + Expo para gestión de inventario. Diseñada para emprendedores y pequeños negocios.

## Características

- **CRUD completo**: Crear, leer, actualizar y eliminar productos
- **Búsqueda**: Por nombre o código de bodega con debounce
- **Imágenes**: Captura desde cámara o galería
- **Base de datos SQLite**: Datos persistentes offline
- **Tema oscuro/claro**: Persistente en AsyncStorage
- **Modelo freemium**: Límite de 20 productos en versión gratuita
- **RevenueCat**: Sistema de suscripciones integrado

## Tech Stack

| Tecnología | Versión |
|------------|---------|
| React Native | 0.81 |
| Expo SDK | 54 |
| TypeScript | Strict mode |
| React Native Paper | Material Design 3 |
| React Navigation | v7 |
| expo-sqlite | SQLite local |
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
├── screens/           # Pantallas
│   ├── InventarioScreen.tsx
│   ├── BuscarScreen.tsx
│   ├── IngresarScreen.tsx
│   ├── ConfigScreen.tsx
│   └── PaywallScreen.tsx
├── services/          # Servicios externos
│   └── SubscriptionService.ts  # RevenueCat con caché
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

## Comandos Disponibles

```bash
npm run start          # Expo development server
npm run android        # Ejecutar en Android
npm run ios            # Ejecutar en iOS
npm run web            # Ejecutar en web

# Builds de producción (requiere EAS CLI)
eas build --profile production --platform android
eas build --profile production --platform ios
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

1. Crear cuenta en [RevenueCat](https://www.revenuecat.com/)
2. Configurar app en Google Play Console
3. Crear productos de suscripción
4. Obtener API keys
5. Actualizar `src/services/SubscriptionService.ts`:

```typescript
const API_KEYS = {
    apple: 'appl_TU_API_KEY_REAL',
    google: 'goog_TU_API_KEY_REAL',
};
```

## Modelo Freemium

| Característica | Free | Pro |
|----------------|:----:|:---:|
| Productos | 20 máx | Ilimitado |
| Búsqueda | Sí | Sí |
| Fotos | Sí | Sí |
| Temas | Sí | Sí |

## Arquitectura

- **Patrón Singleton**: DatabaseManager, SubscriptionService
- **Context API**: ThemeContext para tema global
- **Memoización**: ArticuloList optimizado con useCallback y memo
- **Logger centralizado**: Silenciado automáticamente en producción
- **Type-safe**: TypeScript estricto, sin `any`

## Plataformas Soportadas

- Android: API 21+ (Android 5.0)
- iOS: 11.0+

## Licencia

Propietario - Todos los derechos reservados

---

Stokk - Gestión de inventario simple y eficiente
