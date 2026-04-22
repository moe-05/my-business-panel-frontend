# Patterns Reference

This file documents the seven core patterns used in this frontend architecture. Each section explains the why, the how, and shows a complete example.

---

## 1. Component → Action → API

**Why this exists:** Mixing API calls inside components couples business logic to rendering. If the endpoint changes, you'd hunt through JSX files. Actions are the single integration point between the UI and the network layer, keeping both sides clean and independently testable.

**The flow:**
```
ComponentName.tsx  →  entity.actions.ts  →  entity.api.ts
```

Components call named functions exported from `*.actions.ts`. Actions may run pre-flight logic (validation, optimistic updates, token retrieval) before delegating to `*.api.ts`. The API file does one thing: make the HTTP request and return typed data (or throw).

### Example — Creating a user

**`src/pages/private/UsersPage/UsersPage.tsx`**
```tsx
import { createUser } from '@/router/actions/user.actions'
import type { CreateUserRequest } from '@/interfaces/api/requests/CreateUserRequest.interface'

const handleCreateUser = async (data: CreateUserRequest) => {
  const tempId = crypto.randomUUID()
  // optimistic update
  setUsers(prev => [...prev, { ...data, user_id: tempId }])
  setTotal(prev => prev + 1)

  try {
    const result = await createUser(data)
    setUsers(prev =>
      prev.map(u => (u.user_id === tempId ? { ...u, user_id: result.user_id } : u))
    )
  } catch (error) {
    // rollback
    setUsers(prev => prev.filter(u => u.user_id !== tempId))
    setTotal(prev => prev - 1)
  }
}
```

**`src/router/actions/user.actions.ts`**
```ts
import { userApi } from '@/api/user.api'
import type { CreateUserRequest } from '@/interfaces/api/requests/CreateUserRequest.interface'
import type { CreateUserResponse } from '@/interfaces/api/responses/CreateUserResponse.interface'

export const createUser = async (
  data: CreateUserRequest
): Promise<CreateUserResponse> => userApi.create(data)
```

**`src/api/user.api.ts`**
```ts
import { url } from '.'
import type { ApiResponse } from '@/interfaces/api/ApiResponse.interface'
import type { CreateUserRequest } from '@/interfaces/api/requests/CreateUserRequest.interface'
import type { CreateUserResponse } from '@/interfaces/api/responses/CreateUserResponse.interface'

export const userApi = {
  async create(data: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await fetch(`${url}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const json = await response.json()
    if (!response.ok) {
      const message = json?.message ?? json?.error ?? 'Error creating user'
      throw new Error(Array.isArray(message) ? message.join(', ') : message)
    }
    return (json as ApiResponse<CreateUserResponse>).data
  },
}
```

**`src/api/index.ts`**
```ts
export const url = import.meta.env.VITE_API_BASE_URL

export { userApi } from './user.api'
export { authApi } from './auth.api'
// ... add more as needed
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

---

## 2. Routing

**Why this exists:** Centralizing routing in a dedicated `router/` folder keeps the app entry point (`App.tsx`, `main.tsx`) minimal. Splitting public and private routes into separate files makes it easy to audit what's protected and what isn't.

**Key decisions:**
- `createBrowserRouter` (Data Router API) — enables loaders and actions.
- `RootLayout` wraps all providers so they're available in every route.
- A global loading bar renders when any loader is in flight (`useNavigation`).
- The catch-all (`path: '*'`) redirects to login.

**`src/router/router.tsx`**
```tsx
import { createBrowserRouter, Navigate, Outlet, useNavigation } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { publicRoutes } from './public/routes'
import { privateRoutes } from './private/routes'

function RootLayout() {
  const navigation = useNavigation()
  return (
    <AuthProvider>
      {navigation.state === 'loading' && (
        <div className="fixed top-0 inset-x-0 h-0.5 bg-accent-600 z-50 animate-pulse" />
      )}
      <Outlet />
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...publicRoutes,
      ...privateRoutes,
      { path: '*', element: <Navigate to="/auth/login" replace /> },
    ],
  },
])
```

**`src/router/index.ts`**
```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

**`src/App.tsx`**
```tsx
import { AppRouter } from '@/router'

export default function App() {
  return <AppRouter />
}
```

---

## 3. Loader Pattern

**Why this exists:** Loaders prevent a component from rendering in a loading skeleton state. The route doesn't activate until the data is ready. This produces cleaner UX and simpler component code — no `useEffect` + loading flag dance.

**Rules:**
- Loaders live in `src/router/loaders/[entity].loader.ts`.
- A loader function returns plain data (not JSX).
- Inside the component, use `useLoaderData()` typed with the loader's return type.
- Combine `loader` + `lazy` for code-splitting without losing prefetching.

**`src/router/loaders/users.loader.ts`**
```ts
import { userApi } from '@/api/user.api'
import type { PaginatedUsers } from '@/interfaces/api/responses/PaginatedUsers.interface'

export const getUsersPageData = async (): Promise<PaginatedUsers> => {
  return userApi.getAll({ page: 1, limit: 20 })
}
```

**`src/router/private/routes.tsx`** (using loader + lazy)
```tsx
import { getUsersPageData } from '@/router/loaders/users.loader'

export const privateRoutes: RouteObject[] = [
  {
    path: '/app',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'users',
        loader: getUsersPageData,
        lazy: async () => {
          const { UsersPage } = await import('@/pages/private/UsersPage/UsersPage')
          return { Component: UsersPage }
        },
      },
    ],
  },
]
```

**`src/pages/private/UsersPage/UsersPage.tsx`**
```tsx
import { useLoaderData } from 'react-router-dom'
import type { PaginatedUsers } from '@/interfaces/api/responses/PaginatedUsers.interface'

export function UsersPage() {
  const { items, total } = useLoaderData() as PaginatedUsers
  // data is guaranteed to be here — no loading state needed
  return <>{/* render */}</>
}
```

---

## 4. Zod + Form Validation

**Why this exists:** Keeping the Zod schema next to the component that uses it avoids a scattered `schemas/` folder that becomes a dumping ground. The schema is coupled to the form, so they live together.

**Rules:**
- Schema file: `[component-name].schema.ts` inside the same folder as the `.tsx` file.
- Export both the schema and its inferred type from the schema file.
- Use `react-hook-form` with `zodResolver` (the standard pairing with Zod).

**`src/pages/public/AuthPage/auth.schema.ts`**
```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>
```

**`src/pages/public/AuthPage/AuthPage.tsx`**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from './auth.schema'
import { useAuth } from '@/contexts/AuthContext'

export function AuthPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    await login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}
      <button type="submit" disabled={isSubmitting}>Login</button>
    </form>
  )
}
```

---

## 5. Context Pattern

**Why this exists:** React Context is appropriate for truly global state: authentication status, active theme, user preferences. The pattern keeps context clean by delegating side effects to action files — the context is a state container, not a service.

**Rules:**
- One concern per context. Don't combine auth + theme + notifications into one god-context.
- The context hook (`useAuth`, etc.) throws if used outside the provider — fail fast.
- State initialization that requires async work should be done in a `useEffect` inside the provider.

**`src/contexts/AuthContext.tsx`**
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authActions } from '@/router/actions/auth.actions'
import type { User } from '@/interfaces/components/models/User.interface'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authActions.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    const user = await authActions.login(credentials)
    setUser(user)
  }

  const logout = async () => {
    await authActions.logout()
    setUser(null)
  }

  const register = async (data: RegisterData) => {
    await authActions.register(data)
    // optionally call login automatically — user decides
  }

  const refreshToken = async () => {
    const user = await authActions.refreshToken()
    setUser(user)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, register, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

---

## 6. Custom Hook Pattern

**Why this exists:** When multiple components share the same stateful logic, the correct abstraction is a custom hook — not copy-paste, not a util function, not shoving it into a context. Hooks keep components declarative.

**Good candidates for custom hooks:**
- Debounced search with pagination (`useSearchQuery`)
- Pagination state + fetcher (`usePagination`)
- Form state that doesn't need full react-hook-form (`useControlledInput`)
- Intersection observer for infinite scroll (`useInfiniteScroll`)
- Window resize / media query (`useMediaQuery`)

**`src/hooks/useSearchQuery.ts`**
```ts
import { useState, useEffect, useCallback } from 'react'

interface UseSearchQueryOptions<T> {
  fetcher: (query: string, page: number) => Promise<{ items: T[]; total: number }>
  debounceMs?: number
}

export function useSearchQuery<T>({ fetcher, debounceMs = 300 }: UseSearchQueryOptions<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const search = useCallback(async (q: string, p: number) => {
    setIsLoading(true)
    try {
      const result = await fetcher(q, p)
      setItems(result.items)
      setTotal(result.total)
    } finally {
      setIsLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      search(query, 1)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs, search])

  useEffect(() => {
    if (page > 1) search(query, page)
  }, [page])

  return { query, setQuery, page, setPage, items, total, isLoading }
}
```

---

## 7. Vite Config + tsconfig Paths

**Why this exists:** The `@` alias eliminates relative import hell. When you move a file, you never have to fix import paths. Both Vite and TypeScript need to know about the alias — Vite for bundling, TS for type checking.

**`vite.config.ts`**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**`tsconfig.json`** (relevant section)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Installation:**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install -D @tailwindcss/vite
npm install react-router-dom zod @hookform/resolvers react-hook-form
npm install @types/node -D  # needed for path.resolve in vite.config.ts
```
