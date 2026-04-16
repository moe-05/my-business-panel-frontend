# Plan de Desarrollo - General Context Frontend

**Versión:** 2.0 (Condensado)  
**Enfoque:** Alcance, objetivos, endpoints, fases de desarrollo  
**Estrategia:** Mobile-First

---

## 📋 OBJETIVO GENERAL

Desarrollar el contexto general de la aplicación que proporciona:

- **Onboarding:** Registro, setup de tenant, pago de suscripción
- **Autenticación:** Login/logout con manejo de roles (superadmin vs tenant users)
- **Dashboard:** Panel de control general del tenant
- **Gestión de datos transversales:** Usuarios, sucursales, productos, clientes, configuración

---

## 🎯 ALCANCE Y MÓDULOS

### Módulos Incluidos

| Módulo            | Alcance                              | Usuarios Objetivo     |
| ----------------- | ------------------------------------ | --------------------- |
| **Onboarding**    | Registro, setup tenant, pago Stripe  | Nuevos usuarios       |
| **Autenticación** | Login/logout, session management     | Todos                 |
| **Dashboard**     | Panel central con acceso a contextos | Todos (admin + users) |
| **Usuarios**      | CRUD, roles, búsqueda, filtros       | Admin nivel 2+        |
| **Tenants**       | CRUD (solo admin nivel 1)            | Admin nivel 1         |
| **Sucursales**    | CRUD por tenant                      | Admin nivel 2+        |
| **Productos**     | CRUD, búsqueda, filtros              | Admin nivel 2+        |
| **Clientes**      | CRUD, segmentación, búsqueda         | Admin nivel 2+        |
| **Configuración** | Segmentos, márgenes, tipos doc       | Admin nivel 2+        |
| **Perfil**        | Datos personales, cambiar password   | Todos                 |

### Vistas Principales

```
1. Onboarding (Público)
   ├── Registro de nueva cuenta
   ├── Setup del tenant
   ├── Integración de pago Stripe
   └── Confirmación de suscripción

2. Autenticación (Público)
   ├── Login
   └── Recuperar contraseña

3. Dashboard (Protegido)
   ├── Vista Admin Nivel 1 (Global)
   │   ├── Stats globales
   │   ├── Acceso a todos los tenants
   │   └── Gestión multi-tenant
   └── Vista Admin Nivel 2-3 (Tenant)
       ├── Stats del tenant
       ├── Acceso limitado al tenant propio
       └── Gestión de datos internos

4. Gestión de Usuarios
   ├── Listado con search/filters
   ├── Create/edit modal
   └── Perfil individual

5. Gestión de Tenants (Solo Admin Nivel 1)
   ├── Listado global
   ├── Detail de tenant
   └── Gestión de sucursales

6. Gestión de Sucursales
   ├── Listado por tenant
   ├── Create/edit modal
   └── Asignación a usuarios

7. Gestión de Productos
   ├── Listado con search/filters
   ├── Create/edit modal
   └── Categorización (CABYS)

8. Gestión de Clientes
   ├── Listado con search/filters
   ├── Create/edit modal
   └── Segmentación

9. Configuración General
   ├── Segmentos de cliente
   ├── Márgenes por segmento
   ├── Tipos de documento
   └── Roles (read-only)

10. Perfil de Usuario
    ├── Datos personales
    ├── Cambiar contraseña
    ├── Historial de login
    └── Información de tenant
```

---

## 🔌 ENDPOINTS MAPEADOS

### Autenticación (3 endpoints)

```
POST   /auth/login
       Request: { email, password }
       Response: { token, user, role_id }

POST   /auth/register
       Request: { email, password, tenant_name, ... }
       Response: { user_id, tenant_id, subscription_id }

POST   /auth/logout
       Response: { message }
```

### Stripe/Pago (2 endpoints)

```
POST   /subscription/create-checkout
       Request: { tenant_id, plan_type }
       Response: { checkout_url }

POST   /subscription/verify-payment
       Request: { session_id }
       Response: { subscription_id, status }
```

### Usuarios (6 endpoints)

```
GET    /user
       Response: { email, role_id, tenant_id }

POST   /user
       Request: { tenant_id, email, password, role_id, ... }
       Response: { user_id }

GET    /user/:email
       Response: { user_id, email, role_id, tenant_id }

PATCH  /user/:userId
       Request: { password, role_id }
       Response: { user_id }

DELETE /user/:userId
       Response: { message }

GET    /user/roles
       Response: { roles[] }
```

### Tenants (5 endpoints)

```
POST   /tenant
       Request: { tenant_name, contact_email, identification, ... }
       Response: { tenant_id }

GET    /tenant
       Response: { tenants[] } (Solo admin nivel 1)

GET    /tenant/:tenantId
       Response: { tenant_id, name, users[], branches[] }

PATCH  /tenant/:tenantId
       Request: { tenant_name, contact_email, ... }
       Response: { tenant_id }

GET    /tenant/:tenantId/users
       Response: { users[] }
```

### Sucursales (6 endpoints)

```
POST   /branch
       Request: { tenant_id, branch_name, number, address, is_main }
       Response: { branch_id }

GET    /branch/tenant/:tenantId
       Response: { branches[] }

GET    /branch/:branchId
       Response: { branch_id, name, address, ... }

PATCH  /branch/:branchId
       Request: { branch_name, address, is_main }
       Response: { branch_id }

DELETE /branch/:branchId
       Response: { message }

GET    /branch
       Response: { branches[] } (Solo admin nivel 1 - todos)
```

### Productos (6 endpoints)

```
POST   /product
       Request: { tenant_id, sku, product_name, category_id, price, cabys_code }
       Response: { product_id }

GET    /product/:tenantId
       Response: { products[] }

GET    /product/:productId
       Response: { product_id, sku, name, price, ... }

PATCH  /product/:productId
       Request: { sku, product_name, price, ... }
       Response: { product_id }

DELETE /product/:productId
       Response: { message }

GET    /category
       Response: { categories[] }
```

### Clientes (6 endpoints)

```
POST   /customers
       Request: { tenant_id, first_name, last_name, identification_type, document_number, email, ... }
       Response: { customer_id }

GET    /customers/tenant/:tenantId
       Response: { customers[] }

GET    /customers/:customerId
       Response: { customer_id, name, document, email, ... }

PATCH  /customers/:customerId
       Request: { first_name, last_name, email, ... }
       Response: { customer_id }

DELETE /customers/:customerId
       Response: { message }

GET    /customers/doc/:documentNumber
       Response: { customer_id, name, ... }
```

### Configuración (8 endpoints)

```
GET    /segment
       Response: { segments[] }

POST   /segment
       Request: { tenant_id, segment_name, hierarchy }
       Response: { segment_id }

PATCH  /segment/:segmentId
       Request: { segment_name, hierarchy }
       Response: { segment_id }

DELETE /segment/:segmentId
       Response: { message }

GET    /margin/:tenantId
       Response: { margins[] }

POST   /margin
       Request: { tenant_id, segment_id, margin_percentage }
       Response: { margin_id }

GET    /document
       Response: { document_types[] }

GET    /user/roles
       Response: { roles[] }
```

**Total: 40 endpoints**

---

## 📱 Mobile-First Strategy

### Breakpoints

- **320px:** Mobile (phones)
- **768px:** Tablet
- **1024px:** Desktop pequeño
- **1440px:** Desktop completo

### Principios Implementados

- Navegación responsive (hamburger menu < 768px)
- Tablas con scroll horizontal en mobile
- Formularios en stack vertical en mobile
- Buttons min 44x44px (touch-friendly)
- Imágenes responsivas
- Performance optimizado para 4G

### Layout Adaptativo

```
Mobile (< 768px):
├── Header: Logo + Hamburger menu
├── Main: Full-width content
└── Drawer: Navigation menu (hidden, toggle con hamburger)

Desktop (> 768px):
├── Sidebar: Navigation permanente
├── Header: Logo + User menu
└── Main: Content area
```

---

## 🗺️ NAVEGACIÓN Y ARQUITECTURA

### Rutas Públicas

```
/auth
├── /auth/login
├── /auth/register
├── /auth/register/setup-tenant
├── /auth/register/payment
└── /auth/register/success
```

### Rutas Protegidas

**Admin Nivel 1 (Superusuario Global):**

```
/dashboard
├── /dashboard (stats globales)
├── /tenants (listado de todos)
│   ├── /tenants/:tenantId (detail)
│   └── /tenants/:tenantId/branches
├── /users (todos los usuarios)
├── /products (todos los productos)
└── /settings
```

**Admin Nivel 2-3 (Tenant User):**

```
/dashboard
├── /dashboard (stats del tenant)
├── /users (usuarios del tenant)
├── /branches (sucursales del tenant)
├── /products (productos del tenant)
├── /customers (clientes del tenant)
└── /settings (configuración del tenant)
```

**Común (Todos):**

```
/profile
├── /profile/me
├── /profile/change-password
└── /profile/security
```

---

## 📊 FASES DE DESARROLLO

### **FASE 1: ONBOARDING & AUTENTICACIÓN**

**Objetivos:**

- Sistema de registro de nuevos usuarios
- Setup del tenant inicial
- Integración con Stripe para pagos
- Login para usuarios existentes
- Validación de suscripción
- Manejo de roles (admin nivel 1 vs otros)

**Vistas:**

1. Página de registro
2. Setup del tenant
3. Pantalla de pago (Stripe checkout)
4. Confirmación de suscripción
5. Login

**Endpoints Usados:**

- POST /auth/register
- POST /auth/login
- POST /subscription/create-checkout
- POST /subscription/verify-payment

**Entregable:**

- Sistema de onboarding completamente funcional
- Usuarios pueden registrarse, crear tenant y pagar
- Usuarios existentes pueden hacer login
- Detección correcta de rol (nivel 1 vs otros)

**Criterios de Éxito:**

- ✅ Registro completa sin errores
- ✅ Pago Stripe integrado (sandbox)
- ✅ Login funciona para ambos roles
- ✅ Session persiste en reload
- ✅ Interfaz responsive en mobile/tablet/desktop
- ✅ Validaciones en tiempo real

---

### **FASE 2: DASHBOARD GENERAL**

**Objetivos:**

- Dashboard principal diferenciado por rol
- Panel de navegación a otros contextos
- Acceso a gestión de datos generales
- Stats e información relevante

**Vistas:**

1. Dashboard admin nivel 1 (acceso global)
2. Dashboard admin nivel 2-3 (acceso tenant)
3. Sidebar/Drawer de navegación
4. Cards de estadísticas

**Endpoints Usados:**

- GET /user
- GET /tenant (solo nivel 1)
- GET /tenant/:tenantId

**Entregable:**

- Dashboard funcional diferenciado por rol
- Navegación clara a otros contextos
- Información relevante visible
- Layout responsive

**Criterios de Éxito:**

- ✅ Vistas diferenciadas por rol
- ✅ Navegación intuitiva
- ✅ Stats actualizadas
- ✅ Responsive en todos los breakpoints
- ✅ Tiempo de carga < 1s

---

### **FASE 3: GESTIÓN DE USUARIOS**

**Objetivos:**

- CRUD completo de usuarios
- Búsqueda y filtrado
- Asignación de roles
- Vista de detalle

**Vistas:**

1. Lista de usuarios con search/filters
2. Modal crear/editar usuario
3. Detalle de usuario

**Endpoints Usados:**

- GET /user/roles
- POST /user
- GET /user/:email
- PATCH /user/:userId
- DELETE /user/:userId
- GET /tenant/:tenantId/users (para listar)

**Entregable:**

- Módulo de gestión de usuarios completo
- Búsqueda eficiente
- Validaciones de email único
- Asignación de roles

**Criterios de Éxito:**

- ✅ CRUD funcional
- ✅ Búsqueda responde < 500ms
- ✅ Validaciones correctas
- ✅ Paginación eficiente
- ✅ Responsive

---

### **FASE 4: GESTIÓN DE TENANTS (Admin Nivel 1)**

**Objetivos:**

- Visualización de todos los tenants
- Detail view de cada tenant
- CRUD de sucursales por tenant
- Información de usuarios por tenant

**Vistas:**

1. Listado global de tenants
2. Detail de tenant
3. Listado de sucursales del tenant
4. CRUD de sucursales

**Endpoints Usados:**

- GET /tenant
- GET /tenant/:tenantId
- GET /tenant/:tenantId/users
- POST /branch
- GET /branch/tenant/:tenantId
- PATCH /branch/:branchId
- DELETE /branch/:branchId

**Entregable:**

- Módulo de tenants funcional para admin nivel 1
- Gestión de sucursales integrada
- Vista de usuarios por tenant
- Información consolidada

**Criterios de Éxito:**

- ✅ Listado de tenants cargado
- ✅ Detail view completo
- ✅ CRUD sucursales funcional
- ✅ Información consolidada
- ✅ Responsive

---

### **FASE 5: GESTIÓN DE SUCURSALES (Tenant Users)**

**Objetivos:**

- CRUD de sucursales propias del tenant
- Validación de rama principal única
- Información y contacto

**Vistas:**

1. Listado de sucursales
2. Modal crear/editar sucursal
3. Detalle de sucursal

**Endpoints Usados:**

- GET /branch/tenant/:tenantId
- POST /branch
- PATCH /branch/:branchId
- DELETE /branch/:branchId

**Entregable:**

- Módulo de sucursales funcional
- Validaciones correctas
- Interfaz clara

**Criterios de Éxito:**

- ✅ CRUD funcional
- ✅ Flag main branch validado
- ✅ Información de contacto almacenada
- ✅ Responsive

---

### **FASE 6: GESTIÓN DE PRODUCTOS**

**Objetivos:**

- CRUD de productos del tenant
- Búsqueda y filtrado por categoría
- Gestión de precios
- Códigos CABYS

**Vistas:**

1. Listado de productos con search/filters
2. Modal crear/editar producto
3. Detalle de producto

**Endpoints Usados:**

- GET /category
- POST /product
- GET /product/:tenantId
- PATCH /product/:productId
- DELETE /product/:productId
- GET /product/:productId

**Entregable:**

- Módulo de productos funcional
- Búsqueda y filtrado
- Gestión de categorías
- Validación de SKU único

**Criterios de Éxito:**

- ✅ CRUD funcional
- ✅ Búsqueda < 500ms
- ✅ Filtrado por categoría
- ✅ Validación SKU único
- ✅ Paginación eficiente
- ✅ Responsive

---

### **FASE 7: GESTIÓN DE CLIENTES**

**Objetivos:**

- CRUD de clientes del tenant
- Búsqueda por nombre/documento/email
- Segmentación de clientes
- Información de contacto

**Vistas:**

1. Listado de clientes con search/filters
2. Modal crear/editar cliente
3. Detalle de cliente

**Endpoints Usados:**

- POST /customers
- GET /customers/tenant/:tenantId
- GET /customers/:customerId
- PATCH /customers/:customerId
- DELETE /customers/:customerId
- GET /customers/doc/:documentNumber
- GET /segment

**Entregable:**

- Módulo de clientes funcional
- Búsqueda multifiltro
- Segmentación
- Validaciones de documento

**Criterios de Éxito:**

- ✅ CRUD funcional
- ✅ Búsqueda eficiente
- ✅ Validación documento único
- ✅ Segmentación asignada
- ✅ Paginación
- ✅ Responsive

---

### **FASE 8: CONFIGURACIÓN GENERAL**

**Objetivos:**

- Gestión de segmentos de cliente
- Configuración de márgenes por segmento
- Visualización de tipos de documento
- Visualización de roles

**Vistas:**

1. Dashboard de configuración con tabs
2. Gestión de segmentos
3. Gestión de márgenes
4. Vista de tipos de documento (read-only)
5. Vista de roles (read-only)

**Endpoints Usados:**

- GET /segment
- POST /segment
- PATCH /segment/:segmentId
- DELETE /segment/:segmentId
- GET /margin/:tenantId
- POST /margin
- GET /document
- GET /user/roles

**Entregable:**

- Centro de configuración funcional
- CRUD de segmentos
- Gestión de márgenes
- Catálogos visualizables

**Criterios de Éxito:**

- ✅ CRUD segmentos funcional
- ✅ Configuración de márgenes
- ✅ Catálogos cargados
- ✅ Interfaz clara
- ✅ Responsive

---

### **FASE 9: PERFIL DE USUARIO**

**Objetivos:**

- Visualización de datos personales
- Cambio de contraseña
- Historial de login
- Información del tenant asignado

**Vistas:**

1. Perfil personal
2. Modal cambiar contraseña
3. Historial de sesiones

**Endpoints Usados:**

- GET /user
- PATCH /user/:userId (password)
- GET /tenant/:tenantId (info del tenant)

**Entregable:**

- Módulo de perfil funcional
- Gestión de contraseña
- Información de seguridad

**Criterios de Éxito:**

- ✅ Datos mostrados correctamente
- ✅ Cambio de password funciona
- ✅ Historial visible
- ✅ Seguro (validaciones)
- ✅ Responsive

---

### **FASE 10: VALIDACIONES, TESTING Y OPTIMIZACIÓN**

**Objetivos:**

- Correcciones y completas (frontend + backend). a continuacion, una lista de funciones que se deben cumplir y actualmente no están funcionando: - Dashboard: 1. al hacer hover sobre un card de modulo se debe colorear el mismo del color correspondinete de acentuacion 2. para todas las tablas se debe implementar paginación limit-offset de 100 elementos por default - Usuarios: 1. al entrar a esta seccion se deben cargar todos los usuarios pertenecientes al tenant. si el usuario es superUser entonces puede ver todos los usuarios del sistema, independientemente del tenant al que pertenezcan. 2. solo los usuarios superuser pueden crear otros usuarios desde esta vista. 3. al hacer click sobre un usuario mostrado en la tabla, se debe ver un modal con toda su informacion (tenant, user, employee y contract si aplican estas dos ultimas) - Sucursales (branch): 1. al entrar a esta seccion se deben cargar todos los branches pertenecientes al tenant. si el usuario es superUser entonces puede ver todos los branches del sistema, independientemente del tenant al que pertenezcan. 2. solo los usuarios superuser y admin pueden crear otros branches desde el formulario de esta vista. en caso de ser superuser, se debe mostrar un input que permita a qué tenant se va a asignar ese registro de branch recien creado. 3. al hacer click sobre un branch mostrado en la tabla, se debe ver un modal con toda su informacion (branch, branch_location) - Productos 1. al entrar a esta seccion se deben cargar todos los productos (prodcut_variant) pertenecientes al tenant. si el usuario es superUser entonces puede ver todos los product variant del sistema, independientemente del tenant al que pertenezcan. 2. solo los usuarios superuser y admin pueden crear otros registros de product variant desde el formulario de esta vista. en caso de ser superuser, se debe mostrar un input que permita a qué tenant se va a asignar ese registro de product_variant recien creado. 3. al hacer click sobre un producto mostrado en la tabla, se debe ver un modal con toda su informacion (registro completo de product_variant) 4. el select de categoría actualmente está fetching mas de 27000 registros, que corresponden al catalogo cabys guardado en la base de datos. esto debe paginarse en lotes de 100 registros e incluir una opcion de busqueda por texto con un debounce de 500ms. 5. no interesa mostrar el count total de categorias. 6. al crear un nuevo registro de product_variant, se debe dar la opcion de asignar atributos al producto (ver tablas relativas al modelo eav en general_schema.sql en ../my-business-panel-database/schemas) - Clientes: 1. al entrar a esta seccion se deben cargar todos los clientes (tenant_customer) pertenecientes al tenant. si el usuario es superUser entonces puede ver todos los clientes del sistema, independientemente del tenant al que pertenezcan. 2. solo los usuarios superuser y admin pueden crear otros clientes desde el formulario de esta vista. en caso de ser superuser, se debe mostrar un input que permita a qué tenant se va a asignar ese registro de cliente recien creado. 3. al hacer click sobre un branch mostrado en la tabla, se debe ver un modal con toda su informacion (registro completo de tenant_customer) - configuración: 1. eliminar pestaña de tipo de documento y de roles. 2. agregar pestaña para configurar programa de lealtad que permita canje de puntos en compras de clientes (ver tablas en ../my-business-panel-database/schemas)/pos/pos_schema.sql). 3. la pestaña de margenes se debe fusionar con la pestaña de segmentos. los segmentos de clientes deben ser configurable spor cada tenant, permitiendo insertar un tipo de margen de segmentacion de clientes. (ver tablas customer_segment_margin_type, customer_segment_margin y customer_segment) 4. agregar pestaña de configuracion de hacienda que permita ver y modificar los datos del usuario (ver tabla tenant_hacienda_config) 5. agregar una breve explicacion en las pestañas de configuracion de hacienda, de programa de lealtad y segmentacion de clientes

- Accesibilidad (WCAG 2.1 AA)
- Documentación

**Entregable:**

- Aplicación production-ready
- Test coverage > 80%
- Performance optimizado
- Accesibilidad validada
- Documentación completa

**Criterios de Éxito:**

- ✅ Validaciones frontend + backend
- ✅ Bundle size < 500KB
- ✅ 0 a11y issues
- ✅ Responsive perfectamente

---

## 📊 RESUMEN POR FASE

| Fase | Alcance           | Vistas | Endpoints | Status   |
| ---- | ----------------- | ------ | --------- | -------- |
| 1    | Onboarding + Auth | 5      | 5         | Core     |
| 2    | Dashboard         | 2      | 3         | Core     |
| 3    | Usuarios          | 3      | 6         | Esencial |
| 4    | Tenants (Admin)   | 3      | 7         | Esencial |
| 5    | Sucursales        | 3      | 4         | Esencial |
| 6    | Productos         | 3      | 5         | Esencial |
| 7    | Clientes          | 3      | 6         | Esencial |
| 8    | Configuración     | 5      | 8         | Esencial |
| 9    | Perfil            | 3      | 3         | Esencial |
| 10   | Testing & Opt     | -      | -         | Quality  |

---

## 🎯 DIFERENCIACIÓN POR ROL

### Admin Nivel 1 (Superusuario)

- Acceso a TODOS los tenants
- Ver listado global de usuarios
- Ver listado global de productos
- Ver listado global de sucursales
- Gestionar tenants (CRUD)
- Dashboard con stats globales

### Admin Nivel 2-3 (Tenant User)

- Acceso SOLO al tenant propio
- Gestionar usuarios del tenant
- Gestionar sucursales del tenant
- Gestionar productos del tenant
- Gestionar clientes del tenant
- Configurar segmentos y márgenes
- Dashboard con stats del tenant

### Común (Todos los roles)

- Ver/editar propio perfil
- Cambiar contraseña
- Ver historial de login
- Logout

---

## ✅ CRITERIOS DE ÉXITO GLOBALES

**Funcionalidad:**

- ✅ Todas las fases completadas
- ✅ CRUD funcional en todos los módulos
- ✅ Validaciones frontend + backend
- ✅ Búsqueda y filtrado eficientes
- ✅ Paginación correcta
- ✅ Detección de rol correcta (nivel 1 vs otros)
- ✅ Acceso restringido según rol

**Performance:**

- ✅ Login < 2 segundos
- ✅ Búsqueda < 500ms
- ✅ Listados carguen < 1 segundo
- ✅ Bundle size < 500KB
- ✅ Lighthouse score > 90

**Calidad:**

- ✅ Test coverage > 80%
- ✅ 0 errores de accesibilidad (WCAG 2.1 AA)
- ✅ Responsive en todos los breakpoints
- ✅ Funcionamiento en mobile/tablet/desktop

**Seguridad:**

- ✅ Token JWT en httpOnly
- ✅ CSRF protection
- ✅ Input sanitization
- ✅ Validaciones de acceso por rol

---

## 📍 NAVEGACIÓN FINAL

```
/ (Redirige a /auth/login)
│
├── /auth (Público)
│   ├── /login
│   ├── /register
│   ├── /register/setup-tenant
│   ├── /register/payment
│   └── /register/success
│
└── /app (Protegido)
    ├── /dashboard
    │
    ├── ADMIN NIVEL 1
    │   ├── /tenants
    │   ├── /tenants/:tenantId
    │   ├── /users
    │   └── /products
    │
    ├── ADMIN NIVEL 2-3
    │   ├── /users
    │   ├── /branches
    │   ├── /products
    │   ├── /customers
    │   └── /settings
    │
    └── COMÚN
        └── /profile
```

---

**Estado:** Ready for Development  
**Versión:** 2.0 (Condensada)  
**Enfoque:** Alcance, Objetivos, Endpoints, Fases
