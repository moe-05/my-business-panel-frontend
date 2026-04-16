import api from "./api";
import type {
  INewSubscriptionRequest,
  ISubscriptionResponse,
  SubscriptionPlan,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

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

export const subscriptionService = {
  async create(data: INewSubscriptionRequest): Promise<ISubscriptionResponse> {
    const res = await api.post<ApiResponse<ISubscriptionResponse>>(
      "/subscription/create",
      data,
    );
    return res.data.data;
  },

  buildRequest(
    tenantId: string,
    plan: SubscriptionPlanOption,
    stripePaymentMethodId: string,
  ): INewSubscriptionRequest {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.months);

    return {
      tenant_id: tenantId,
      payment_method_id: 1,
      payment_amount: plan.price,
      details: `Suscripción plan ${plan.name} - ${plan.months} mes(es)`,
      stripe_payment_method_id: stripePaymentMethodId,
      plan: plan.plan,
      subscription_type_id: plan.id,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };
  },
};
