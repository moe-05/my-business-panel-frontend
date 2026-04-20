export interface OnboardingSubscription {
  stripe_payment_method_id: string;
  plan: string;
  payment_method_id: number;
  payment_amount: number;
  subscription_type_id: number;
  start_date: string;
  end_date: string;
}
