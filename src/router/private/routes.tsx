import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedLayout } from "./ProtectedLayout";

import { DashboardPage } from "@/pages/app/DashboardPage/DashboardPage";
import { TenantsPage } from "@/pages/app/TenantsPage";
import { TenantDetailPage } from "@/pages/app/TenantDetailPage";
import { ProfilePage } from "@/pages/app/ProfilePage";
import { ComingSoon } from "@/pages/app/ComingSoon";
import { authApi } from "@/api/auth.api";

import { getUsersPageData } from "@/router/loaders/user.loaders";
import { getBranchesPageData } from "@/router/loaders/branch.loaders";
import { getCustomersPageData } from "@/router/loaders/customer.loaders";
// import { getHaciendaStatus } from "@/router/loaders/hacienda.loaders";
import { getAllSegments } from "@/router/loaders/segment.loaders";
import { getMarginsByTenant } from "@/router/loaders/margin.loaders";
import { getProductsByTenant } from "@/router/loaders/product.loaders";

export const privateRoutes: RouteObject[] = [
  {
    path: "/app",
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "tenants", element: <TenantsPage /> },
          { path: "tenants/:tenantId", element: <TenantDetailPage /> },

          {
            path: "users",
            loader: getUsersPageData,
            lazy: async () => {
              const { UsersPage } =
                await import("@/pages/app/UsersPage/UsersPage");
              return { Component: UsersPage };
            },
          },

          {
            path: "branches",
            loader: getBranchesPageData,
            lazy: async () => {
              const { BranchesPage } =
                await import("@/pages/app/BranchesPage/BranchesPage");
              return { Component: BranchesPage };
            },
          },
          {
            path: "products",
            loader: async () => {
              const currentUser = await authApi.getCurrentUser();
              const tenantId = currentUser?.tenant?.tenant_id;
              const products = tenantId
                ? await getProductsByTenant(tenantId)
                : [];

              return { products };
            },
            lazy: async () => {
              const { ProductsPage } =
                await import("@/pages/app/ProductsPage/ProductsPage");
              return { Component: ProductsPage };
            },
          },
          {
            path: "customers",
            loader: getCustomersPageData,
            lazy: async () => {
              const { CustomersPage } =
                await import("@/pages/app/CustomersPage/CustomersPage");
              return { Component: CustomersPage };
            },
          },
          {
            path: "settings",
            loader: async () => {
              const segments = await getAllSegments();
              const currentUser = await authApi.getCurrentUser();
              const tenantId = currentUser?.tenant?.tenant_id;
              const margins = tenantId
                ? await getMarginsByTenant(tenantId)
                : [];

              return { segments, margins };
            },
            lazy: async () => {
              const { SettingsPage } =
                await import("@/pages/app/SettingsPage/SettingsPage");
              return { Component: SettingsPage };
            },
          },
          { path: "profile", element: <ProfilePage /> },

          // POS Module
          { path: "pos/sales", element: <ComingSoon title="POS - Ventas" /> },
          { path: "pos/orders", element: <ComingSoon title="POS - Órdenes" /> },
          {
            path: "pos/analytics",
            element: <ComingSoon title="POS - Análisis" />,
          },
          {
            path: "pos/settings",
            element: <ComingSoon title="POS - Configuración" />,
          },
          { path: "pos/*", element: <Navigate to="/app/pos/sales" replace /> },

          // INT (Inventory) Module
          {
            path: "int/inventory",
            element: <ComingSoon title="INT - Inventario" />,
          },
          { path: "int/stock", element: <ComingSoon title="INT - Stock" /> },
          {
            path: "int/movements",
            element: <ComingSoon title="INT - Movimientos" />,
          },
          {
            path: "int/reports",
            element: <ComingSoon title="INT - Reportes" />,
          },
          {
            path: "int/*",
            element: <Navigate to="/app/int/inventory" replace />,
          },

          // SCH (Supply Chain) Module
          {
            path: "sch/purchases",
            element: <ComingSoon title="SCH - Compras" />,
          },
          {
            path: "sch/orders",
            element: <ComingSoon title="SCH - Órdenes de Compra" />,
          },
          {
            path: "sch/suppliers",
            element: <ComingSoon title="SCH - Proveedores" />,
          },
          {
            path: "sch/analytics",
            element: <ComingSoon title="SCH - Análisis" />,
          },
          {
            path: "sch/*",
            element: <Navigate to="/app/sch/purchases" replace />,
          },

          // HR (Human Resources) Module
          {
            path: "hr/employees",
            element: <ComingSoon title="HR - Empleados" />,
          },
          { path: "hr/payroll", element: <ComingSoon title="HR - Nómina" /> },
          {
            path: "hr/attendance",
            element: <ComingSoon title="HR - Asistencia" />,
          },
          { path: "hr/reports", element: <ComingSoon title="HR - Reportes" /> },
          {
            path: "hr/*",
            element: <Navigate to="/app/hr/employees" replace />,
          },

          // FNZ (Finances) Module
          {
            path: "fnz/accounting",
            element: <ComingSoon title="FNZ - Contabilidad" />,
          },
          {
            path: "fnz/reports",
            element: <ComingSoon title="FNZ - Reportes" />,
          },
          {
            path: "fnz/budgets",
            element: <ComingSoon title="FNZ - Presupuestos" />,
          },
          {
            path: "fnz/analytics",
            element: <ComingSoon title="FNZ - Análisis" />,
          },
          {
            path: "fnz/*",
            element: <Navigate to="/app/fnz/accounting" replace />,
          },

          { path: "*", element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
];
