// Module definitions with colors, icons, and submodules

export type ModuleId = "general" | "pos" | "int" | "sch" | "hr" | "fnz";

export interface SubModule {
  id: string;
  label: string;
  path: string;
  icon:
    | "grid"
    | "shopping-cart"
    | "package"
    | "file-text"
    | "users"
    | "settings"
    | "credit-card"
    | "trending-up"
    | "clipboard"
    | "calendar"
    | "briefcase"
    | "user"
    | "map-pin"
    | "contact"
    | "building";
  onlyRoles?: number[];
}

export interface Module {
  id: ModuleId;
  label: string;
  description: string;
  color: "blue" | "purple" | "amber" | "green" | "red";
  code: string;
  path: string;
  icon:
    | "shopping-cart"
    | "package"
    | "file-text"
    | "users"
    | "briefcase"
    | "credit-card";
  submodules: SubModule[];
  onlyRoles?: number[]; // If not specified, available to all roles
  excludeRoles?: number[]; // If specified, not available to these roles
}

export const MODULES: Record<ModuleId, Module> = {
  // General module (always available)
  general: {
    id: "general",
    label: "General",
    description: "Gestión general del sistema",
    color: "blue",
    code: "GEN",
    path: "/app",
    icon: "briefcase",
    submodules: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/app/dashboard",
        icon: "grid",
      },
      { id: "users", label: "Usuarios", path: "/app/users", icon: "users" },
      {
        id: "branches",
        label: "Sucursales",
        path: "/app/branches",
        icon: "map-pin",
      },
      {
        id: "products",
        label: "Productos",
        path: "/app/products",
        icon: "package",
      },
      {
        id: "customers",
        label: "Clientes",
        path: "/app/customers",
        icon: "contact",
      },
      {
        id: "settings",
        label: "Configuración",
        path: "/app/settings",
        icon: "settings",
      },
      {
        id: "tenants",
        label: "Tenants",
        path: "/app/tenants",
        icon: "briefcase",
        onlyRoles: [1],
      },
      { id: "profile", label: "Mi Perfil", path: "/app/profile", icon: "user" },
    ],
  },

  // POS Module - Point of Sale
  pos: {
    id: "pos",
    label: "POS",
    description: "Punto de venta y transacciones",
    color: "blue",
    code: "POS",
    path: "/app/pos",
    icon: "shopping-cart",
    submodules: [
      {
        id: "sales",
        label: "Ventas",
        path: "/app/pos/sales",
        icon: "shopping-cart",
      },
      {
        id: "orders",
        label: "Órdenes",
        path: "/app/pos/orders",
        icon: "file-text",
      },
      {
        id: "analytics",
        label: "Análisis",
        path: "/app/pos/analytics",
        icon: "trending-up",
      },
      {
        id: "settings",
        label: "Configuración",
        path: "/app/pos/settings",
        icon: "settings",
      },
    ],
  },

  // INT Module - Inventory
  int: {
    id: "int",
    label: "INT",
    description: "Gestión de inventario",
    color: "purple",
    code: "INT",
    path: "/app/int",
    icon: "package",
    submodules: [
      {
        id: "inventory",
        label: "Inventario",
        path: "/app/int/inventory",
        icon: "package",
      },
      { id: "stock", label: "Stock", path: "/app/int/stock", icon: "package" },
      {
        id: "movements",
        label: "Movimientos",
        path: "/app/int/movements",
        icon: "trending-up",
      },
      {
        id: "reports",
        label: "Reportes",
        path: "/app/int/reports",
        icon: "file-text",
      },
    ],
  },

  // SCH Module - Supply Chain / Purchase
  sch: {
    id: "sch",
    label: "SCH",
    description: "Gestión de compras",
    color: "amber",
    code: "SCH",
    path: "/app/sch",
    icon: "file-text",
    submodules: [
      {
        id: "purchases",
        label: "Compras",
        path: "/app/sch/purchases",
        icon: "shopping-cart",
      },
      {
        id: "orders",
        label: "Órdenes de Compra",
        path: "/app/sch/orders",
        icon: "file-text",
      },
      {
        id: "suppliers",
        label: "Proveedores",
        path: "/app/sch/suppliers",
        icon: "briefcase",
      },
      {
        id: "analytics",
        label: "Análisis",
        path: "/app/sch/analytics",
        icon: "trending-up",
      },
    ],
  },

  // HR Module - Human Resources
  hr: {
    id: "hr",
    label: "HR",
    description: "Gestión de recursos humanos",
    color: "green",
    code: "HR",
    path: "/app/hr",
    icon: "users",
    submodules: [
      {
        id: "employees",
        label: "Empleados",
        path: "/app/hr/employees",
        icon: "users",
      },
      {
        id: "payroll",
        label: "Nómina",
        path: "/app/hr/payroll",
        icon: "credit-card",
      },
      {
        id: "attendance",
        label: "Asistencia",
        path: "/app/hr/attendance",
        icon: "calendar",
      },
      {
        id: "reports",
        label: "Reportes",
        path: "/app/hr/reports",
        icon: "file-text",
      },
    ],
  },

  // FNZ Module - Finances
  fnz: {
    id: "fnz",
    label: "FNZ",
    description: "Gestión financiera",
    color: "red",
    code: "FNZ",
    path: "/app/fnz",
    icon: "credit-card",
    submodules: [
      {
        id: "accounting",
        label: "Contabilidad",
        path: "/app/fnz/accounting",
        icon: "briefcase",
      },
      {
        id: "reports",
        label: "Reportes",
        path: "/app/fnz/reports",
        icon: "file-text",
      },
      {
        id: "budgets",
        label: "Presupuestos",
        path: "/app/fnz/budgets",
        icon: "credit-card",
      },
      {
        id: "analytics",
        label: "Análisis",
        path: "/app/fnz/analytics",
        icon: "trending-up",
      },
    ],
  },
};

export function getModuleColor(moduleId: ModuleId): string {
  const colorMap = {
    blue: "#3b82f6",
    purple: "#a855f7",
    amber: "#f59e0b",
    green: "#22c55e",
    red: "#ef4444",
  };
  return colorMap[MODULES[moduleId].color];
}

export function getModuleColorClasses(moduleId: ModuleId) {
  const classMap = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      accent: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      accent: "text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      accent: "text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      accent: "text-green-600",
      button: "bg-green-600 hover:bg-green-700 text-white",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      accent: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
  };
  return classMap[MODULES[moduleId].color];
}
