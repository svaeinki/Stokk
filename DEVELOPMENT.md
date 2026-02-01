# DEVELOPMENT.md - Plan de Desarrollo Stokk

Este documento contiene el plan de desarrollo detallado para las próximas fases de Stokk.

---

## Estado Actual (Post-Limpieza)

La Fase 0 de limpieza está **COMPLETADA**:

- ✅ 0 errores de lint (6 warnings aceptables)
- ✅ TypeScript compila sin errores
- ✅ 37 tests pasando
- ✅ Hooks refactorizados (useArticuloForm dividido en 3)
- ✅ Componentes extraídos de App.tsx
- ✅ Cobertura de hooks: 70-94%

**El código está listo para Fase 1: Backend + Sincronización**

---

## Problemas y Errores Pendientes

### Warnings de Lint (6 - Aceptables)

| Archivo              | Warning             | Razón por la que es aceptable            |
| -------------------- | ------------------- | ---------------------------------------- |
| `SentryService.ts:72` | `Unexpected any`   | Necesario para manejar errores genéricos |
| `Logger.ts:84,90,96,107` | `Unexpected console` | Es un logger, necesita console       |
| `schemas.ts:40`      | `new for side effects` | Validación de fecha con Zod          |

### Issues de Rendimiento Detectados

| Severidad  | Problema                         | Archivo            | Impacto                  |
| ---------- | -------------------------------- | ------------------ | ------------------------ |
| **MEDIA**  | Sin paginación en búsqueda       | `BuscarScreen.tsx` | +1000 items = lag        |
| **MEDIA**  | Compresión imagen en main thread | `ImageService.ts`  | Bloquea UI               |
| **MEDIA**  | Sin Error Boundary               | `App.tsx`          | Crash = pantalla blanca  |
| **BAJA**   | Debounce con setTimeout          | `BuscarScreen.tsx` | Podría usar AbortController |
| **BAJA**   | eslint-disable en PaywallScreen  | `PaywallScreen.tsx:44` | Riesgo de closure stale |

### Cobertura de Tests Actual

```
Total: 21.67% (37 tests)

Bien cubierto:
├── Hooks: 76.47%
│   ├── useArticuloForm.ts: 93.75%
│   ├── useArticuloSubmit.ts: 70.96%
│   └── useSubscriptionLimit.ts: 79.16%
└── Constants: 100%

Sin cobertura (0%):
├── Componentes (ArticuloForm, ArticuloList, etc.)
├── Screens (todas)
├── Context (ThemeContext, SnackbarContext)
└── DatabaseManager: 1.13%
```

---

## Fase 1: Preparación para Backend

### 1.1 Modificar Schema SQLite

**Archivo:** `src/database/DatabaseManager.ts`

**Campos nuevos para tabla `articulos`:**

```sql
ALTER TABLE articulos ADD COLUMN remote_id INTEGER;
ALTER TABLE articulos ADD COLUMN synced_at DATETIME;
ALTER TABLE articulos ADD COLUMN sync_status TEXT DEFAULT 'pending';
ALTER TABLE articulos ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE articulos ADD COLUMN deleted_at DATETIME;
```

**Nueva tabla `sync_queue`:**

```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,      -- 'create' | 'update' | 'delete'
  articulo_id INTEGER,
  payload TEXT,                 -- JSON con datos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_error TEXT
);
```

**Nueva tabla `user_session`:**

```sql
CREATE TABLE user_session (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  email TEXT,
  token TEXT,
  refresh_token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Crear Servicios de API

**Estructura de archivos nuevos:**

```
src/services/
├── ApiService.ts        # Cliente HTTP base
├── AuthService.ts       # Autenticación JWT
└── SyncService.ts       # Sincronización bidireccional

src/context/
├── AuthContext.tsx      # Estado de autenticación

src/hooks/
├── useAuth.ts           # Hook de autenticación
└── useSync.ts           # Hook de sincronización

src/screens/
├── LoginScreen.tsx      # Pantalla de login
├── RegisterScreen.tsx   # Pantalla de registro
└── ForgotPasswordScreen.tsx
```

#### ApiService.ts

```typescript
// Patrón: Singleton con interceptors
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  // Métodos principales
  async get<T>(endpoint: string): Promise<T>;
  async post<T>(endpoint: string, data: unknown): Promise<T>;
  async patch<T>(endpoint: string, data: unknown): Promise<T>;
  async delete(endpoint: string): Promise<void>;

  // Token management
  setToken(token: string): void;
  clearToken(): void;

  // Error handling
  private handleError(error: unknown): never;
}
```

#### AuthService.ts

```typescript
// Patrón: Singleton con persistencia segura
class AuthService {
  // Autenticación
  async login(email: string, password: string): Promise<User>;
  async register(email: string, password: string, nombre: string): Promise<User>;
  async logout(): Promise<void>;
  async forgotPassword(email: string): Promise<void>;

  // Estado
  async getCurrentUser(): Promise<User | null>;
  async isAuthenticated(): Promise<boolean>;
  async refreshToken(): Promise<string>;

  // Persistencia (expo-secure-store)
  private async saveTokens(access: string, refresh: string): Promise<void>;
  private async clearTokens(): Promise<void>;
}
```

#### SyncService.ts

```typescript
// Patrón: Singleton con cola de operaciones
class SyncService {
  // Estado
  async getSyncStatus(): Promise<SyncStatus>;
  async getPendingCount(): Promise<number>;

  // Sincronización
  async syncNow(): Promise<SyncResult>;
  async syncArticulo(id: number): Promise<void>;

  // Cola de operaciones
  async queueOperation(op: SyncOperation): Promise<void>;
  async processQueue(): Promise<void>;

  // Conflictos
  async getConflicts(): Promise<Conflict[]>;
  async resolveConflict(id: number, resolution: 'local' | 'remote'): Promise<void>;

  // Auto-sync
  enableAutoSync(intervalMs: number): void;
  disableAutoSync(): void;
}
```

### 1.3 Crear Pantallas de Auth

#### LoginScreen.tsx

- Campo email con validación
- Campo password
- Botón "Iniciar Sesión"
- Link "Olvidé mi contraseña"
- Link "Crear cuenta"
- Manejo de errores (credenciales inválidas, red, etc.)

#### RegisterScreen.tsx

- Campo nombre
- Campo email con validación
- Campo password con requisitos
- Campo confirmar password
- Checkbox términos y condiciones
- Botón "Crear Cuenta"

### 1.4 Modificar Navegación

**Archivo:** `App.tsx` y `src/types/navigation.ts`

```typescript
// Nueva estructura de navegación
type RootStackParamList = {
  Auth: undefined;           // Stack de autenticación
  MainTabs: undefined;       // Tabs existentes
  Paywall: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
```

**Flujo de navegación:**

```
App Start
    │
    ▼
┌─────────────────┐
│ Check Auth Token│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Auth     MainTabs
  Stack    (existente)
```

---

## Fase 2: Implementar Sincronización

### 2.1 Estrategia Offline-First

```
┌─────────────────────────────────────────────┐
│                 App Móvil                    │
│                                              │
│  ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │   UI     │◄──►│ SyncServ │◄──►│ API    │ │
│  └────┬─────┘    └─────┬────┘    └────────┘ │
│       │                │                     │
│       ▼                ▼                     │
│  ┌─────────────────────────┐                │
│  │   SQLite (fuente local) │                │
│  └─────────────────────────┘                │
└─────────────────────────────────────────────┘
```

**Principios:**

1. SQLite es la fuente de verdad local
2. Todas las operaciones van primero a SQLite
3. Cambios se encolan para sync
4. Sync ocurre en background cuando hay red
5. Conflictos se resuelven con "last write wins" o manual

### 2.2 Flujo de Operaciones

**Crear artículo:**

```
1. Usuario crea artículo
2. Guardar en SQLite (sync_status = 'pending')
3. Agregar a sync_queue (operation = 'create')
4. Si hay red → SyncService.processQueue()
5. API responde con remote_id
6. Actualizar SQLite (sync_status = 'synced', remote_id = X)
```

**Actualizar artículo:**

```
1. Usuario edita artículo
2. Incrementar version en SQLite
3. Actualizar sync_status = 'pending'
4. Agregar a sync_queue (operation = 'update')
5. Procesar cola cuando hay red
```

**Eliminar artículo:**

```
1. Usuario elimina artículo
2. Soft delete: deleted_at = NOW()
3. Agregar a sync_queue (operation = 'delete')
4. Procesar cola
5. Después de sync exitoso → hard delete local
```

### 2.3 Resolución de Conflictos

```typescript
interface Conflict {
  articuloId: number;
  localVersion: ArticuloVersion;
  remoteVersion: ArticuloVersion;
  conflictType: 'update' | 'delete';
  detectedAt: Date;
}

// Estrategias:
// 1. Last Write Wins (default) - timestamp más reciente gana
// 2. Manual - Usuario decide qué versión mantener
// 3. Merge - Combinar campos no conflictivos
```

---

## Archivos a Crear/Modificar

### Nuevos Archivos

```
src/
├── services/
│   ├── ApiService.ts           # Cliente HTTP
│   ├── AuthService.ts          # Autenticación
│   └── SyncService.ts          # Sincronización
├── context/
│   └── AuthContext.tsx         # Estado auth global
├── hooks/
│   ├── useAuth.ts              # Hook de auth
│   └── useSync.ts              # Hook de sync
├── screens/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── ForgotPasswordScreen.tsx
└── types/
    └── api.ts                  # Tipos de API responses
```

### Archivos a Modificar

```
src/
├── database/
│   └── DatabaseManager.ts      # Agregar campos sync + migraciones
├── types/
│   └── navigation.ts           # Agregar AuthStack
└── App.tsx                     # Agregar AuthContext + navegación condicional
```

---

## Verificación por Fase

### Fase 1 - Backend Prep

```bash
# 1. Schema actualizado
npm run test -- --testPathPattern=database

# 2. Servicios funcionan
npm run test -- --testPathPattern=services

# 3. Tipos correctos
npm run type-check

# 4. Manual: Login/Registro funciona
npm run ios
# Probar: crear cuenta, login, logout
```

### Fase 2 - Sync

```bash
# 1. Sync funciona online
# Manual: crear producto, verificar en API

# 2. Sync funciona offline
# Manual: modo avión, crear producto, conectar, verificar sync

# 3. Conflictos se detectan
# Manual: editar mismo producto en 2 dispositivos

# 4. Cola persiste
# Manual: modo avión, crear 3 productos, cerrar app, abrir, conectar
```

---

## Dependencias Nuevas

```bash
# Almacenamiento seguro para tokens
npx expo install expo-secure-store

# Estado de red
npx expo install @react-native-community/netinfo

# (Opcional) Background tasks para sync
npx expo install expo-background-fetch expo-task-manager
```

---

## Orden de Implementación Recomendado

### Sprint 1: Infraestructura (3-4 días)

1. [ ] Crear ApiService.ts con métodos básicos
2. [ ] Crear AuthService.ts con login/logout
3. [ ] Crear AuthContext.tsx
4. [ ] Crear useAuth.ts hook
5. [ ] Agregar expo-secure-store
6. [ ] Tests para ApiService y AuthService

### Sprint 2: UI de Auth (2-3 días)

1. [ ] Crear LoginScreen.tsx
2. [ ] Crear RegisterScreen.tsx
3. [ ] Modificar navegación en App.tsx
4. [ ] Agregar tipos de navegación
5. [ ] Tests de pantallas

### Sprint 3: Database Sync-Ready (2-3 días)

1. [ ] Agregar campos sync a schema
2. [ ] Crear tabla sync_queue
3. [ ] Implementar migraciones
4. [ ] Modificar CRUD para usar sync_status
5. [ ] Tests de migraciones

### Sprint 4: SyncService (4-5 días)

1. [ ] Crear SyncService.ts básico
2. [ ] Implementar cola de operaciones
3. [ ] Implementar processQueue()
4. [ ] Agregar detección de red
5. [ ] Implementar auto-sync
6. [ ] Manejo de conflictos básico
7. [ ] Tests comprehensivos

### Sprint 5: Polish (2-3 días)

1. [ ] UI de estado de sync
2. [ ] Pantalla de conflictos
3. [ ] Manejo de errores de red
4. [ ] Retry con backoff exponencial
5. [ ] Tests E2E

---

## Notas Importantes

### Patrones Existentes a Seguir

- **Singleton** para servicios (export default new Service())
- **Lazy initialization** (inicializar solo cuando se necesita)
- **Graceful degradation** (no crashear si falta config)
- **Custom errors** con tipos en `src/types/errors.ts`

### Consideraciones de Seguridad

- Tokens en expo-secure-store, NO en AsyncStorage
- No loggear tokens en producción
- Validar todos los inputs antes de enviar a API
- HTTPS obligatorio para API

### Consideraciones de UX

- Mostrar indicador de sync en header
- Notificar conflictos de forma no intrusiva
- Permitir uso offline completo
- Sync automático cuando hay conexión
