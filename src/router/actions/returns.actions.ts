import { returnsApi } from "@/api/returns.api";

import type { CreateReturnTransactionRequest } from "@/interfaces/api/requests/CreateReturnTransactionRequest.interface";
import type { SaleRefundContext } from "@/interfaces/entities/SaleRefundContext.interface";

export const createReturnTransaction = async (
  data: CreateReturnTransactionRequest,
): Promise<{ message: string }> => returnsApi.create(data);

export const getSaleRefundContext = async (
  saleId: string,
): Promise<SaleRefundContext> => returnsApi.getSaleContext(saleId);

export const processFullRefund = async (
  saleId: string,
): Promise<{
  message: string;
  digital_deleted: string | null;
  electronic_deleted: string | null;
}> => returnsApi.deleteFullRefund(saleId);
