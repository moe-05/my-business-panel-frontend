import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateReturnTransactionRequest } from "@/interfaces/api/requests/CreateReturnTransactionRequest.interface";
import type {
  ReturnTransaction,
  ReturnTransactionDetail,
} from "@/interfaces/entities/ReturnTransaction.interface";
import type { SaleRefundContext } from "@/interfaces/entities/SaleRefundContext.interface";

interface ReturnsListWrapper {
  results: ReturnTransaction[];
}

export interface ReturnsFilters {
  invoice_id?: string;
  tenant_customer_id?: string;
  return_status_id?: string;
  refund_method?: string;
  date_from?: string;
  date_to?: string;
}

export const returnsApi = {
  async getSaleContext(saleId: string): Promise<SaleRefundContext> {
    const response = await fetch(`${url}/returns/sale/${saleId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const json = await response.json();
    if (!response.ok) {
      const message = Array.isArray(json?.message)
        ? json.message.join(", ")
        : (json?.message ?? "No se encontró la venta");
      throw new Error(message);
    }
    return (json as ApiResponse<SaleRefundContext>).data;
  },

  async processFullRefund(
    saleId: string,
    description: string,
  ): Promise<{ message: string; return_transaction_id: string }> {
    const response = await fetch(
      `${url}/returns/sale/${saleId}/full-refund`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description }),
      },
    );
    const json = await response.json();
    if (!response.ok) {
      const message = Array.isArray(json?.message)
        ? json.message.join(", ")
        : (json?.message ?? "Error al procesar reembolso completo");
      throw new Error(message);
    }
    return (
      (json as ApiResponse<{
        message: string;
        return_transaction_id: string;
      }>).data ?? json
    );
  },

  async create(
    data: CreateReturnTransactionRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al crear el reembolso");
        throw new Error(message);
      }
      return (json as ApiResponse<{ message: string }>).data ?? json;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear el reembolso",
      );
    }
  },

  async getDetail(returnId: string): Promise<ReturnTransactionDetail> {
    const response = await fetch(`${url}/returns/${returnId}/detail`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.message ?? "Error al obtener detalle del reembolso");
    }
    return (json as ApiResponse<ReturnTransactionDetail>).data ?? json;
  },

  async list(filters: ReturnsFilters = {}): Promise<ReturnTransaction[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, value);
        }
      });
      const query = params.toString();
      const response = await fetch(
        `${url}/returns${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );
      const json: ApiResponse<ReturnsListWrapper> = await response.json();
      return json.data?.results ?? [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar reembolsos",
      );
    }
  },
};
