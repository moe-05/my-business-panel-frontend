# Full Project Directory Structure

Use this structure for projects that connect to a backend API, have authentication, or belong to a micro-frontend system.

```
my-app/
├── public/
│   └── media/                      # Static assets served as-is (favicons, og images, etc.)
│
├── src/
│   ├── api/                        # HTTP layer — one file per backend resource
│   │   ├── index.ts                # Re-exports all *.api.ts + exports `url` constant
│   │   ├── auth.api.ts
│   │   ├── user.api.ts
│   │   └── product.api.ts
│   │
│   ├── assets/                     # Bundled static assets
│   │   ├── fonts/                  # .woff2 only
│   │   ├── icons/                  # .svg preferred
│   │   ├── images/                 # .webp only
│   │   └── videos/                 # .webm only
│   │
│   ├── components/
│   │   ├── layout/                 # Structural components (Sidebar, Topbar, AppLayout, etc.)
│   │   └── ui/                     # Reusable UI atoms/molecules (Button, Input, Modal, etc.)
│   │
│   ├── constants/                  # Small static catalogs that mirror DB lookup tables
│   │   ├── identification-types.catalog.ts
│   │   └── user-roles.catalog.ts
│   │
│   ├── contexts/                   # React Context providers for global state
│   │   ├── AuthContext.tsx
│   │   └── ModuleContext.tsx
│   │
│   ├── hooks/                      # Reusable custom hooks
│   │   ├── useSearchQuery.ts
│   │   └── usePagination.ts
│   │
│   ├── interfaces/
│   │   ├── api/
│   │   │   ├── ApiResponse.interface.ts   # Generic wrapper for all API responses
│   │   │   ├── requests/                  # Interfaces matching backend DTOs
│   │   │   │   ├── CreateUserRequest.interface.ts
│   │   │   │   └── UpdateProductRequest.interface.ts
│   │   │   └── responses/                 # Custom/composed response shapes
│   │   │       ├── PaginatedUsers.interface.ts
│   │   │       └── CreateUserResponse.interface.ts
│   │   └── components/
│   │       ├── layout/                    # Props interfaces for layout components
│   │       ├── models/                    # Entity interfaces (mirror DB models)
│   │       │   ├── User.interface.ts
│   │       │   └── Product.interface.ts
│   │       └── ui/                        # Props interfaces for UI components
│   │           ├── ButtonProps.interface.ts
│   │           └── InputProps.interface.ts
│   │
│   ├── pages/
│   │   ├── public/                        # Routes accessible without authentication
│   │   │   ├── AuthPage/
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   └── auth.schema.ts
│   │   │   └── NotFoundPage/
│   │   │       └── NotFoundPage.tsx
│   │   └── private/                       # Routes behind ProtectedLayout
│   │       ├── DashboardPage/
│   │       │   └── DashboardPage.tsx
│   │       ├── UsersPage/
│   │       │   ├── UsersPage.tsx
│   │       │   └── create-user.schema.ts
│   │       └── SettingsPage/
│   │           └── SettingsPage.tsx
│   │
│   ├── router/
│   │   ├── actions/                       # Mutation handlers (POST, PUT, PATCH, DELETE)
│   │   │   ├── auth.actions.ts
│   │   │   ├── user.actions.ts
│   │   │   └── product.actions.ts
│   │   ├── loaders/                       # Data fetchers called before route renders
│   │   │   ├── dashboard.loader.ts
│   │   │   └── users.loader.ts
│   │   ├── private/
│   │   │   ├── ProtectedLayout.tsx        # Auth guard — redirects to login if not authed
│   │   │   └── routes.tsx                 # RouteObject[] for private routes
│   │   ├── public/
│   │   │   └── routes.tsx                 # RouteObject[] for public routes
│   │   ├── router.tsx                     # createBrowserRouter() + RootLayout
│   │   └── index.ts                       # Exports AppRouter component
│   │
│   ├── services/                          # Third-party integrations & heavy frontend logic
│   │   └── analytics.service.ts           # e.g. Google Analytics, Segment, etc.
│   │
│   ├── utils/                             # Pure utility functions (no React, no side effects)
│   │   ├── format-date.ts
│   │   └── format-currency.ts
│   │
│   ├── App.tsx                            # Renders <AppRouter />
│   ├── index.css                          # Tailwind base + CSS custom properties
│   └── main.tsx                           # App entry point — renders <App /> into the DOM
│
├── .env                                   # VITE_API_BASE_URL= (always first)
├── .env.example                           # Committed version with empty values
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key files

**`src/api/index.ts`**
```ts
export const url = import.meta.env.VITE_API_BASE_URL

export { authApi } from './auth.api'
export { userApi } from './user.api'
```

**`src/interfaces/api/ApiResponse.interface.ts`**
```ts
export interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  timestamp: string
}
```

**`.env`**
```
VITE_API_BASE_URL=http://localhost:3000
```
