# Naming Rules

All files follow this pattern:

```
name-in-kebab-case.type.ts   (or .tsx for React components)
```

The `type` segment identifies the role of the file in the architecture. Omit `type` only for plain components (UI, layout, pages) where the role is clear from the folder.

---

## File Types and Their Suffixes

| Role | Suffix | Extension |
|---|---|---|
| API service | `.api` | `.ts` |
| Router action (mutation) | `.actions` | `.ts` |
| Router loader (fetch) | `.loader` | `.ts` |
| TypeScript interface | `.interface` | `.ts` |
| Zod schema | `.schema` | `.ts` |
| Catalog constant | `.catalog` | `.ts` |
| Context | *(no suffix)* | `.tsx` |
| Hook | *(no suffix)* | `.ts` |
| Component (UI/Layout) | *(no suffix)* | `.tsx` |
| Page component | *(no suffix)* | `.tsx` |
| Config | `.config` | `.ts` |

---

## Naming Rules by File Type

### Page components

Pages live inside a named folder that matches the component:

```
src/pages/<scope>/<Name>Page/<Name>Page.tsx
```

`<scope>` is either `public` (no auth required) or `private` (requires auth).

**Examples:**
```
src/pages/public/AuthPage/AuthPage.tsx
src/pages/public/LandingPage/LandingPage.tsx
src/pages/private/DashboardPage/DashboardPage.tsx
src/pages/private/UsersPage/UsersPage.tsx
src/pages/private/SettingsPage/SettingsPage.tsx
```

Auxiliary files co-located with a page (schema, local hooks, local types) live in the same folder:
```
src/pages/public/AuthPage/
├── AuthPage.tsx
├── auth.schema.ts
```

### UI and Layout components

PascalCase, no suffix, no folder (unless the component is complex enough to need co-located files):
```
src/components/ui/Input.tsx
src/components/ui/Button.tsx
src/components/ui/DataTable.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Topbar.tsx
src/components/layout/AppLayout.tsx
```

### Contexts

PascalCase, no suffix:
```
src/contexts/AuthContext.tsx
src/contexts/OnboardingContext.tsx
src/contexts/ModuleContext.tsx
```

### Hooks

camelCase, prefixed with `use`:
```
src/hooks/useSearchQuery.ts
src/hooks/usePagination.ts
src/hooks/useMediaQuery.ts
src/hooks/useInfiniteScroll.ts
```

### API files

kebab-case entity name + `.api` suffix:
```
src/api/user.api.ts
src/api/auth.api.ts
src/api/product.api.ts
src/api/index.ts        ← exports all api files + the base url constant
```

### Action files

kebab-case entity name + `.actions` suffix:
```
src/router/actions/user.actions.ts
src/router/actions/auth.actions.ts
src/router/actions/posts.actions.ts
```

### Loader files

kebab-case entity name + `.loader` suffix:
```
src/router/loaders/dashboard.loader.ts
src/router/loaders/users.loader.ts
src/router/loaders/settings.loader.ts
```

### Interface files

PascalCase + `.interface` suffix. The name describes what the interface represents:
```
src/interfaces/api/ApiResponse.interface.ts
src/interfaces/api/requests/CreateUserRequest.interface.ts
src/interfaces/api/requests/UpdateProductRequest.interface.ts
src/interfaces/api/responses/CreateUserResponse.interface.ts
src/interfaces/api/responses/PaginatedUsers.interface.ts
src/interfaces/components/models/User.interface.ts
src/interfaces/components/models/Product.interface.ts
src/interfaces/components/ui/ButtonProps.interface.ts
src/interfaces/components/layout/SidebarProps.interface.ts
```

Component prop interfaces are named `[ComponentName]Props`:
```ts
// src/interfaces/components/ui/ButtonProps.interface.ts
export interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  onClick?: () => void
}
```

### Zod schemas

Co-located with the component that uses them. kebab-case + `.schema` suffix:
```
src/pages/public/AuthPage/auth.schema.ts
src/pages/private/UsersPage/create-user.schema.ts
```

### Constant catalogs

kebab-case name + `.catalog` suffix. The exported constant is SCREAMING_SNAKE_CASE:
```
src/constants/identification-types.catalog.ts
src/constants/country-codes.catalog.ts
src/constants/user-roles.catalog.ts
```

```ts
// src/constants/identification-types.catalog.ts
export const IDENTIFICATION_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'RUC', label: 'RUC' },
] as const
```

### Router files

```
src/router/router.tsx              ← creates the router with createBrowserRouter
src/router/index.ts                ← exports AppRouter component
src/router/public/routes.tsx       ← public RouteObject[]
src/router/private/routes.tsx      ← private RouteObject[]
src/router/private/ProtectedLayout.tsx
```

---

## General Rules

- **kebab-case** for multi-word file names: `user-profile.api.ts`, not `userProfile.api.ts`.
- **PascalCase** for React components (`.tsx`): `UserCard.tsx`, not `user-card.tsx`.
- **camelCase** for hooks: `useSearchQuery.ts`.
- **No barrel files** inside `components/` or `pages/` unless there's a specific reason. Barrel files in `api/index.ts` are the exception — that one is required.
- **No default exports** on anything except page components and `App.tsx`. Everything else uses named exports.
- Environment variables: always prefixed with `VITE_`. The base API URL is always `VITE_API_BASE_URL`.
