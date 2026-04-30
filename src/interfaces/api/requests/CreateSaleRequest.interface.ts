import type {
  SaleItemPayload,
  SalePaymentPayload,
} from "@/interfaces/entities/Sale.interface";

export interface CreateSaleRequest {
  tenant_id: string;
  branch_id: string;
  currency_id: number;
  /** Optional: walk-in / anonymous sales pueden omitir el cliente. */
  tenant_customer_id?: string | null;
  cash_register_id?: string;
  sale_condition: string;
  sale_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  is_completed: boolean;
  has_electronic_invoice: boolean;
  seller_user_id?: string;
  items: SaleItemPayload[];
  payments: SalePaymentPayload[];
}
