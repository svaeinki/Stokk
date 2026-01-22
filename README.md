# 📦 Stokk - Gestión de Inventario

Aplicación móvil React Native + Expo para gestionar inventario.

## 🚀 Características

- **CRUD completo**: Crear, leer, actualizar y eliminar productos
- **Búsqueda avanzada**: Por nombre o número de bodega
- **Base de datos SQLite**: Datos persistentes offline
- **Tema oscuro/claro**: Soporte completo
- **Sistema de suscripción**: RevenueCat integrado (preparado)

## 📁 Estructura

```
stokk/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── context/         # Contextos (Theme)
│   ├── database/        # DatabaseManager SQLite
│   ├── screens/         # Pantallas de la app
│   ├── services/        # Servicios (Subscriptions)
│   └── utils/           # Utilidades y validaciones
├── android/             # Código nativo Android
├── ios/                 # Código nativo iOS
└── assets/              # Imágenes e iconos
```

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Ejecutar en dispositivo
# Escanea el QR con Expo Go, o presiona 'a' (Android) / 'i' (iOS)
```

## 📱 Pantallas

| Pantalla | Descripción |
|----------|-------------|
| Inventario | Lista de productos con búsqueda |
| Buscar | Búsqueda específica |
| Ingresar | Formulario de nuevo producto |
| Config | Configuración, tema, suscripción |

## 🗄️ Base de Datos

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
```

## 🔧 Comandos

```bash
npx expo start              # Desarrollo
npx expo start --tunnel     # Túnel remoto
npx expo run:android        # Build Android
npx expo run:ios            # Build iOS
```

## 📱 Plataformas

- ✅ iOS (11.0+)
- ✅ Android (API 21+)

---

**Stokk** - Gestión de inventario simple y eficiente