export type SubscriptionPlan = "test" | "standard" | "premium";

export interface SubscriptionPlanOption {
  id: number;
  plan: SubscriptionPlan;
  name: string;
  price: number;
  months: number;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: 1,
    plan: "standard",
    name: "Plan Completo",
    price: 99.99,
    months: 1,
    description: "Acceso total a la plataforma",
    features: [
      "Usuarios ilimitados",
      "Sucursales ilimitadas",
      "Todos los módulos incluidos",
      "Gestión de clientes y productos",
      "Reportes y configuración avanzada",
      "Soporte incluido",
    ],
  },
];
