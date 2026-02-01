# Stokk - Roadmap de Desarrollo

Este documento describe la visión futura de Stokk y las fases para evolucionar de una app offline a una plataforma completa con sincronización en la nube.

## Visión General

```
ACTUAL                          FUTURO
┌─────────────┐                ┌─────────────────────────────────────┐
│  App Móvil  │                │            Ecosistema Stokk         │
│   (Expo)    │                │                                     │
│      │      │                │  ┌─────────┐  ┌─────────┐  ┌─────┐ │
│   SQLite    │      ───►      │  │App Móvil│  │Panel Web│  │ API │ │
│   (local)   │                │  └────┬────┘  └────┬────┘  └──┬──┘ │
└─────────────┘                │       └──────┬─────┘          │    │
                               │              ▼                ▼    │
                               │         ┌─────────────────────┐    │
                               │         │   Backend (Rails)   │    │
                               │         │   + PostgreSQL      │    │
                               │         └─────────────────────┘    │
                               └─────────────────────────────────────┘
```

## Estado Actual

- App móvil React Native + Expo
- Almacenamiento 100% local (SQLite)
- Usuario único por dispositivo
- Sin sincronización entre dispositivos

---

## Fase 1: API REST con Rails

**Objetivo:** Crear el backend que servirá como base para todo lo demás.

### Stack Recomendado

| Componente     | Tecnología                  | Razón                                       |
| -------------- | --------------------------- | ------------------------------------------- |
| Framework      | Ruby on Rails 7+ (API mode) | Rápido de desarrollar, convenciones sólidas |
| Base de datos  | PostgreSQL                  | Escalable, robusto, buen soporte JSON       |
| Autenticación  | Devise + JWT                | Estándar en Rails, tokens para mobile       |
| Hosting        | Railway / Render / Fly.io   | Fácil deploy, tier gratuito para empezar    |
| Almacenamiento | AWS S3 / Cloudflare R2      | Para imágenes de productos                  |

### Endpoints Básicos

```
POST   /api/v1/auth/register     # Crear cuenta
POST   /api/v1/auth/login        # Iniciar sesión
POST   /api/v1/auth/logout       # Cerrar sesión
GET    /api/v1/auth/me           # Usuario actual

GET    /api/v1/articulos         # Listar productos
POST   /api/v1/articulos         # Crear producto
GET    /api/v1/articulos/:id     # Ver producto
PATCH  /api/v1/articulos/:id     # Actualizar producto
DELETE /api/v1/articulos/:id     # Eliminar producto

POST   /api/v1/articulos/:id/imagen  # Subir imagen
```

### Modelo de Datos (Rails)

```ruby
# Usuario
class User < ApplicationRecord
  has_many :articulos
  has_many :organizations, through: :memberships

  # email, password_digest, nombre, created_at, updated_at
end

# Producto (migrado desde SQLite)
class Articulo < ApplicationRecord
  belongs_to :user
  belongs_to :organization, optional: true

  # nombre, descripcion, precio, cantidad, imagen_url
  # numero_bodega, observaciones, fecha_ingreso
end
```

### Tareas

- [ ] Crear proyecto Rails en modo API (`rails new stokk-api --api`)
- [ ] Configurar PostgreSQL
- [ ] Implementar autenticación con Devise + JWT
- [ ] Crear modelo User y Articulo
- [ ] Implementar CRUD de artículos
- [ ] Agregar validaciones y tests
- [ ] Configurar CORS para la app móvil
- [ ] Deploy inicial en Railway/Render

---

## Fase 2: Sincronización en la App Móvil

**Objetivo:** Conectar la app móvil al backend manteniendo funcionalidad offline.

### Arquitectura Híbrida (Offline-First)

```
┌─────────────────────────────────────────────┐
│                 App Móvil                    │
│                                              │
│  ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ UI/UX    │◄──►│ SyncService│◄──►│ API   │ │
│  └────┬─────┘    └─────┬────┘    └────────┘ │
│       │                │                     │
│       ▼                ▼                     │
│  ┌─────────────────────────┐                │
│  │   SQLite (fuente local) │                │
│  └─────────────────────────┘                │
└─────────────────────────────────────────────┘
```

### Estrategia de Sincronización

1. **SQLite sigue siendo la fuente principal** - La app funciona igual sin internet
2. **Sync bidireccional** - Cambios locales se suben, cambios del servidor se bajan
3. **Resolución de conflictos** - "Last write wins" o merge manual
4. **Cola de operaciones** - Cambios offline se encolan y sincronizan al reconectar

### Nuevo Servicio: SyncService

```typescript
// src/services/SyncService.ts
class SyncService {
  // Estado de sincronización
  async getSyncStatus(): Promise<SyncStatus>;

  // Sincronización manual
  async syncNow(): Promise<SyncResult>;

  // Sincronización en background
  async enableAutoSync(intervalMs: number): void;

  // Manejo de conflictos
  async resolveConflict(
    articuloId: number,
    resolution: 'local' | 'remote'
  ): void;

  // Cola de operaciones pendientes
  async getPendingOperations(): Promise<Operation[]>;
}
```

### Cambios en la App

- [ ] Agregar pantalla de Login/Registro
- [ ] Crear `AuthService` para manejar tokens JWT
- [ ] Crear `ApiService` para comunicación con backend
- [ ] Crear `SyncService` para sincronización
- [ ] Modificar `DatabaseManager` para soportar campos de sync (`syncedAt`, `remoteId`)
- [ ] Agregar indicador de estado de sync en UI
- [ ] Manejar subida de imágenes a S3
- [ ] Agregar pantalla de configuración de cuenta

### Esquema SQLite Actualizado

```sql
-- Nuevos campos para sincronización
ALTER TABLE articulos ADD COLUMN remote_id INTEGER;
ALTER TABLE articulos ADD COLUMN synced_at DATETIME;
ALTER TABLE articulos ADD COLUMN sync_status TEXT DEFAULT 'pending';
-- sync_status: 'pending' | 'synced' | 'conflict'

-- Tabla de operaciones pendientes
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY,
  operation TEXT NOT NULL,  -- 'create' | 'update' | 'delete'
  articulo_id INTEGER,
  payload TEXT,             -- JSON con los datos
  created_at DATETIME,
  attempts INTEGER DEFAULT 0
);
```

---

## Fase 3: Sistema Multi-Usuario

**Objetivo:** Permitir múltiples usuarios y organizaciones compartiendo inventarios.

### Modelo de Organizaciones

```
Usuario ──┬── puede pertenecer a ──► Organización(es)
          │
          └── tiene rol ──► admin | editor | viewer
```

### Nuevos Modelos (Rails)

```ruby
class Organization < ApplicationRecord
  has_many :memberships
  has_many :users, through: :memberships
  has_many :articulos

  # nombre, slug, created_at
end

class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  # role: 'admin' | 'editor' | 'viewer'
end
```

### Permisos por Rol

| Acción                  | Admin | Editor | Viewer |
| ----------------------- | :---: | :----: | :----: |
| Ver productos           |   ✓   |   ✓    |   ✓    |
| Crear/editar productos  |   ✓   |   ✓    |   ✗    |
| Eliminar productos      |   ✓   |   ✗    |   ✗    |
| Invitar usuarios        |   ✓   |   ✗    |   ✗    |
| Configurar organización |   ✓   |   ✗    |   ✗    |

### Nuevos Endpoints

```
# Organizaciones
GET    /api/v1/organizations
POST   /api/v1/organizations
PATCH  /api/v1/organizations/:id

# Miembros
GET    /api/v1/organizations/:id/members
POST   /api/v1/organizations/:id/members/invite
DELETE /api/v1/organizations/:id/members/:user_id

# Artículos por organización
GET    /api/v1/organizations/:id/articulos
```

### Cambios en la App

- [ ] Selector de organización/inventario personal
- [ ] Pantalla de gestión de organización
- [ ] Sistema de invitaciones (deep links)
- [ ] Indicador de permisos en UI

---

## Fase 4: Panel de Administración Web

**Objetivo:** Crear una interfaz web para gestionar inventarios desde el navegador.

### Opciones de Stack

#### Opción A: Rails + Hotwire (Recomendada para empezar)

```
Rails monolítico
├── API JSON (/api/v1/...)     # Para app móvil
└── HTML + Hotwire (/admin/...) # Para panel web
```

**Pros:** Un solo proyecto, desarrollo rápido, menos infraestructura
**Cons:** Menos interactivo que SPA

#### Opción B: Frontend Separado (Next.js/React)

```
┌─────────────┐     ┌─────────────┐
│  Next.js    │────►│  Rails API  │
│  (Vercel)   │     │  (Railway)  │
└─────────────┘     └─────────────┘
```

**Pros:** UI más rica, reutilizar conocimiento React
**Cons:** Dos proyectos, más complejidad

### Funcionalidades del Panel Web

1. **Dashboard**
   - Resumen de inventario (total productos, valor total)
   - Productos con stock bajo
   - Actividad reciente

2. **Gestión de Productos**
   - CRUD completo con tabla/grid
   - Filtros avanzados
   - Importar/exportar CSV
   - Edición masiva

3. **Reportes**
   - Valor del inventario en el tiempo
   - Movimientos de stock
   - Exportar a PDF/Excel

4. **Configuración**
   - Gestión de usuarios
   - Roles y permisos
   - Configuración de organización
   - Integraciones (futuro)

### Tareas

- [ ] Decidir stack (Hotwire vs Next.js)
- [ ] Diseñar wireframes básicos
- [ ] Implementar autenticación web
- [ ] Crear dashboard
- [ ] Implementar CRUD de productos
- [ ] Agregar reportes básicos

---

## Fase 5: Funcionalidades Avanzadas (Futuro)

Ideas para expandir después de las fases principales:

### Integraciones

- [ ] Exportar a sistemas contables (Facturación electrónica Chile)
- [ ] Conectar con e-commerce (Shopify, WooCommerce)
- [ ] Notificaciones push (stock bajo, actividad)

### Funcionalidades

- [ ] Códigos de barra / QR
- [ ] Múltiples bodegas/ubicaciones
- [ ] Historial de movimientos de stock
- [ ] Proveedores y órdenes de compra
- [ ] Clientes y órdenes de venta
- [ ] Reportes avanzados con gráficos

### Técnico

- [ ] API pública documentada (para integraciones terceros)
- [ ] Webhooks
- [ ] App para tablet con interfaz optimizada

---

## Cronograma Sugerido

Este es un orden lógico, no un timeline con fechas:

```
Fase 1: API Rails          ████████░░░░░░░░░░░░░░░░░░░░
Fase 2: Sync Móvil                 ████████████░░░░░░░░
Fase 3: Multi-Usuario                         ████████░
Fase 4: Panel Web                                    ███████████
Fase 5: Avanzado                                              ────────►
```

**Recomendación:** Completa cada fase antes de empezar la siguiente. Cada fase depende de la anterior.

---

## Decisiones Pendientes

Antes de empezar, considera estas preguntas:

### Infraestructura

- [ ] ¿Hosting: Railway, Render, Fly.io, o VPS propio?
- [ ] ¿Almacenamiento de imágenes: S3, Cloudflare R2, o servidor propio?
- [ ] ¿Dominio para la API? (ej: api.stokk.app)

### Modelo de Negocio

- [ ] ¿El sync será feature Pro o gratuito?
- [ ] ¿Límite de usuarios por organización?
- [ ] ¿Pricing para equipos/empresas?

### Técnico

- [ ] ¿Mantener compatibilidad con usuarios offline-only?
- [ ] ¿Migración de datos existentes al crear cuenta?

---

## Recursos Útiles

### Rails API

- [Rails API-only Applications](https://guides.rubyonrails.org/api_app.html)
- [Devise JWT](https://github.com/waiting-for-dev/devise-jwt)
- [Active Storage para S3](https://guides.rubyonrails.org/active_storage_overview.html)

### Sincronización Offline

- [WatermelonDB](https://github.com/Nozbe/WatermelonDB) - Base de datos para React Native con sync
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

### Panel Web

- [Hotwire](https://hotwired.dev/) - Full-stack sin mucho JavaScript
- [Next.js](https://nextjs.org/) - React framework con SSR

---

## Notas

- Este documento es una guía, no un plan rígido
- Ajusta según feedback de usuarios y prioridades del negocio
- Cada fase puede subdividirse en sprints más pequeños
- Considera hacer MVPs de cada fase antes de pulir

---

_Última actualización: Enero 2026_
