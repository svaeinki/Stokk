# 👞 Napoli Mobile - App de Gestión de Inventario

Aplicación móvil React Native + Expo para gestionar el inventario de la reparadora de calzado Napoli.

## 🚀 Características Implementadas

### ✅ Gestión de Inventario
- **CRUD completo**: Crear, leer, actualizar y eliminar artículos
- **Validación de RUT chileno**: Formato automático y validación en tiempo real
- **Búsqueda avanzada**: Por RUT, nombre del cliente o número de bodega
- **Estados**: "En Bodega" / "Entregado" con indicadores visuales
- **Alertas temporales**: Sistema de colores para artículos antiguos
- **Base de datos SQLite local**: Datos persistentes offline

### 📱 Interfaz Móvil
- **Diseño responsivo**: Optimizado para iOS y Android
- **Navegación por tabs**: 4 secciones principales (Inventario, Buscar, Ingresar, Config)
- **UI moderna**: React Native Paper con Material Design
- **Iconos vectoriales**: Material Icons
- **Tema consistente**: Colores corporativos de Napoli

### 🔧 Características Técnicas
- **TypeScript**: Tipado seguro y mejor DX
- **SQLite local**: Base de datos robusta y rápida
- **Navegación**: React Navigation con stack y tabs
- **Componentes modularizados**: Arquitectura escalable

## 📁 Estructura del Proyecto

```
napoli-mobile/
├── src/
│   ├── components/
│   │   ├── ArticuloList.tsx    # Lista de artículos con búsqueda y filtros
│   │   └── ArticuloForm.tsx    # Formulario para agregar/editar
│   ├── screens/
│   │   ├── InventarioScreen.tsx # Pantalla principal de inventario
│   │   ├── BuscarScreen.tsx     # Búsqueda específica
│   │   ├── IngresarScreen.tsx   # Formulario de ingreso rápido
│   │   └── ConfigScreen.tsx    # Configuración de la app
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navegación principal
│   ├── database/
│   │   └── DatabaseManager.ts  # Gestión de SQLite
│   ├── utils/
│   │   └── Validation.ts       # Validaciones y utilidades
│   └── App.tsx                  # Entry point
├── assets/                     # Imágenes e iconos
├── app.json                    # Configuración de Expo
└── package.json                # Dependencias
```

## 🛠️ Instalación y Ejecución

### Prerrequisitos
- **Node.js** 18+ 
- **Expo CLI** o **Expo Go app** en el dispositivo
- **iOS Simulator** o **Android Emulator** (opcional)

### Pasos

1. **Clonar o navegar al proyecto**
```bash
cd napoli-mobile
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npx expo start
```

4. **Ejecutar en dispositivo**
- Escanea el código QR con la app Expo Go
- O presiona `a` para Android, `i` para iOS

## 📱 Uso de la App

### 📦 Inventario
- Ver todos los artículos del sistema
- Filtros por estado (todos/en bodega/entregados)
- Búsqueda en tiempo real
- Acciones rápidas: editar, cambiar estado, eliminar
- Indicadores visuales de antigüedad

### ➕ Ingresar Artículo
- Formulario completo con validación
- RUT chileno con formato automático
- Generación automática de número de bodega
- Validación en tiempo real de campos

### 🔍 Buscar
- Búsqueda específica por cualquier campo
- Resultados instantáneos
- Navegación directa a edición

### ⚙️ Configuración
- Tema oscuro/claro (preparado)
- Configuración de notificaciones (preparado)
- Opciones de backup (preparado)

## 🗄️ Base de Datos

### Schema de Artículos
```sql
CREATE TABLE articulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rut TEXT NOT NULL,
  nombreCliente TEXT NOT NULL,
  telefono TEXT,
  tipoArticulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  numeroBodega TEXT NOT NULL UNIQUE,
  observaciones TEXT,
  estado TEXT DEFAULT 'En Bodega',
  fechaIngreso TEXT NOT NULL,
  fechaEntrega TEXT,
  fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fechaModificacion DATETIME
);
```

### Schema de Abonos (preparado)
```sql
CREATE TABLE abonos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  articuloId INTEGER NOT NULL,
  monto REAL NOT NULL,
  metodoPago TEXT DEFAULT 'Efectivo',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (articuloId) REFERENCES articulos(id)
);
```

## 🎨 Diseño y Estilos

### Paleta de Colores
- **Primario**: `#D32F2F` (Rojo Napoli)
- **Secundario**: `#8E0000` (Rojo oscuro)
- **Éxito**: `#4CAF50` (Verde)
- **Alerta**: `#FF9800` (Naranja)
- **Peligro**: `#f44336` (Rojo)

### Iconografía
- Material Icons para consistencia
- Indicadores visuales claros para estados
- Iconos temáticos por sección

## 🚀 Próximas Características

### 🔄 En Desarrollo
- [ ] **Códigos QR**: Generación y escaneo
- [ ] **Sistema de Pagos**: Registro de abonos y saldos
- [ ] **Tickets**: Impresión y generación de tickets
- [ ] **Sincronización**: Backup en la nube (Dropbox/Firebase)

### 📋 Roadmap Futuro
- [ ] **Modo Offline**: Sincronización cuando hay conexión
- [ ] **Notificaciones Push**: Alertas de artículos antiguos
- [ ] **Exportación CSV**: Reportes y estadísticas
- [ ] **Multiusuario**: Roles y permisos
- [ ] **Dashboard**: Estadísticas y gráficos

## 🔧 Comandos Útiles

```bash
# Desarrollo
npx expo start                # Iniciar servidor
npx expo start --tunnel      # Con túnel para testing remoto
npx expo start --web         # Versión web

# Build para producción
npx expo build:android        # APK Android
npx expo build:ios           # IPA iOS

# Depuración
npx expo install --fix       # Reparar dependencias
npx expo doctor             # Verificar configuración
```

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Expo SQLite no disponible"**
```bash
npx expo install expo-sqlite
```

**Error: "Iconos no se muestran"**
```bash
npx expo install react-native-vector-icons
npx expo install expo-font
```

**Error: "Base de datos no se inicializa"**
- Verificar permisos en AndroidManifest.xml
- Reinstalar la app: `npx expo start --clear`

## 📱 Plataformas Soportadas

- ✅ **iOS** (11.0+)
- ✅ **Android** (API 21+)
- ✅ **Web** (limitado)
- 🔄 **Windows/Mac** (con Electron en futuro)

## 🤝 Contribución

1. Fork del proyecto
2. Feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📄 Licencia

MIT License - Libre para uso y modificación

---

**Napoli Mobile**  
*Hecho con ❤️ para la reparadora de calzado*