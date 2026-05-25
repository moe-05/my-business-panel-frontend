export interface CreateCollectionRequest {
  sale_account_receivable_id: string;
  amount_paid: number;
  payment_method_id: number;
  currency_id?: number;
  original_amount?: number;
  exchange_rate?: number;
  payment_reference?: string;
}

export interface UpsertCollectionAlertConfigRequest {
  tenant_id?: string;
  warning_days_before_due: number;
  urgent_days_before_due: number;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
}
