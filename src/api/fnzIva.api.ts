import api from "./api";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  IvaSummaryRaw,
  Withholding,
  WithholdingCandidate,
  WithholdingConfig,
  WithholdingSupplierConfig,
} from "@/interfaces/entities/FnzIva.interface";

export const fnzIvaApi = {
  async getSummary(
    tenantId: string,
    start: string,
    end: string,
  ): Promise<IvaSummaryRaw> {
    const res = await api.get<ApiResponse<IvaSummaryRaw>>(
      `/iva/summary/${tenantId}`,
      {
        params: { start, end },
      },
    );
    return res.data.data;
  },

  // --- Retenciones de IVA (FNZ-IV-06) ---

  async getWithholdingConfig(tenantId: string): Promise<WithholdingConfig> {
    const res = await api.get<ApiResponse<WithholdingConfig>>(
      `/iva/withholdings/config/${tenantId}`,
    );
    return res.data.data;
  },

  async setWithholdingAgent(
    tenantId: string,
    isAgent: boolean,
  ): Promise<{ is_agent: boolean }> {
    const res = await api.put<ApiResponse<{ is_agent: boolean }>>(
      `/iva/withholdings/config/${tenantId}/agent`,
      { is_agent: isAgent },
    );
    return res.data.data;
  },

  async setSupplierRetention(
    tenantId: string,
    supplierId: string,
    percentage: number,
  ): Promise<WithholdingSupplierConfig> {
    const res = await api.put<ApiResponse<WithholdingSupplierConfig>>(
      `/iva/withholdings/config/${tenantId}/suppliers/${supplierId}`,
      { iva_retention_percentage: percentage },
    );
    return res.data.data;
  },

  async listWithholdingCandidates(
    tenantId: string,
  ): Promise<WithholdingCandidate[]> {
    const res = await api.get<ApiResponse<WithholdingCandidate[]>>(
      `/iva/withholdings/candidates/${tenantId}`,
    );
    return res.data.data;
  },

  async listWithholdings(
    tenantId: string,
    start: string,
    end: string,
  ): Promise<Withholding[]> {
    const res = await api.get<ApiResponse<Withholding[]>>(
      `/iva/withholdings/${tenantId}`,
      { params: { start, end } },
    );
    return res.data.data;
  },

  async issueWithholding(
    tenantId: string,
    supplierInvoiceId: string,
  ): Promise<{ withholding_id: string; voucher_number: number }> {
    const res = await api.post<
      ApiResponse<{ withholding_id: string; voucher_number: number }>
    >(`/iva/withholdings/${tenantId}`, {
      supplier_invoice_id: supplierInvoiceId,
    });
    return res.data.data;
  },

  async voidWithholding(tenantId: string, withholdingId: string) {
    const res = await api.patch<ApiResponse<{ withholding_id: string }>>(
      `/iva/withholdings/${tenantId}/${withholdingId}/void`,
    );
    return res.data.data;
  },
};
