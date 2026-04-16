import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { ModuleProvider } from "../context/ModuleContext";
import { ProtectedRoute } from "./ProtectedRoute";

// Layouts
import { AppLayout } from "../components/layout/AppLayout";

// Auth pages
import { LoginPage } from "../pages/auth/LoginPage";

// Onboarding pages
import { RegisterPage } from "../pages/onboarding/Step1/RegisterPage";
import { SetupTenantPage } from "../pages/onboarding/Step2/SetupTenantPage";
import { SetupHaciendaPage } from "../pages/onboarding/Step3/SetupHaciendaPage";
import { PaymentPage } from "../pages/onboarding/Step4/PaymentPage";
import { SuccessPage } from "../pages/onboarding/SuccessPage";

// App pages
import { DashboardPage } from "../pages/app/DashboardPage";
import { UsersPage } from "../pages/app/UsersPage";
import { TenantsPage } from "../pages/app/TenantsPage";
import { TenantDetailPage } from "../pages/app/TenantDetailPage";
import { BranchesPage } from "../pages/app/BranchesPage";
import { ProductsPage } from "../pages/app/ProductsPage";
import { CustomersPage } from "../pages/app/CustomersPage";
import { SettingsPage } from "../pages/app/SettingsPage";
import { ProfilePage } from "../pages/app/ProfilePage";
import { getSetupTenantData } from "./loaders/setupTenant.loader";

// Generic placeholder for modules not yet implemented
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 lg:p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-gray-700"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2
          className="text-lg font-bold text-gray-900 mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-400">
          Este módulo estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}

function AppProviders() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <ModuleProvider>
          <Outlet />
        </ModuleProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppProviders />}>
      {/* Raíz → login */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Rutas públicas */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route
        path="/auth/register/setup-tenant"
        element={<SetupTenantPage />}
        loader={getSetupTenantData}
      />
      <Route
        path="/auth/register/setup-hacienda"
        element={<SetupHaciendaPage />}
      />
      <Route path="/auth/register/payment" element={<PaymentPage />} />
      <Route path="/auth/register/success" element={<SuccessPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* POS Module Routes */}
        <Route path="pos/sales" element={<ComingSoon title="POS - Ventas" />} />
        <Route
          path="pos/orders"
          element={<ComingSoon title="POS - Órdenes" />}
        />
        <Route
          path="pos/analytics"
          element={<ComingSoon title="POS - Análisis" />}
        />
        <Route
          path="pos/settings"
          element={<ComingSoon title="POS - Configuración" />}
        />
        <Route
          path="pos/*"
          element={<Navigate to="/app/pos/sales" replace />}
        />

        {/* INT (Inventory) Module Routes */}
        <Route
          path="int/inventory"
          element={<ComingSoon title="INT - Inventario" />}
        />
        <Route path="int/stock" element={<ComingSoon title="INT - Stock" />} />
        <Route
          path="int/movements"
          element={<ComingSoon title="INT - Movimientos" />}
        />
        <Route
          path="int/reports"
          element={<ComingSoon title="INT - Reportes" />}
        />
        <Route
          path="int/*"
          element={<Navigate to="/app/int/inventory" replace />}
        />

        {/* SCH (Supply Chain) Module Routes */}
        <Route
          path="sch/purchases"
          element={<ComingSoon title="SCH - Compras" />}
        />
        <Route
          path="sch/orders"
          element={<ComingSoon title="SCH - Órdenes de Compra" />}
        />
        <Route
          path="sch/suppliers"
          element={<ComingSoon title="SCH - Proveedores" />}
        />
        <Route
          path="sch/analytics"
          element={<ComingSoon title="SCH - Análisis" />}
        />
        <Route
          path="sch/*"
          element={<Navigate to="/app/sch/purchases" replace />}
        />

        {/* HR (Human Resources) Module Routes */}
        <Route
          path="hr/employees"
          element={<ComingSoon title="HR - Empleados" />}
        />
        <Route path="hr/payroll" element={<ComingSoon title="HR - Nómina" />} />
        <Route
          path="hr/attendance"
          element={<ComingSoon title="HR - Asistencia" />}
        />
        <Route
          path="hr/reports"
          element={<ComingSoon title="HR - Reportes" />}
        />
        <Route
          path="hr/*"
          element={<Navigate to="/app/hr/employees" replace />}
        />

        {/* FNZ (Finances) Module Routes */}
        <Route
          path="fnz/accounting"
          element={<ComingSoon title="FNZ - Contabilidad" />}
        />
        <Route
          path="fnz/reports"
          element={<ComingSoon title="FNZ - Reportes" />}
        />
        <Route
          path="fnz/budgets"
          element={<ComingSoon title="FNZ - Presupuestos" />}
        />
        <Route
          path="fnz/analytics"
          element={<ComingSoon title="FNZ - Análisis" />}
        />
        <Route
          path="fnz/*"
          element={<Navigate to="/app/fnz/accounting" replace />}
        />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Route>,
  ),
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
