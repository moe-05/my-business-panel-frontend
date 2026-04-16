import type { SubscriptionPlan } from "@/constants/subscription-plans";

export interface NewSubscriptionRequest {
  tenant_id: string;
  payment_method_id: number;
  payment_amount: number;
  details: string;
  stripe_payment_method_id: string;
  plan: SubscriptionPlan;
  subscription_type_id: number;
  start_date: string;
  end_date: string;
}
