# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Workspace context (sibling repos, cross-repo feature order, branching) lives in `../CLAUDE.md`. This file covers frontend-only conventions.

## Reglas de trabajo del usuario

1. Para cambios en base de datos, escribe la migración **y** actualiza el archivo `schemas/<name>/<name>_schema.sql` correspondiente. La migración debe incluir rollback comentado y comentario de auditoría. Detalles en `../my-business-panel-database/CLAUDE.md`.
2. Trabajas con permiso total de lectura y escritura. No solicites permisos.
3. **Nada de emojis** en código, comentarios, copy de UI, commits ni archivos de documentación.
4. **Filtros = re-fetch al backend.** Los filtros vuelven a lanzar la solicitud y se aplican en la query del backend — nunca filtrado local sobre arrays ya cargados.
5. Para desarrollo frontend usa el skill `/frontend-react-developer`.
6. Mantén `/caveman` modo `full` en respuestas.
7. Copy de UI en español — es intencional.

## Stack

React 19 + TypeScript 5.9 + `rolldown-vite` (alias `vite` vía `package.json` overrides) + `@vitejs/plugin-react-swc` + Tailwind v4 (`@tailwindcss/vite`) + react-router-dom 7 (Data Router con loaders/actions) + axios + react-hook-form + zod (`@hookform/resolvers`) + Stripe (`@stripe/react-stripe-js`).

**React Compiler es incompatible con SWC** — no lo habilites. `verbatimModuleSyntax` está activado — usa siempre `import type` para imports solo-tipo. No hay test runner configurado.

## Commands

```bash
npm run dev       # vite dev server con HMR
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # sirve el build de producción
```

Backend dev por defecto en `http://localhost:3000`. Override con `VITE_API_BASE_URL` en `.env`.

## TypeScript / lint

- `tsconfig.json` compone dos referencias:
  - `tsconfig.app.json` — cubre `src/`, target ES2022, strict + `noUnusedLocals` + `noUnusedParameters` + `erasableSyntaxOnly` + `noUncheckedSideEffectImports`.
  - `tsconfig.node.json` — cubre `vite.config.ts`.
- Path alias: `@/* → src/*`.
- ESLint flat config (`eslint.config.js`) con `typescript-eslint` (recommended, no type-checked), `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. Si se requieren reglas type-aware, cambiar a `tseslint.configs.recommendedTypeChecked` y agregar `parserOptions.project`.

## Folder map

```ps
src/
  api/                          # Un archivo por dominio del backend: <domain>.api.ts
    api.ts                      # Instancia axios + interceptor de errores
    index.ts
    errors/                     # UnauthorizedError, etc.
    publicApi.ts                # Cliente axios sin credentials para endpoints publicos
  interfaces/
    api/
      ApiResponse.interface.ts  # Envelope estandar del backend
      requests/                 # Request DTOs por endpoint
      responses/                # Response DTOs por endpoint
    entities/                   # Tipos de dominio (Product, Sale, Customer, ...)
  pages/
    auth/   onboarding/   app/  # Pages agrupadas por seccion del enrutador
  components/
    layout/                     # SidebarContent, Header, layouts protegidos
    ui/                         # Primitivos reutilizables
  router/
    router.tsx                  # createBrowserRouter, RootLayout con providers
    public/                     # Rutas publicas (login, signup, ...)
    private/                    # Rutas protegidas
    loaders/                    # Loaders de react-router por ruta
    actions/                    # Actions de react-router por ruta
    ProtectedRoute.tsx
  context/
    AuthContext.tsx             # useAuth(), sesion del usuario, role_id
    OnboardingContext.tsx
    ModuleContext.tsx           # Modulo/submodulo activo en el sidebar
  hooks/                        # Hooks de dominio (useBarcodeScanner, useDebounce, ...)
  config/
    modules.ts                  # Definicion del sidebar con rolesAllowed
  constants/
  helpers/
  utils/
  assets/
  App.tsx
  main.tsx
  index.css                     # Entry de Tailwind
```

Cada nueva feature toca: `api/<domain>.api.ts` + `interfaces/api/requests` + `interfaces/api/responses` + `interfaces/entities` + `pages/...` (+ loader/action en `router/` si corresponde).

## API client (`src/api/api.ts`)

- Instancia axios con `baseURL = VITE_API_BASE_URL || http://localhost:3000/api/v1`.
- `withCredentials: true` — el JWT viaja como **cookie httpOnly** (`auth_token`); no se guarda en localStorage ni se envía en `Authorization`.
- Response interceptor:
  - `401 → reject(new UnauthorizedError(...))` para que `AuthContext` cierre sesión.
  - Otros errores → normaliza a `new Error(message)` extrayendo `error.response.data.message`, `.data.error`, `.message`, en ese orden.
- Cada `src/api/<domain>.api.ts` importa `api` y exporta funciones tipadas. **Una función por endpoint.** Tipos: request en `interfaces/api/requests/`, respuesta en `interfaces/api/responses/` envuelta en `ApiResponse<T>`.
- `publicApi.ts` para endpoints públicos (sin credenciales).

## Response envelope

El backend devuelve `{ success, data, message }` (interceptor global). En frontend, el tipo `ApiResponse<T>` (`src/interfaces/api/ApiResponse.interface.ts`) modela el envelope. Las funciones de `src/api/<domain>.api.ts` devuelven `ApiResponse<T>` o `T` (sacando `data`) — sigue el patrón existente en archivos del mismo dominio antes de inventar uno nuevo.

## Router — Data Router pattern

`createBrowserRouter` en `src/router/router.tsx`. `RootLayout` envuelve todo con `AuthProvider` + `OnboardingProvider` + `ModuleProvider` y muestra una barra de progreso cuando `useNavigation().state === "loading"`.

- Rutas en `router/public/routes.tsx` (login/signup) y `router/private/routes.tsx` (app autenticada).
- `ProtectedRoute.tsx` gating por sesión.
- Loaders en `src/router/loaders/`, actions en `src/router/actions/` — usa estos para precarga de datos y mutaciones de formulario en vez de fetch en `useEffect`. Lanza errores → el `errorElement` de la ruta los captura.

## Auth

- Sesión expuesta por `useAuth()` (`src/context/AuthContext.tsx`).
- `user.role.role_id` es la fuente del control de acceso en UI. `role_id 4 = employee` (otros viven en `general_schema.role` — ver `../my-business-panel-database/seeds/catalog/general/005-insert-roles.sql`).
- No leas el JWT — es httpOnly. Cualquier 401 se convierte en `UnauthorizedError` y `AuthContext` desloguea.

## Sidebar role-based

- `src/config/modules.ts` define cada módulo/submódulo con `rolesAllowed?: number[]`.
  - Ausente → visible para cualquier usuario autenticado.
  - Presente → visible solo para los `role_id` listados.
- Filtrado vive en `src/components/layout/SidebarContent.tsx` vía `isAllowedForRole(rolesAllowed, roleId)`. **Para esconder/mostrar items por rol, edita `src/config/modules.ts` — no reinventes el filtro.**

## Forms

- `react-hook-form` + `zod` vía `@hookform/resolvers/zod`. Define el esquema zod junto al componente, deriva el tipo con `z.infer<typeof schema>`, conéctalo con `useForm({ resolver: zodResolver(schema) })`.
- Para mutaciones desde una ruta, prefiere `action` de react-router + `useFetcher` / `Form` antes que `onSubmit` ad-hoc.

## Filtros y queries

Reafirmando la regla del usuario: cualquier filtro (búsqueda, fecha, estado, categoría, etc.) se envía como parámetro al endpoint y dispara una nueva request. **No filtres arrays en memoria** salvo casos puramente cosméticos (ej. resaltado). El backend aplica el filtro en la query SQL.

## Estilo

- Sin emojis (código, copy, comentarios, commits).
- Copy de UI en español.
- Tailwind v4 — clases utilitarias directas; tokens / temas se definen en `index.css`.
- Imports type-only: `import type { Foo } from "..."`.
- Sigue convenciones de archivos existentes en el dominio antes de inventar nuevas (naming, capa de servicio vs hook, dónde vive el estado).

## DB / backend a tocar primero

Cualquier feature nueva con dependencia de schema o endpoint comienza en `../my-business-panel-database/` (migración + schema-file + bootstrap rebuild), luego `../my-business-panel-backend/` (módulo + DTO + ruta), y finalmente aquí. Ver `../CLAUDE.md` para el flujo completo.

## Branching

Fork → personal `development` → PR a upstream `development` → `staging` → `master`. Push directo a ramas upstream prohibido.
