import type { ReturnProductPayload } from "@/interfaces/entities/ReturnTransaction.interface";

export interface CreateReturnTransactionRequest {
  sale_id: string;
  tenant_customer_id?: string;
  refund_method?: number;
  return_status_id?: number;
  return_products: ReturnProductPayload[];
}
