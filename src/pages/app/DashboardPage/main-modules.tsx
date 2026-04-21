import { IconBriefcase } from "@/assets/icons/IconBriefcase";
import { IconCreditCard } from "@/assets/icons/IconCreditCard";
import { IconPackage } from "@/assets/icons/IconPackage";
import { IconShoppingCart } from "@/assets/icons/IconShoppingCart";
import { IconUsers } from "@/assets/icons/IconUsers";
import type { ModuleCardProps } from "@/interfaces/components/ui/ModuleCardProps.interface";

export const mainModules: ModuleCardProps[] = [
  {
    label: "POS",
    description: "Punto de venta y transacciones en tiempo real",
    icon: <IconShoppingCart />,
    to: "/app/pos/sales",
    code: "POS",
    accentColor: "blue",
  },
  {
    label: "INT",
    description: "Gestión completa de inventario y stock",
    icon: <IconPackage />,
    to: "/app/int/inventory",
    code: "INT",
    accentColor: "purple",
  },
  {
    label: "SCH",
    description: "Administración de compras y proveedores",
    icon: <IconBriefcase />,
    to: "/app/sch/purchases",
    code: "SCH",
    accentColor: "amber",
  },
  {
    label: "HR",
    description: "Gestión de recursos humanos y nómina",
    icon: <IconUsers />,
    to: "/app/hr/employees",
    code: "HR",
    accentColor: "green",
  },
  {
    label: "FNZ",
    description: "Finanzas, contabilidad y reportes",
    icon: <IconCreditCard />,
    to: "/app/fnz/accounting",
    code: "FNZ",
    accentColor: "red",
  },
];
