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
import { getAllSegments } from "@/router/loaders/segment.loaders";
import { getMarginsByTenant } from "@/router/loaders/margin.loaders";
import { getProductsPageData } from "@/router/loaders/product.loaders";
import {
  getCreateSalePageData,
  getSalesHistoryPageData,
} from "@/router/loaders/sale.loaders";
import { getCashSessionsPageData } from "@/router/loaders/cashRegister.loaders";
import { getRefundsPageData } from "@/router/loaders/returns.loaders";
import { getPromotionsPageData } from "@/router/loaders/promotion.loaders";
import { getWarehousesPageData } from "@/router/loaders/warehouse.loaders";
import { getInventoryPageData } from "@/router/loaders/inventory.loaders";
import { getMovementsPageData } from "@/router/loaders/inventoryTransfer.loaders";
import { getReportsPageData } from "@/router/loaders/inventoryReports.loaders";
import {
  getAccountsPayablePageData,
  getPaymentAlertsPageData,
  getPurchasesPageData,
  getSuppliersPageData,
} from "@/router/loaders/purchase.loaders";

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
            loader: getProductsPageData,
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
          {
            path: "pos/sales/new",
            loader: getCreateSalePageData,
            lazy: async () => {
              const { CreateSalePage } = await import(
                "@/pages/app/CreateSalePage/CreateSalePage"
              );
              return { Component: CreateSalePage };
            },
          },
          {
            path: "pos/sales",
            loader: getSalesHistoryPageData,
            lazy: async () => {
              const { SalesHistoryPage } = await import(
                "@/pages/app/SalesHistoryPage/SalesHistoryPage"
              );
              return { Component: SalesHistoryPage };
            },
          },
          {
            path: "pos/cash-sessions",
            loader: getCashSessionsPageData,
            lazy: async () => {
              const { CashSessionsPage } = await import(
                "@/pages/app/CashSessionsPage/CashSessionsPage"
              );
              return { Component: CashSessionsPage };
            },
          },
          {
            path: "pos/refunds",
            loader: getRefundsPageData,
            lazy: async () => {
              const { RefundsPage } = await import(
                "@/pages/app/RefundsPage/RefundsPage"
              );
              return { Component: RefundsPage };
            },
          },
          {
            path: "pos/promotions",
            loader: getPromotionsPageData,
            lazy: async () => {
              const { PromotionsPage } = await import(
                "@/pages/app/PromotionsPage/PromotionsPage"
              );
              return { Component: PromotionsPage };
            },
          },
          {
            path: "pos/*",
            element: <Navigate to="/app/pos/sales/new" replace />,
          },

          // INT (Inventory) Module
          {
            path: "int/inventory",
            loader: getInventoryPageData,
            lazy: async () => {
              const { InventoryPage } = await import(
                "@/pages/app/InventoryPage/InventoryPage"
              );
              return { Component: InventoryPage };
            },
          },
          {
            path: "int/warehouses",
            loader: getWarehousesPageData,
            lazy: async () => {
              const { WarehousesPage } = await import(
                "@/pages/app/WarehousesPage/WarehousesPage"
              );
              return { Component: WarehousesPage };
            },
          },
          {
            path: "int/movements",
            loader: getMovementsPageData,
            lazy: async () => {
              const { MovementsPage } = await import(
                "@/pages/app/MovementsPage/MovementsPage"
              );
              return { Component: MovementsPage };
            },
          },
          {
            path: "int/reports",
            loader: getReportsPageData,
            lazy: async () => {
              const { ReportsPage } = await import(
                "@/pages/app/ReportsPage/ReportsPage"
              );
              return { Component: ReportsPage };
            },
          },
          {
            path: "int/*",
            element: <Navigate to="/app/int/inventory" replace />,
          },

          // SCH (Supply Chain) Module
          {
            path: "sch/purchases",
            loader: getPurchasesPageData,
            lazy: async () => {
              const { PurchasesPage } = await import(
                "@/pages/app/PurchasesPage/PurchasesPage"
              );
              return { Component: PurchasesPage };
            },
          },
          {
            path: "sch/orders",
            element: <Navigate to="/app/sch/payables" replace />,
          },
          {
            path: "sch/suppliers",
            loader: getSuppliersPageData,
            lazy: async () => {
              const { SuppliersPage } = await import(
                "@/pages/app/SuppliersPage/SuppliersPage"
              );
              return { Component: SuppliersPage };
            },
          },
          {
            path: "sch/payables",
            loader: getAccountsPayablePageData,
            lazy: async () => {
              const { AccountsPayablePage } = await import(
                "@/pages/app/AccountsPayablePage/AccountsPayablePage"
              );
              return { Component: AccountsPayablePage };
            },
          },
          {
            path: "sch/analytics",
            element: <Navigate to="/app/sch/payment-alerts" replace />,
          },
          {
            path: "sch/payment-alerts",
            loader: getPaymentAlertsPageData,
            lazy: async () => {
              const { PaymentAlertsPage } = await import(
                "@/pages/app/PaymentAlertsPage/PaymentAlertsPage"
              );
              return { Component: PaymentAlertsPage };
            },
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
