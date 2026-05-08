import { url } from ".";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  ApplicableRoyaltyRule,
  GiftableProduct,
  RoyaltyOption,
  RoyaltyOptionProduct,
  RoyaltyRule,
} from "@/interfaces/entities/Royalty.interface";

const base = `${url}/pos-royalty`;

const checkResponse = (res: Response, body: unknown) => {
  if (!res.ok) {
    const msg = (body as { message?: string })?.message ?? `Error ${res.status}`;
    throw new Error(Array.isArray(msg) ? (msg as string[]).join(", ") : msg);
  }
};

export const royaltyApi = {
  async listRules(tenantId: string): Promise<RoyaltyRule[]> {
    const res = await fetch(`${base}/rules/${tenantId}`, {
      credentials: "include",
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyRule[]>).data;
  },

  async createRule(tenantId: string, minAmount: number): Promise<RoyaltyRule> {
    const res = await fetch(`${base}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tenant_id: tenantId, min_amount: minAmount }),
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyRule>).data;
  },

  async updateRule(royaltyRuleId: string, minAmount: number): Promise<RoyaltyRule> {
    const res = await fetch(`${base}/rules/${royaltyRuleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ min_amount: minAmount }),
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyRule>).data;
  },

  async deleteRule(royaltyRuleId: string): Promise<void> {
    const res = await fetch(`${base}/rules/${royaltyRuleId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const body = await res.json().catch(() => ({}));
    checkResponse(res, body);
  },

  async createOption(data: {
    royalty_rule_id: string;
    tenant_product_group_id: string;
    quantity: number;
    scope: "any" | "specific";
  }): Promise<RoyaltyOption> {
    const res = await fetch(`${base}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyOption>).data;
  },

  async updateOption(
    royaltyOptionId: string,
    data: { quantity: number; scope: "any" | "specific" },
  ): Promise<RoyaltyOption> {
    const res = await fetch(`${base}/options/${royaltyOptionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyOption>).data;
  },

  async deleteOption(royaltyOptionId: string): Promise<void> {
    const res = await fetch(`${base}/options/${royaltyOptionId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const body = await res.json().catch(() => ({}));
    checkResponse(res, body);
  },

  async setOptionProducts(
    royaltyOptionId: string,
    productVariantIds: string[],
  ): Promise<RoyaltyOptionProduct[]> {
    const res = await fetch(`${base}/options/${royaltyOptionId}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ product_variant_ids: productVariantIds }),
    });
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<RoyaltyOptionProduct[]>).data;
  },

  async getApplicableRules(
    tenantId: string,
    amount: number,
  ): Promise<ApplicableRoyaltyRule[]> {
    const res = await fetch(
      `${base}/applicable?tenant_id=${tenantId}&amount=${amount}`,
      { credentials: "include" },
    );
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<ApplicableRoyaltyRule[]>).data;
  },

  async getGiftableProducts(tenantProductGroupId: string): Promise<GiftableProduct[]> {
    const res = await fetch(
      `${base}/giftable-products/${tenantProductGroupId}`,
      { credentials: "include" },
    );
    const body = await res.json();
    checkResponse(res, body);
    return (body as ApiResponse<GiftableProduct[]>).data;
  },
};
