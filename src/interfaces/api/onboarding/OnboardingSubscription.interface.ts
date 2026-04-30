export interface OnboardingSubscription {
  /** Opcional cuando se canjea un special_code en lugar de pagar. */
  stripe_payment_method_id?: string;
  plan: string;
  payment_method_id: number;
  payment_amount: number;
  subscription_type_id: number;
  start_date: string;
  end_date: string;
  /**
   * Código especial emitido por un superusuario para saltarse el cobro
   * de Stripe. El backend lo canjea atómicamente durante el onboarding.
   */
  special_code?: string;
}
