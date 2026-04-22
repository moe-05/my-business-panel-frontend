# Simple Project Directory Structure

Use this structure for frontend-only projects: landing pages, portfolios, informational sites. No backend, no authentication.

```
my-app/
├── public/
│   └── media/                      # Static assets served as-is (favicons, og images, etc.)
│
├── src/
│   ├── assets/                     # Bundled static assets
│   │   ├── fonts/                  # .woff2 only
│   │   ├── icons/                  # .svg preferred
│   │   ├── images/                 # .webp only
│   │   └── videos/                 # .webm only
│   │
│   ├── components/
│   │   ├── layout/                 # Structural components (Header, Footer, Section, etc.)
│   │   └── ui/                     # Reusable UI components (Button, Card, Badge, etc.)
│   │
│   ├── constants/                  # Small static data objects
│   │   └── nav-links.catalog.ts
│   │
│   ├── hooks/                      # Custom hooks (useMediaQuery, useScrollPosition, etc.)
│   │
│   ├── interfaces/
│   │   └── components/
│   │       ├── layout/             # Props interfaces for layout components
│   │       └── ui/                 # Props interfaces for UI components
│   │
│   ├── pages/                      # One folder per route
│   │   ├── HomePage/
│   │   │   └── HomePage.tsx
│   │   ├── AboutPage/
│   │   │   └── AboutPage.tsx
│   │   └── ContactPage/
│   │       ├── ContactPage.tsx
│   │       └── contact.schema.ts   # Zod schema if the page has a form
│   │
│   ├── router/
│   │   └── router.tsx              # createBrowserRouter() with all routes inline
│   │
│   ├── utils/                      # Pure utility functions
│   │   └── format-date.ts
│   │
│   ├── App.tsx                     # Renders <RouterProvider router={router} />
│   ├── index.css                   # Tailwind base + CSS custom properties
│   └── main.tsx                    # Entry point
│
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key differences from the full structure

- No `src/api/` — there's no backend to talk to.
- No `src/contexts/` — no global auth or app state needed.
- No `src/router/actions/` or `src/router/loaders/` — no data fetching at route level.
- No `src/interfaces/api/` — no API contracts to type.
- No `src/services/` — no third-party service integrations.
- No `.env` — no secrets or dynamic config needed (add one if a third-party API key is required).
- `src/pages/` is flat (no `public/private` split) since there's no auth.
- `src/router/router.tsx` is simpler — no `RootLayout` with providers, just the routes.

## Minimal `src/router/router.tsx` for a simple project

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage/HomePage'
import { AboutPage } from '@/pages/AboutPage/AboutPage'
import { ContactPage } from '@/pages/ContactPage/ContactPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
])
```

## `src/App.tsx`

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router/router'

export default function App() {
  return <RouterProvider router={router} />
}
```
