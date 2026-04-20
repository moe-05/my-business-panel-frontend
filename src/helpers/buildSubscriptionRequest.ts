import type { SubscriptionPlanOption } from "@/constants/subscription-plans";
import type { NewSubscriptionRequest } from "@/interfaces/api/requests/NewSubscriptionRequest.interface";

export const buildSubscriptionRequest = (
  tenantId: string,
  plan: SubscriptionPlanOption,
  stripePaymentMethodId: string,
): NewSubscriptionRequest => {
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
};
